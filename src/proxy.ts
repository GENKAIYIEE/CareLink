import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback_secret_key_that_is_at_least_32_chars_long'
  );
  const sessionSecret = new TextEncoder().encode(process.env.SESSION_SECRET);

  // ─── Protect /admin routes ────────────────────────────────────────────────
  if (path.startsWith('/admin')) {
    const adminToken = req.cookies.get('admin_token')?.value;
    if (!adminToken) return NextResponse.redirect(new URL('/login', req.nextUrl));
    try {
      await jwtVerify(adminToken, secret);
    } catch {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
  }

  // ─── Protect /senior routes ───────────────────────────────────────────────
  if (path.startsWith('/senior')) {
    const sessionCookie = req.cookies.get('carelink_session')?.value;
    if (!sessionCookie) return NextResponse.redirect(new URL('/login', req.nextUrl));
    try {
      await jwtVerify(sessionCookie, sessionSecret);
    } catch {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
  }

  // ─── Redirect already-logged-in users away from /login and / ─────────────
  if (path === '/login' || path === '/') {
    const adminToken = req.cookies.get('admin_token')?.value;
    if (adminToken) {
      try {
        await jwtVerify(adminToken, secret);
        return NextResponse.redirect(new URL('/admin', req.nextUrl));
      } catch {}
    }

    const sessionCookie = req.cookies.get('carelink_session')?.value;
    if (sessionCookie) {
      try {
        await jwtVerify(sessionCookie, sessionSecret);
        return NextResponse.redirect(new URL('/senior/dashboard', req.nextUrl));
      } catch {}
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
