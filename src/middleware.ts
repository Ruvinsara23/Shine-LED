import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('admin_session')?.value
  
  // Protect all dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && session !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Redirect root to dashboard if logged in, otherwise to login
  if (request.nextUrl.pathname === '/') {
    if (session === 'authenticated') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
}
