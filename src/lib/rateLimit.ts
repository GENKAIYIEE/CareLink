import 'server-only';

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 5;               // Max failed logins before lockout
const WINDOW_MS    = 15 * 60 * 1000; // 15-minute sliding window
const LOCKOUT_MS   = 15 * 60 * 1000; // 15-minute lockout after exceeding limit

// ─── State ────────────────────────────────────────────────────────────────────

type AttemptRecord = {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
};

// In-memory store. Scoped to a single server process — sufficient for
// single-instance deployments (Vercel single-region, single VPS).
// If you ever scale horizontally, migrate this to Upstash Redis.
const store = new Map<string, AttemptRecord>();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check whether a key (IP address) is currently rate-limited.
 * Returns { allowed: true } if the request can proceed.
 * Returns { allowed: false, retryAfterMs } if locked out.
 */
export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now    = Date.now();
  const record = store.get(key);

  if (!record) return { allowed: true };

  // Currently locked out
  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      return { allowed: false, retryAfterMs: record.lockedUntil - now };
    }
    // Lockout expired — reset
    store.delete(key);
    return { allowed: true };
  }

  // Sliding window expired — reset
  if (now - record.firstAttemptAt > WINDOW_MS) {
    store.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt for the given key.
 * Applies a lockout once MAX_ATTEMPTS is reached.
 */
export function recordFailedAttempt(key: string): void {
  const now    = Date.now();
  const record = store.get(key);

  // No record, locked-out-but-expired, or window expired — start fresh
  if (
    !record ||
    (record.lockedUntil && now >= record.lockedUntil) ||
    (!record.lockedUntil && now - record.firstAttemptAt > WINDOW_MS)
  ) {
    store.set(key, { count: 1, firstAttemptAt: now });
    return;
  }

  // Still within an active lockout — do not increment (already locked)
  if (record.lockedUntil && now < record.lockedUntil) return;

  record.count++;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
  }
}

/**
 * Clear all failed attempts for a key (call after successful login).
 */
export function clearAttempts(key: string): void {
  store.delete(key);
}

/**
 * Returns remaining attempts before lockout, or 0 if locked.
 */
export function getRemainingAttempts(key: string): number {
  const now    = Date.now();
  const record = store.get(key);

  if (!record) return MAX_ATTEMPTS;
  if (record.lockedUntil && now < record.lockedUntil) return 0;
  if (now - record.firstAttemptAt > WINDOW_MS) return MAX_ATTEMPTS;

  return Math.max(0, MAX_ATTEMPTS - record.count);
}
