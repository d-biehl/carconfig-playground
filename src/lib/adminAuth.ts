import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export function requireAdminAuth<T = unknown>(handler: (request: NextRequest, context: T) => Promise<Response>) {
  return async (request: NextRequest, context: T) => {
    try {
      // Try cookie-based authentication first (for admin panel)
      const ADMIN_SESSION_COOKIE = 'admin-session'
      const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)

      if (sessionCookie) {
        try {
          const sessionData = JSON.parse(atob(sessionCookie.value))
          const now = Date.now()

          // Session valid for 1 hour and is admin
          // Additional security: check for realistic session structure and timing
          if (sessionData.expires > now &&
              sessionData.isAdmin === true &&
              sessionData.userId &&
              typeof sessionData.userId === 'string' &&
              sessionData.userId.length > 5 &&
              sessionData.expires < now + 3600000) { // Max 1 hour from now

            // Verify user still exists and is admin
            const user = await prisma.user.findUnique({
              where: { id: sessionData.userId },
              select: { id: true, role: true }
            })

            if (user && user.role === 'admin') {
              return handler(request, context)
            }
          }
        } catch (error) {
          // Only log session parsing errors, not normal expiry
          if (error instanceof SyntaxError) {
            logger.security('Invalid admin session cookie format')
          }
        }
      }

      // Fallback to JWT token authentication
      const authHeader = request.headers.get('authorization')

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.security('Missing or invalid authorization header for admin endpoint')
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      const token = authHeader.substring(7)

      // Reject obvious test/placeholder tokens
      if (token === '[Filtered]' || token === 'test' || token === 'placeholder' || token.length < 10) {
        logger.security('Rejected test/placeholder token for admin endpoint')
        return NextResponse.json(
          { success: false, error: 'Invalid token format' },
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Verify JWT token
      const decoded = verifyToken(token)
      if (!decoded || !decoded.userId) {
        logger.security('JWT token verification failed for admin endpoint')
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if user exists and is admin
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, email: true }
      })

      if (!user) {
        logger.security('User not found for admin endpoint', { userId: decoded.userId })
        return NextResponse.json(
          { success: false, error: 'User not found' },
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      if (user.role !== 'admin') {
        logger.security('Non-admin user attempted admin access', {
          userId: user.id,
          email: user.email,
          role: user.role
        })
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // If authenticated as admin, continue
      return handler(request, context)
    } catch (error) {
      logger.security('Admin auth middleware error', { component: 'admin_auth' }, error as Error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}
