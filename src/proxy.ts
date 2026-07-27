import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Config ───────────────────────────────────────────────────────────────────

const COOKIE_NAME        = 'carelink_session';
const LEGACY_COOKIE_NAME = 'admin_token';

const PROTECTED_ROUTES: { prefix: string; requiredRole: 'ADMIN' | 'SENIOR' }[] = [
  { prefix: '/admin',  requiredRole: 'ADMIN'  },
  { prefix: '/senior', requiredRole: 'SENIOR' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const key = process.env.SESSION_SECRET;
  if (!key) throw new Error('SESSION_SECRET env var is not set.');
  return new TextEncoder().encode(key);
}

function getLegacySecret(): Uint8Array {
  const key = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!key) throw new Error('JWT_SECRET or SESSION_SECRET env var is not set.');
  return new TextEncoder().encode(key);
}

/**
 * Decode the unified carelink_session cookie.
 * Returns null if missing, invalid, or expired.
 */
async function getUnifiedSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    return payload as { userId: string; role: 'ADMIN' | 'SENIOR'; expiresAt: string };
  } catch {
    return null;
  }
}

/**
 * Decode the legacy admin_token cookie (fallback for older sessions).
 * Returns null if missing, invalid, or expired.
 */
async function getLegacyAdminSession(request: NextRequest) {
  const token = request.cookies.get(LEGACY_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    await jwtVerify(token, getLegacySecret());
    return { role: 'ADMIN' as const };
  } catch {
    return null;
  }
}

// ─── Proxy (Next.js 16 middleware convention) ─────────────────────────────────

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Resolve effective role from either cookie
  const session       = await getUnifiedSession(req);
  const legacySession = !session ? await getLegacyAdminSession(req) : null;
  const effectiveRole = session?.role ?? legacySession?.role ?? null;

  // ── 1. Already-logged-in redirect (/ or /login → their portal) ────────────
  if (pathname === '/' || pathname === '/login') {
    if (effectiveRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.nextUrl));
    }
    if (effectiveRole === 'SENIOR') {
      return NextResponse.redirect(new URL('/senior/dashboard', req.nextUrl));
    }
    // Not logged in: redirect / to /login, let /login render normally
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    return NextResponse.next();
  }

  // ── 2. Protected route guard (/admin/**, /senior/**) ───────────────────────
  // Use exact match OR prefix/ to avoid false matches (e.g. /administrator)
  const protected_ = PROTECTED_ROUTES.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/')
  );

  if (protected_) {
    // No valid session → redirect to login
    if (!effectiveRole) {
      const loginUrl = new URL('/login', req.nextUrl);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Wrong role → redirect to own portal
    if (effectiveRole !== protected_.requiredRole) {
      const portalUrl = effectiveRole === 'ADMIN'
        ? new URL('/admin',            req.nextUrl)
        : new URL('/senior/dashboard', req.nextUrl);
      return NextResponse.redirect(portalUrl);
    }

    // Correct role — pass through, attach headers for server components
    const response = NextResponse.next();
    if (session) {
      response.headers.set('x-user-role', session.role);
      response.headers.set('x-user-id',   session.userId);
    }
    return response;
  }

  // ── 3. All other public routes — pass through ─────────────────────────────
  return NextResponse.next();
}

// ─── Matcher ─────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|bin)$).*)',
  ],
};
