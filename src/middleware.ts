import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

// Protected route prefixes and their required roles
const ADMIN_ROUTES = ['/admin'];
const ADMIN_LOGIN = '/admin/login';

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('carelink_session')?.value;
  const session = token ? await decrypt(token) : null;

  const isAdminRoute = ADMIN_ROUTES.some(
    (r) => path.startsWith(r) && path !== ADMIN_LOGIN
  );

  // --- Redirect root to appropriate admin page ---
  if (path === '/') {
    if (session?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.nextUrl));
    }
    return NextResponse.redirect(new URL(ADMIN_LOGIN, req.nextUrl));
  }


  // --- Protect admin routes ---
  if (isAdminRoute) {
    if (!session || session.role !== 'admin') {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, req.nextUrl));
    }
  }

  // --- Redirect already-logged-in users away from login pages ---
  if (path === ADMIN_LOGIN && session?.role === 'admin') {
    return NextResponse.redirect(new URL('/admin', req.nextUrl));
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
