import { NextRequest } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { createApiResponse, handleApiError } from '@/lib/apiValidation'

/**
 * @swagger
 * /api/auth/check:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Check authentication status
 *     description: Verifies if the current user session is authenticated
 *     security:
 *       - tokenAuth: []
 *     responses:
 *       200:
 *         description: Authentication status retrieved successfully
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
 *                         isAuthenticated:
 *                           type: boolean
 *                           description: Whether the user is authenticated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return createApiResponse(
        null,
        'Nicht authentifiziert',
        401
      )
    }

    return createApiResponse({
      isAuthenticated: true
    })
  } catch (error) {
    return handleApiError(error, 'Error checking authentication')
  }
}

// Add method handlers for unsupported methods
export async function TRACE() {
  return new Response(JSON.stringify({
    error: 'Method Not Allowed',
    message: 'TRACE method is not allowed for this endpoint'
  }), {
    status: 405,
    headers: {
      'Allow': 'GET',
      'Content-Type': 'application/json'
    }
  })
}
