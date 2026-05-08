import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set(
      'redirect',
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    )
    return NextResponse.redirect(loginUrl)
  }

  // Auth routes that should redirect to dashboard if already logged in
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
