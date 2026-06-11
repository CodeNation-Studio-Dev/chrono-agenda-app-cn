import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE_NAMES = [
  '__Secure-better-auth.session_token',
  'better-auth.session_token',
  '__Secure-better-auth-session_token',
  'better-auth-session_token',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/sign-in', '/sign-up', '/reset-password', '/verify-email', '/']
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))

  const hasSessionCookie = SESSION_COOKIE_NAMES.some((cookieName) => Boolean(request.cookies.get(cookieName)?.value))

  // If user is not authenticated and trying to access a protected route, redirect to sign-in
  if (!hasSessionCookie && !isPublicRoute && !pathname.startsWith('/api')) {
    const signInUrl = new URL('/sign-in', request.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protected routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
