import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, createApiResponse, handleApiError } from '@/lib/apiValidation'
import { AdminUserDeleteSchema } from '@/schemas/api'
import { verifyToken } from '@/lib/jwt'
import { getLocalizedErrorMessage } from '@/lib/backendI18n'

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all users
 *     description: Retrieves all users with optional statistics (admin only)
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - name: includeStats
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include configuration statistics for each user
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete user
 *     description: Deletes a user and all associated configurations (admin only)
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserDelete'
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         description: Cannot delete admin users
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication via JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createApiResponse(
        null,
        getLocalizedErrorMessage(request, 'auth.required'),
        401
      )
    }

    const token = authHeader.split(' ')[1]
    const decodedToken = await verifyToken(token)

    if (!decodedToken || decodedToken.role !== 'admin') {
      return createApiResponse(
        null,
        getLocalizedErrorMessage(request, 'auth.required'),
        403
      )
    }

    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'

    if (includeStats) {
      // Get users with configuration counts
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              configurations: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return createApiResponse(users)
    } else {
      // Basic user list
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return createApiResponse(users)
    }
  } catch (error) {
    return handleApiError(error, 'Error fetching user')
  }
}

export async function DELETE(request: NextRequest) {
  return await validateRequest(AdminUserDeleteSchema)(
    request,
    async (request, { userId }) => {
      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            _count: {
              select: {
                configurations: true
              }
            }
          }
        })

        if (!user) {
          return createApiResponse(
            null,
            'user not found',
            404
          )
        }

        // Prevent deletion of admin users
        if (user.role === 'admin') {
          return createApiResponse(
            null,
            'Admin users cannot be deleted',
            403
          )
        }

        // Delete user (cascade will handle configurations)
        await prisma.user.delete({
          where: { id: userId }
        })

        return createApiResponse({
          message: `User successfully deleted. ${user._count.configurations} configuration(s) were also deleted.`
        })
      } catch (error) {
        return handleApiError(error, 'Error deleting users')
      }
    }
  )
}

// Handle unsupported methods with 405 Method Not Allowed
export async function TRACE() {
  return new Response(null, {
    status: 405,
    headers: {
      'Allow': 'GET, DELETE',
      'Content-Type': 'application/json'
    }
  })
}

export async function PUT() {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Allow': 'GET, DELETE',
      'Content-Type': 'application/json'
    }
  })
}

export async function POST() {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Allow': 'GET, DELETE',
      'Content-Type': 'application/json'
    }
  })
}

export async function PATCH() {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Allow': 'GET, DELETE',
      'Content-Type': 'application/json'
    }
  })
}
