import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserLoginRequestSchema } from '@/schemas/api'
import { validateRequest, createApiResponse, handleApiError } from '@/lib/apiValidation'

/**
 * @swagger
 * /api/auth/user-login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticates a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 minLength: 1
 *               password:
 *                 type: string
 *                 description: User password
 *                 minLength: 1
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
 *                       $ref: '#/components/schemas/User'
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

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        })

        if (!user) {
          return createApiResponse(undefined, 'Invalid email or password', 401)
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password)

        if (!isValidPassword) {
          return createApiResponse(undefined, 'Invalid email or password', 401)
        }

        // Return user without password
        const userResponse = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }

        return createApiResponse(userResponse)
      } catch (error) {
        return handleApiError(error, 'User login')
      }
    }
  )
}

// Export TRACE handler for 405 Method Not Allowed
