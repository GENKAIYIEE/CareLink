import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

// Protected route prefixes and their required roles
const ADMIN_ROUTES = ['/admin'];
const SENIOR_ROUTES = ['/senior'];
const ADMIN_LOGIN = '/admin/login';

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('carelink_session')?.value;
  const session = token ? await decrypt(token) : null;

  const isAdminRoute = ADMIN_ROUTES.some(
    (r) => path.startsWith(r) && path !== ADMIN_LOGIN
  );
  const isSeniorRoute = SENIOR_ROUTES.some((r) => path.startsWith(r));

  // --- Redirect root to appropriate portal ---
  if (path === '/') {
    if (session?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.nextUrl));
    }
    if (session?.role === 'SENIOR') {
      return NextResponse.redirect(new URL('/senior', req.nextUrl));
    }
    return NextResponse.redirect(new URL(ADMIN_LOGIN, req.nextUrl));
  }

  // --- Protect admin routes ---
  if (isAdminRoute) {
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, req.nextUrl));
    }
  }

  // --- Protect senior routes ---
  if (isSeniorRoute) {
    if (!session || session.role !== 'SENIOR') {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, req.nextUrl));
    }
  }

  // --- Redirect already-logged-in users away from login page ---
  if (path === ADMIN_LOGIN) {
    if (session?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.nextUrl));
    }
    if (session?.role === 'SENIOR') {
      return NextResponse.redirect(new URL('/senior', req.nextUrl));
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
