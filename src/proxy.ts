import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Secret resolution — throw early if env vars missing ──────────────────────
function getLegacySecret(): Uint8Array {
  const key = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!key) throw new Error('JWT_SECRET or SESSION_SECRET env var is not set.');
  return new TextEncoder().encode(key);
}

function getSessionSecret(): Uint8Array {
  const key = process.env.SESSION_SECRET;
  if (!key) throw new Error('SESSION_SECRET env var is not set.');
  return new TextEncoder().encode(key);
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ─── Protect /admin routes ────────────────────────────────────────────────
  if (path.startsWith('/admin')) {
    // 1. Try new unified session cookie first
    const sessionCookie = req.cookies.get('carelink_session')?.value;
    if (sessionCookie) {
      try {
        await jwtVerify(sessionCookie, getSessionSecret());
        return NextResponse.next();
      } catch {
        // invalid — fall through to legacy check
      }
    }

    // 2. Fallback: legacy admin_token cookie
    const adminToken = req.cookies.get('admin_token')?.value;
    if (adminToken) {
      try {
        await jwtVerify(adminToken, getLegacySecret());
        return NextResponse.next();
      } catch {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
      }
    }

    // No valid session at all
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // ─── Protect /senior routes ───────────────────────────────────────────────
  if (path.startsWith('/senior')) {
    const sessionCookie = req.cookies.get('carelink_session')?.value;
    if (!sessionCookie) return NextResponse.redirect(new URL('/login', req.nextUrl));
    try {
      await jwtVerify(sessionCookie, getSessionSecret());
    } catch {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
  }

  // ─── Redirect already-logged-in users away from /login and / ─────────────
  if (path === '/login' || path === '/') {
    // Check unified session
    const sessionCookie = req.cookies.get('carelink_session')?.value;
    if (sessionCookie) {
      try {
        const { payload } = await jwtVerify(sessionCookie, getSessionSecret());
        const role = payload.role as string;
        if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', req.nextUrl));
        if (role === 'SENIOR') return NextResponse.redirect(new URL('/senior/dashboard', req.nextUrl));
      } catch {
        // expired / invalid — let them see login
      }
    }

    // Legacy admin_token fallback
    const adminToken = req.cookies.get('admin_token')?.value;
    if (adminToken) {
      try {
        await jwtVerify(adminToken, getLegacySecret());
        return NextResponse.redirect(new URL('/admin', req.nextUrl));
      } catch {
        // expired — ignore
      }
    }

    if (path === '/') {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
