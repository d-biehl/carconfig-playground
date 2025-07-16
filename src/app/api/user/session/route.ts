import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, createApiResponse, handleApiError } from '@/lib/apiValidation'
import { UserSessionSchema } from '@/schemas/api'

/**
 * @swagger
 * /api/user/session:
 *   post:
 *     tags:
 *       - User Session
 *     summary: Manage user session
 *     description: Creates or retrieves a user session for demo purposes
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSession'
 *     responses:
 *       200:
 *         description: User session managed successfully
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
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         sessionId:
 *                           type: string
 *                           description: Only present for new sessions
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request: NextRequest) {
  return await validateRequest(UserSessionSchema)(
    request,
    async (request, { sessionId, userId }) => {
      try {
        // If userId is provided, verify it exists
        if (userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId }
          })

          if (user) {
            return createApiResponse({
              id: user.id,
              name: user.name,
              email: user.email
            })
          }
        }

        // If sessionId is provided, try to find user by email pattern
        if (sessionId) {
          const user = await prisma.user.findFirst({
            where: {
              email: {
                contains: sessionId
              }
            }
          })

          if (user) {
            return createApiResponse({
              id: user.id,
              name: user.name,
              email: user.email
            })
          }
        }

        // Create new session user
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const user = await prisma.user.create({
          data: {
            email: `user_${newSessionId}@demo.com`,
            name: `Demo User ${newSessionId.slice(-8)}`,
            password: 'demo123',
            role: 'user',
            isRegistered: false // Mark as demo user
          }
        })

        return createApiResponse({
          id: user.id,
          name: user.name,
          email: user.email,
          sessionId: newSessionId
        })
      } catch (error) {
        return handleApiError(error, 'Error with usersitzungsverwaltung')
      }
    }
  )
}

// Export TRACE handler for 405 Method Not Allowed
