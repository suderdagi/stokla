import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register']

/**
 * Fast first check at the edge: no session cookie means no access to the app.
 * The cookie is fully validated against the database in getCurrentUser().
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('stokla_session')
  const { pathname } = request.nextUrl

  if (!hasSession && !PUBLIC_PATHS.includes(pathname)) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
}
