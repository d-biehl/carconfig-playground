import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { createMethodNotAllowedHandlers } from '@/lib/methodHandlers'

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Returns the current user's data if the provided token is valid
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user_123"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     role:
 *                       type: string
 *                       example: "user"
 *       401:
 *         description: Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Token ungültig"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Server-Fehler"
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token fehlt oder ungültig' },
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token)

      if (!decoded || !decoded.userId) {
        return NextResponse.json(
          { success: false, error: 'Token ungültig' },
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Get current user data from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      return NextResponse.json({
        success: true,
        data: user
      })

    } catch (tokenError) {
      console.error('Token verification error:', tokenError)
      return NextResponse.json(
        { success: false, error: 'Token ungültig' },
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { success: false, error: 'Server-Fehler' },
      { status: 500 }
    )
  }
}

// Add method handlers for unsupported methods
const methodHandlers = createMethodNotAllowedHandlers(['GET'])
export const TRACE = methodHandlers.TRACE
export const POST = methodHandlers.POST
export const PUT = methodHandlers.PUT
export const DELETE = methodHandlers.DELETE
export const PATCH = methodHandlers.PATCH
export const OPTIONS = methodHandlers.OPTIONS
