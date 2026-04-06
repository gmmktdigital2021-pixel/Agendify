import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Desabilitado temporariamente para construir o frontend com dados mockados.
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
  ],
}
