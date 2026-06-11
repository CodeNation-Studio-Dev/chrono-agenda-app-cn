import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // Check if user is authenticated
  const session = await auth.api.getSession({ headers: request.headers })

  const pathname = request.nextUrl.pathname

  // Public routes that don't require verification
  const publicRoutes = ['/sign-in', '/sign-up', '/reset-password', '/verify-email', '/']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // If user is not authenticated and trying to access a protected route, redirect to sign-in
  if (!session && !isPublicRoute && !pathname.startsWith('/api')) {
    const signInUrl = new URL('/sign-in', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // If user is authenticated but email is not verified, redirect to verify-email
  // unless they're already on public routes or verify-email page
  if (
    session?.user &&
    !session.user.emailVerified &&
    !isPublicRoute &&
    pathname !== '/verify-email' &&
    !pathname.startsWith('/api')
  ) {
    const verifyUrl = new URL('/verify-email', request.url)
    return NextResponse.redirect(verifyUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protected routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
