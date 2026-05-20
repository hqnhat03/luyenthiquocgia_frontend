import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const token = request.cookies.get('access_token')?.value;

  // Define domains from env
  const baseDomain = process.env.NEXT_PUBLIC_DOMAIN;
  const adminDomain = baseDomain;
  const teacherDomain = `teacher.${baseDomain}`;
  const studentDomain = `student.${baseDomain}`;
  const guardianDomain = `guardian.${baseDomain}`;

  // Extract the main part of the hostname (removing port if present)
  const currentHost = hostname.split(':')[0];
  const pathname = url.pathname;

  // Helper to handle protected routes
  const handleProtectedDomain = (domainRewritingPath: string, publicRoutes: string[] = []) => {
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isPublicRoute = publicRoutes.some((route) =>
      route === '/'
        ? pathname === '/' || pathname === ''
        : pathname === route || pathname.startsWith(`${route}/`)
    );

    // If no token and trying to access protected page, redirect to login
    if (!token && !isAuthPage && !isPublicRoute) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // If has token and trying to access auth page, redirect to home
    if (token && isAuthPage) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // If already rewritten (path starts with domain prefix), skip rewrite to avoid loops
    if (pathname === domainRewritingPath || pathname.startsWith(`${domainRewritingPath}/`)) {
      return NextResponse.next();
    }

    // Rewrite to domain-specific path
    url.pathname = `${domainRewritingPath}${pathname}`;
    return NextResponse.rewrite(url);
  };

  // Logic for rewriting based on hostname
  if (currentHost === adminDomain) {
    // Nếu truy cập domain admin mà có prefix /admin thì redirect bỏ prefix đó đi
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const newPathname = pathname.replace(/^\/admin/, '') || '/';
      url.pathname = newPathname;
      return NextResponse.redirect(url);
    }

    // Redirect root to dashboard
    if (pathname === '/') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return handleProtectedDomain('/admin');
  }

  if (currentHost === teacherDomain) {
    // Nếu truy cập domain teacher mà có prefix /teacher thì redirect bỏ prefix đó đi
    if (pathname === '/teacher' || pathname.startsWith('/teacher/')) {
      const newPathname = pathname.replace(/^\/teacher/, '') || '/';
      url.pathname = newPathname;
      return NextResponse.redirect(url);
    }

    // Redirect root to schedule
    if (pathname === '/') {
      url.pathname = '/schedule';
      return NextResponse.redirect(url);
    }

    return handleProtectedDomain('/teacher');
  }

  if (currentHost === studentDomain) {
    // Nếu truy cập domain student mà có prefix /student thì redirect bỏ prefix đó đi
    if (pathname === '/student' || pathname.startsWith('/student/')) {
      const newPathname = pathname.replace(/^\/student/, '') || '/';
      url.pathname = newPathname;
      return NextResponse.redirect(url);
    }
    return handleProtectedDomain('/student', ['/', '/courses']);
  }

  if (currentHost === guardianDomain) {
    // Nếu truy cập domain guardian mà có prefix /guardian thì redirect bỏ prefix đó đi
    if (pathname === '/guardian' || pathname.startsWith('/guardian/')) {
      const newPathname = pathname.replace(/^\/guardian/, '') || '/';
      url.pathname = newPathname;
      return NextResponse.redirect(url);
    }

    // Redirect root to dashboard
    if (pathname === '/') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return handleProtectedDomain('/guardian');
  }

  // Fallback or default behavior
  return NextResponse.next();
}

// Config to match all paths except for static files and api
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
