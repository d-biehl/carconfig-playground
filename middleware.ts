import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import createMiddleware from 'next-intl/middleware'
import { logger } from '@/lib/logger'
import { apiMiddleware } from '@/lib/apiMiddleware'

const intlMiddleware = createMiddleware({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  localePrefix: 'never'
})

export function middleware(request: NextRequest) {
  // 1. API Route Method Security - Handle unsupported methods for API routes
  const apiResponse = apiMiddleware(request)
  if (apiResponse) {
    return apiResponse
  }

  // 2. HTTP Method Security - Return 405 for unsupported methods (non-API routes)
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']
  if (!request.nextUrl.pathname.startsWith('/api/') && !allowedMethods.includes(request.method)) {
    logger.security(`Unsupported HTTP method ${request.method} on ${request.nextUrl.pathname}`)
    return new NextResponse('Method Not Allowed', {
      status: 405,
      headers: {
        'Allow': allowedMethods.join(', ')
      }
    })
  }

  const intlResponse = intlMiddleware(request)

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (request.nextUrl.pathname === '/admin/login') {
      return intlResponse || NextResponse.next()
    }

    const isAuth = isAuthenticated(request)

    if (!isAuth) {
      logger.security(`Unauthorized admin access attempt: ${request.nextUrl.pathname}`)
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return intlResponse || NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths including API routes for HTTP method security
     * Exclude only static files and assets
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
