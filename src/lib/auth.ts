import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

// Legacy cookie-based authentication for middleware only
// Main admin authentication uses JWT (see jwt.ts + adminAuth.ts)

const ADMIN_SESSION_COOKIE = 'admin-session'

export function isAuthenticated(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)

  if (!sessionCookie) {
    return false
  }

  try {
    const sessionData = JSON.parse(atob(sessionCookie.value))
    const now = Date.now()

    // Session valid for 1 hour
    if (sessionData.expires > now && sessionData.isAdmin) {
      return true
    }
  } catch (error) {
    logger.security('Invalid session cookie', { error })
  }

  return false
}
