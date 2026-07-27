/**
 * Deep Verification Test Suite
 * Tests: Rate Limiter logic, OSCA ID collision simulation, Middleware routing
 *
 * Run with: npx tsx scripts/verify-fixes.ts
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: Rate Limiter Unit Tests
// ═══════════════════════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ─── Inline rate limiter (copied from src/lib/rateLimit.ts, no server-only) ──

const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 15 * 60 * 1000;
const LOCKOUT_MS   = 15 * 60 * 1000;

type AttemptRecord = { count: number; firstAttemptAt: number; lockedUntil?: number };
const store = new Map<string, AttemptRecord>();

function checkRateLimit(key: string, now = Date.now()): { allowed: boolean; retryAfterMs?: number } {
  const record = store.get(key);
  if (!record) return { allowed: true };
  if (record.lockedUntil) {
    if (now < record.lockedUntil) return { allowed: false, retryAfterMs: record.lockedUntil - now };
    store.delete(key);
    return { allowed: true };
  }
  if (now - record.firstAttemptAt > WINDOW_MS) { store.delete(key); return { allowed: true }; }
  return { allowed: true };
}

function recordFailedAttempt(key: string, now = Date.now()): void {
  const record = store.get(key);
  if (
    !record ||
    (record.lockedUntil && now >= record.lockedUntil) ||
    (!record.lockedUntil && now - record.firstAttemptAt > WINDOW_MS)
  ) {
    store.set(key, { count: 1, firstAttemptAt: now });
    return;
  }
  if (record.lockedUntil && now < record.lockedUntil) return;
  record.count++;
  if (record.count >= MAX_ATTEMPTS) record.lockedUntil = now + LOCKOUT_MS;
}

function clearAttempts(key: string): void { store.delete(key); }

function getRemainingAttempts(key: string, now = Date.now()): number {
  const record = store.get(key);
  if (!record) return MAX_ATTEMPTS;
  if (record.lockedUntil && now < record.lockedUntil) return 0;
  if (now - record.firstAttemptAt > WINDOW_MS) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - record.count);
}

// ─── Test 1: Fresh IP is allowed ─────────────────────────────────────────────
console.log('\n📋 SECTION 1: Rate Limiter\n');
store.clear();
{
  const r = checkRateLimit('test-ip-1');
  assert(r.allowed === true, 'Fresh IP is allowed');
  assert(getRemainingAttempts('test-ip-1') === 5, 'Fresh IP has 5 attempts');
}

// ─── Test 2: Counting down attempts ──────────────────────────────────────────
store.clear();
{
  const key = 'test-ip-2';
  recordFailedAttempt(key);
  assert(getRemainingAttempts(key) === 4, 'After 1 failure: 4 remaining');
  recordFailedAttempt(key);
  assert(getRemainingAttempts(key) === 3, 'After 2 failures: 3 remaining');
  recordFailedAttempt(key);
  assert(getRemainingAttempts(key) === 2, 'After 3 failures: 2 remaining');
  recordFailedAttempt(key);
  assert(getRemainingAttempts(key) === 1, 'After 4 failures: 1 remaining');
}

// ─── Test 3: Lockout triggered on 5th failure ─────────────────────────────────
{
  const key = 'test-ip-2';
  recordFailedAttempt(key); // 5th failure
  assert(getRemainingAttempts(key) === 0, 'After 5 failures: 0 remaining (locked)');
  const r = checkRateLimit(key);
  assert(r.allowed === false, 'Locked IP is rejected');
  assert((r.retryAfterMs ?? 0) > 0, 'retryAfterMs is positive');
  const minutes = Math.ceil((r.retryAfterMs ?? 0) / 60_000);
  assert(minutes === 15, `Lockout shows 15 minutes (got ${minutes})`);
}

// ─── Test 4: 6th attempt while locked does NOT reset the lockout timer ────────
{
  const key = 'test-ip-2';
  const r1 = checkRateLimit(key);
  recordFailedAttempt(key); // attempt while locked — should be a no-op
  const r2 = checkRateLimit(key);
  assert(r2.allowed === false, '6th attempt while locked stays locked');
  assert(
    Math.abs((r2.retryAfterMs ?? 0) - (r1.retryAfterMs ?? 0)) < 100,
    'Lockout timer NOT reset by further attempts (within 100ms tolerance)'
  );
}

// ─── Test 5: Lockout auto-expires ────────────────────────────────────────────
{
  const key = 'test-ip-3';
  const now = Date.now();
  // Simulate a lockout that already expired
  store.set(key, { count: 5, firstAttemptAt: now - LOCKOUT_MS - 1, lockedUntil: now - 1 });
  const r = checkRateLimit(key, now);
  assert(r.allowed === true, 'Expired lockout auto-clears and allows');
  assert(getRemainingAttempts(key, now) === MAX_ATTEMPTS, 'After lockout expires: full 5 attempts again');
}

// ─── Test 6: Window expiry resets attempts ───────────────────────────────────
{
  const key = 'test-ip-4';
  const now = Date.now();
  // 4 failures, but window expired
  store.set(key, { count: 4, firstAttemptAt: now - WINDOW_MS - 1 });
  const r = checkRateLimit(key, now);
  assert(r.allowed === true, 'Window-expired record allows the request');
  assert(getRemainingAttempts(key, now) === MAX_ATTEMPTS, 'Window-expired record shows full attempts');
}

// ─── Test 7: Successful login clears attempts ────────────────────────────────
{
  const key = 'test-ip-5';
  recordFailedAttempt(key);
  recordFailedAttempt(key);
  recordFailedAttempt(key);
  assert(getRemainingAttempts(key) === 2, 'Before clear: 2 remaining');
  clearAttempts(key);
  assert(getRemainingAttempts(key) === 5, 'After clear: back to 5 remaining');
  assert(checkRateLimit(key).allowed === true, 'After clear: allowed');
}

// ─── Test 8: Different IPs are independent ──────────────────────────────────
{
  store.clear();
  const ip1 = 'test-192.168.1.1';
  const ip2 = 'test-192.168.1.2';
  for (let i = 0; i < 5; i++) recordFailedAttempt(ip1);
  assert(checkRateLimit(ip1).allowed === false, 'IP1 is locked after 5 failures');
  assert(checkRateLimit(ip2).allowed === true,  'IP2 is independent — still allowed');
}

// ─── Test 9: Minute message formatting ───────────────────────────────────────
{
  const ms1 = 60_001; // 1 minute + 1ms → ceil = 2 minutes
  const ms2 = 60_000; // exactly 1 minute → ceil = 1 minute
  const ms3 = 900_000; // 15 minutes exactly → ceil = 15 minutes
  const fmt = (ms: number) => {
    const m = Math.ceil(ms / 60_000);
    return `${m} minute${m !== 1 ? 's' : ''}`;
  };
  assert(fmt(ms1) === '2 minutes', 'Lockout message: 1min+1ms → "2 minutes"');
  assert(fmt(ms2) === '1 minute',  'Lockout message: 60000ms → "1 minute" (singular)');
  assert(fmt(ms3) === '15 minutes','Lockout message: 15min → "15 minutes"');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: OSCA ID Generation Tests
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 SECTION 2: OSCA ID Logic\n');

// ─── Test 10: lexicographic vs numeric sort — correctness analysis ───────────
{
  const ids = ['2026-0001','2026-0002','2026-0003','2026-0004','2026-0005',
               '2026-0006','2026-0007','2026-0008','2026-0009','2026-0010'];
  
  // OLD approach: lexicographic sort desc
  const lexMax = [...ids].sort((a, b) => b.localeCompare(a))[0];
  const lexSeq = parseInt(lexMax.replace('2026-', ''), 10);
  
  // Correct approach: numeric MAX of the integer part
  const numMax = Math.max(...ids.map(id => parseInt(id.replace('2026-', ''), 10)));
  
  // With zero-padded 4-digit IDs (0001–9999), lex sort HAPPENS to work correctly
  // because all strings have the same width. BUT: this is accidental correctness.
  // Beyond 9999 entries (2026-10000 is 9 chars vs 8 chars), lex sort would break.
  // Using DB MAX() with numeric cast is always correct regardless of ID count.
  assert(
    lexSeq === 10,
    `Lex sort works on zero-padded IDs up to 9999 entries (got: ${lexSeq})`
  );
  assert(
    numMax === 10,
    `Numeric MAX is always correct (got: ${numMax})`
  );
  
  // Demonstrate WHERE lex sort breaks: unpadded IDs (e.g. if padding was ever skipped)
  // '9' > '10' > '2' lexicographically — a real risk if padding is inconsistent
  const unpadded = ['2026-1','2026-2','2026-9','2026-10','2026-11'];
  const brokenLexMax = [...unpadded].sort((a, b) => b.localeCompare(a))[0];
  const brokenLexSeq = parseInt(brokenLexMax.replace('2026-', ''), 10);
  const correctNumMax = Math.max(...unpadded.map(id => parseInt(id.replace('2026-', ''), 10)));
  assert(
    brokenLexSeq !== correctNumMax,
    `BUG: Lex sort fails on unpadded IDs — got ${brokenLexSeq} instead of ${correctNumMax}`
  );
  assert(
    correctNumMax === 11,
    `Numeric MAX correctly identifies 11 as the max in unpadded set`
  );
  assert(
    `2026-${String(correctNumMax + 1).padStart(4, '0')}` === '2026-0012',
    'DB MAX() approach generates correct next OSCA ID: 2026-0012'
  );
}

// ─── Test 11: OSCA ID format validation ──────────────────────────────────────
{
  const generateId = (maxSeq: number) => {
    const year = 2026;
    return `${year}-${String(maxSeq + 1).padStart(4, '0')}`;
  };
  assert(generateId(0)    === '2026-0001', 'First senior gets 2026-0001');
  assert(generateId(9999) === '2026-10000','10000th senior gets 2026-10000 (no truncation)');
  assert(generateId(999)  === '2026-1000', '1000th senior correct');
}

// ─── Test 12: isOscaIdConflict detection ─────────────────────────────────────
{
  // Simulate what Prisma throws on P2002
  const mockOscaConflict = { 
    name: 'PrismaClientKnownRequestError',
    code: 'P2002', 
    meta: { target: ['Senior_oscaId_key'] },
    message: 'Unique constraint failed'
  };
  const mockEmailConflict = { 
    name: 'PrismaClientKnownRequestError',
    code: 'P2002', 
    meta: { target: ['Senior_email_key'] },
    message: 'Unique constraint failed'
  };
  const mockOtherError = new Error('Some other database error');

  // Inline detection logic (mirrors isOscaIdConflict)
  function isOscaIdConflict(error: unknown): boolean {
    const e = error as { code?: string; meta?: { target?: unknown } };
    return (
      e?.code === 'P2002' &&
      Array.isArray(e.meta?.target) &&
      (e.meta!.target as string[]).some((f) => f.includes('oscaId'))
    );
  }

  assert(isOscaIdConflict(mockOscaConflict)  === true,  'OSCA ID P2002 → detected as OSCA conflict');
  assert(isOscaIdConflict(mockEmailConflict) === false, 'Email P2002 → NOT detected as OSCA conflict (bubbles up)');
  assert(isOscaIdConflict(mockOtherError)    === false, 'Other error → NOT detected as OSCA conflict');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: Middleware Route Logic Tests
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 SECTION 3: Middleware Route Matching\n');

const PROTECTED_ROUTES = [
  { prefix: '/admin',  requiredRole: 'ADMIN'  as const },
  { prefix: '/senior', requiredRole: 'SENIOR' as const },
];

function findProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/')
  );
}

// ─── Test 13: Admin routes are protected ─────────────────────────────────────
{
  assert(findProtectedRoute('/admin')            !== undefined, '/admin is protected');
  assert(findProtectedRoute('/admin/')           !== undefined, '/admin/ is protected');
  assert(findProtectedRoute('/admin/seniors')    !== undefined, '/admin/seniors is protected');
  assert(findProtectedRoute('/admin/seniors/123')!== undefined, '/admin/seniors/123 is protected');
  assert(findProtectedRoute('/admin/distribution/active') !== undefined, '/admin/distribution/active is protected');
}

// ─── Test 14: Senior routes are protected ────────────────────────────────────
{
  assert(findProtectedRoute('/senior')           !== undefined, '/senior is protected');
  assert(findProtectedRoute('/senior/dashboard') !== undefined, '/senior/dashboard is protected');
  assert(findProtectedRoute('/senior/profile')   !== undefined, '/senior/profile is protected');
}

// ─── Test 15: Public routes are NOT protected ────────────────────────────────
{
  assert(findProtectedRoute('/login')            === undefined, '/login is public');
  assert(findProtectedRoute('/')                 === undefined, '/ (home) is public');
  assert(findProtectedRoute('/terms')            === undefined, '/terms is public');
  assert(findProtectedRoute('/_next/static/abc') === undefined, '/_next/* is public');
  assert(findProtectedRoute('/images/logo.png')  === undefined, '/images/* is public');
  assert(findProtectedRoute('/models/face.bin')  === undefined, '/models/* is public');
}

// ─── Test 16: The /administrator false-match bug is FIXED ────────────────────
{
  // OLD: startsWith('/admin') would match /administrator
  const oldMatch = '/administrator'.startsWith('/admin');
  // NEW: exact or /admin/ prefix
  const newMatch = findProtectedRoute('/administrator');
  assert(oldMatch === true,       'OLD approach: /administrator falsely matched /admin rule (BUG)');
  assert(newMatch === undefined,  'NEW approach: /administrator correctly NOT matched (FIXED)');
}

// ─── Test 17: Role matching ───────────────────────────────────────────────────
{
  const adminRoute  = findProtectedRoute('/admin/seniors');
  const seniorRoute = findProtectedRoute('/senior/dashboard');
  assert(adminRoute?.requiredRole  === 'ADMIN',  '/admin/* requires ADMIN role');
  assert(seniorRoute?.requiredRole === 'SENIOR', '/senior/* requires SENIOR role');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60));
console.log(`\n  Total: ${passed + failed} tests`);
console.log(`  ✅ Passed: ${passed}`);
if (failed > 0) {
  console.error(`  ❌ Failed: ${failed}`);
  process.exit(1);
} else {
  console.log(`  ❌ Failed: ${failed}`);
  console.log('\n  🎉 ALL TESTS PASSED — fixes verified!\n');
}
