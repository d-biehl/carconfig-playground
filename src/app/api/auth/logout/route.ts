import { createApiResponse, handleApiError } from '@/lib/apiValidation'
import { createMethodNotAllowedHandlers } from '@/lib/methodHandlers'

const ADMIN_SESSION_COOKIE = 'admin-session'

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Admin logout
 *     description: Logs out the current admin session and clears the session cookie
 *     security:
 *       - tokenAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: "Successfully logged out"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST() {
  try {
    const response = createApiResponse({
      message: 'Successfully logged out'
    })

    // Clear session cookie
    response.cookies.set(ADMIN_SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    })

    return response
  } catch (error) {
    return handleApiError(error, 'Logout API')
  }
}

// Add method handlers for unsupported methods
const methodHandlers = createMethodNotAllowedHandlers(['POST'])
export const TRACE = methodHandlers.TRACE
export const GET = methodHandlers.GET
export const PUT = methodHandlers.PUT
export const DELETE = methodHandlers.DELETE
export const PATCH = methodHandlers.PATCH
export const OPTIONS = methodHandlers.OPTIONS
