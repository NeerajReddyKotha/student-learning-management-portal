import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('edunexus_jwt')?.value;
  const path = request.nextUrl.pathname;

  // Protected route paths
  const isProtectedPath = path.startsWith('/student') || path.startsWith('/trainer') || path.startsWith('/admin') || path.startsWith('/profile');

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/trainer/:path*', '/admin/:path*', '/profile/:path*'],
};
