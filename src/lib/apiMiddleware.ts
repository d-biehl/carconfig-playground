/**
 * API Route Middleware for HTTP Method Security
 * This middleware handles unsupported HTTP methods for API routes
 * by returning 405 Method Not Allowed responses
 */

import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']

export function apiMiddleware(request: NextRequest): NextResponse | null {
  // Only process API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return null
  }

  // Check if method is supported
  if (!ALLOWED_METHODS.includes(request.method)) {
    return new NextResponse(JSON.stringify({
      success: false,
      error: 'Method Not Allowed'
    }), {
      status: 405,
      headers: {
        'Allow': ALLOWED_METHODS.join(', '),
        'Content-Type': 'application/json'
      }
    })
  }

  return null
}
