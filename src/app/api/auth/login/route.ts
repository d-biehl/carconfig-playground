import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/jwt'
import { UserLoginRequestSchema } from '@/schemas/api'
import { validateRequest, createApiResponse, handleApiError } from '@/lib/apiValidation'
import { createMethodNotAllowedHandlers } from '@/lib/methodHandlers'

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Admin login
 *     description: Authenticates an administrator and creates a session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Successfully logged in
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
 *                           example: "Successfully logged in"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid login credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request: NextRequest) {
  return validateRequest(UserLoginRequestSchema)(
    request,
    async (request, validatedData) => {
      try {
        const { email, password } = validatedData

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true
          }
        })

        if (!user) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return createApiResponse(undefined, 'Invalid credentials', 401)
        }

        const isValidPassword = await bcrypt.compare(password, user.password)

        if (!isValidPassword) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return createApiResponse(undefined, 'Invalid credentials', 401)
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user

        // JWT-Token generieren
        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role
        })

        return createApiResponse({
          user: userWithoutPassword,
          token
        }, undefined, 200)
      } catch (error) {
        console.error('Login error:', error)
        return handleApiError(error, 'User login')
      }
    }
  )
}

// Add method handlers for unsupported methods
const methodHandlers = createMethodNotAllowedHandlers(['POST'])
export const TRACE = methodHandlers.TRACE
export const GET = methodHandlers.GET
export const PUT = methodHandlers.PUT
export const DELETE = methodHandlers.DELETE
export const PATCH = methodHandlers.PATCH
export const OPTIONS = methodHandlers.OPTIONS
