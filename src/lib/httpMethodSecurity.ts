/**
 * HTTP Method Security Utilities
 * Provides consistent 405 Method Not Allowed responses for unsupported HTTP methods
 */

import { NextResponse } from 'next/server'

/**
 * Creates a 405 Method Not Allowed response for unsupported HTTP methods
 * @param allowedMethods Array of allowed HTTP methods for this endpoint
 * @returns NextResponse with 405 status and proper Allow header
 */
export function createMethodNotAllowedResponse(allowedMethods: string[]): NextResponse {
  return new NextResponse(JSON.stringify({
    success: false,
    error: 'Method Not Allowed'
  }), {
    status: 405,
    headers: {
      'Allow': allowedMethods.join(', '),
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Standard TRACE method handler that returns 405 Method Not Allowed
 * Should be exported as TRACE from API route files
 */
export function TRACE() {
  return new NextResponse(JSON.stringify({
    success: false,
    error: 'Method Not Allowed'
  }), {
    status: 405,
    headers: {
      'Allow': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Creates method handlers for common unsupported methods
 * @param supportedMethods Array of methods that the endpoint supports
 * @returns Object with method handlers for unsupported methods
 */
export function createUnsupportedMethodHandlers(supportedMethods: string[]) {
  const allMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'TRACE']
  const unsupportedMethods = allMethods.filter(method => !supportedMethods.includes(method))

  const handlers: Record<string, () => NextResponse> = {}

  unsupportedMethods.forEach(method => {
    handlers[method] = () => createMethodNotAllowedResponse(supportedMethods)
  })

  return handlers
}
