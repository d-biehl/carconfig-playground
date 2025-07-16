import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/jwt'
import { RegisterRequestSchema } from '@/schemas/api'
import { validateRequest, createApiResponse, handleApiError } from '@/lib/apiValidation'
import { createMethodNotAllowedHandlers } from '@/lib/methodHandlers'

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register user
 *     description: Creates a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: User successfully registered
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           description: JWT authentication token
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
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
  return validateRequest(RegisterRequestSchema)(
    request,
    async (request, validatedData) => {
      try {
        const { email, password, name } = validatedData

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        })

        if (existingUser) {
          return createApiResponse(
            undefined,
            'Ein user mit dieser Email-Adresse existiert bereits',
            409
          )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: name.trim(),
            password: hashedPassword,
            role: 'user',
            isRegistered: true // Mark as registered user
          }
        })

        // Return user without password and with token
        const userResponse = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }

        // JWT-Token generieren
        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role
        })

        return createApiResponse({
          user: userResponse,
          token
        })
      } catch (error) {
        return handleApiError(error, 'User registration')
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
