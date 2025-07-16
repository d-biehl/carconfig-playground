import { prisma } from '@/lib/prisma'
import { createApiResponse, handleApiError } from '@/lib/apiValidation'

/**
 * @swagger
 * /api/user/demo:
 *   get:
 *     tags:
 *       - User Demo
 *     summary: Create demo user
 *     description: Creates a unique demo user for testing purposes
 *     responses:
 *       200:
 *         description: Demo user created successfully
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
 *                         id:
 *                           type: string
 *                           description: User ID
 *                         name:
 *                           type: string
 *                           description: Demo user name
 *                         email:
 *                           type: string
 *                           description: Demo user email
 *                         sessionId:
 *                           type: string
 *                           description: Unique session identifier
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET() {
  try {
    // Generate a unique session ID for this browser session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create a unique demo user for this session
    const user = await prisma.user.create({
      data: {
        email: `user_${sessionId}@demo.com`,
        name: `Demo User ${sessionId.slice(-8)}`,
        password: 'demo123',
        role: 'user',
        isRegistered: false // Mark as demo user
      }
    })

    return createApiResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      sessionId: sessionId
    })
  } catch (error) {
    return handleApiError(error, 'Error creating Demo-users')
  }
}

// Export TRACE handler for 405 Method Not Allowed
