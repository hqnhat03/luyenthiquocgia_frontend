import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Extract subdomain from hostname.
 * Examples:
 *   myapp.test:3000       → ""  (student)
 *   www.myapp.test        → "www" (student)
 *   quantrivien.myapp.test → "quantrivien" (admin)
 *   giaovien.myapp.test   → "giaovien" (teacher)
 *   phuhuynh.myapp.test   → "phuhuynh" (guardian)
 */
function getSubdomain(hostname: string): string {
  // Remove port if present
  const host = hostname.split(':')[0];
  const parts = host.split('.');

  // If only 1 or 2 parts (e.g. "localhost" or "myapp.test"), no subdomain
  if (parts.length <= 2) return '';

  // Return the first part as subdomain (e.g. "www", "quantrivien", "giaovien")
  return parts[0];
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const token = request.cookies.get('access_token')?.value;
  const pathname = url.pathname;

  const subdomain = getSubdomain(hostname);

  // Helper to handle protected routes with optional public paths
  const handleProtectedDomain = (domainPrefix: string, publicRoutes: string[] = []) => {
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');
    const isPublicRoute = publicRoutes.some((route) =>
      route === '/'
        ? pathname === '/' || pathname === ''
        : pathname === route || pathname.startsWith(`${route}/`)
    );

    // No token → redirect to login (unless already on auth/public page)
    if (!token && !isAuthPage && !isPublicRoute) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Has token → redirect away from auth pages
    if (token && isAuthPage) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Already rewritten → skip to avoid infinite loop
    if (pathname === domainPrefix || pathname.startsWith(`${domainPrefix}/`)) {
      return NextResponse.next();
    }

    // Rewrite to role-specific path
    url.pathname = `${domainPrefix}${pathname}`;
    return NextResponse.rewrite(url);
  };

  // ─── ADMIN: quantrivien.domain ───────────────────────────────────────────
  if (subdomain === 'quantrivien') {
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      url.pathname = pathname.replace(/^\/admin/, '') || '/';
      return NextResponse.redirect(url);
    }
    if (pathname === '/') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return handleProtectedDomain('/admin');
  }

  // ─── TEACHER: giaovien.domain ────────────────────────────────────────────
  if (subdomain === 'giaovien') {
    if (pathname === '/teacher' || pathname.startsWith('/teacher/')) {
      url.pathname = pathname.replace(/^\/teacher/, '') || '/';
      return NextResponse.redirect(url);
    }
    if (pathname === '/') {
      url.pathname = '/schedule';
      return NextResponse.redirect(url);
    }
    return handleProtectedDomain('/teacher');
  }

  // ─── GUARDIAN: phuhuynh.domain ───────────────────────────────────────────
  if (subdomain === 'phuhuynh') {
    if (pathname === '/guardian' || pathname.startsWith('/guardian/')) {
      url.pathname = pathname.replace(/^\/guardian/, '') || '/';
      return NextResponse.redirect(url);
    }
    if (pathname === '/') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return handleProtectedDomain('/guardian');
  }

  // ─── STUDENT: www.domain hoặc domain (không có subdomain) ────────────────
  // Học sinh không cần đăng nhập, tất cả route đều public
  if (subdomain === 'www' || subdomain === '') {
    // Nếu đã có prefix /student thì bỏ đi (tránh loop)
    if (pathname === '/student' || pathname.startsWith('/student/')) {
      url.pathname = pathname.replace(/^\/student/, '') || '/';
      return NextResponse.redirect(url);
    }
    // Rewrite thẳng sang /student/... không redirect, không kiểm tra token
    url.pathname = pathname === '/' ? '/student' : `/student${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Fallback
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
