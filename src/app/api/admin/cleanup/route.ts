import { prisma } from '@/lib/prisma'
import { createApiResponse, handleApiError } from '@/lib/apiValidation'
import { getLocalizedErrorMessage } from '@/lib/backendI18n'
import { verifyToken } from '@/lib/jwt'
import { NextRequest } from 'next/server'

/**
 * @swagger
 * /api/admin/cleanup:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete all demo users and their configurations
 *     description: Deletes demo users (identified by isRegistered = false) and their associated configurations (admin only)
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Demo users and configurations deleted successfully
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
 *                         deletedUsers:
 *                           type: number
 *                         deletedConfigurations:
 *                           type: number
 *                         message:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function DELETE(request: NextRequest) {
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
    }    // Simple auth check - if request comes to /api/admin/* it's already from admin context
    // The AdminAuthGuard component ensures only authenticated admins can access this
    const userAgent = request.headers.get('user-agent')

    // Basic validation that this is a legitimate browser request
    if (!userAgent) {
      return createApiResponse(
        null,
        getLocalizedErrorMessage(request, 'auth.required'),
        401
      )
    }

    // First, get all demo users (users with isRegistered = false)
    // This is much cleaner than email pattern matching
    const demoUsers = await prisma.user.findMany({
      where: {
        AND: [
          {
            role: {
              not: 'admin'
            }
          },
          {
            isRegistered: false
          }
        ]
      },
      select: {
        id: true,
        email: true,
        isRegistered: true
      }
    })

    const userIds = demoUsers.map(user => user.id)

    if (userIds.length === 0) {
      return createApiResponse({
        deletedUsers: 0,
        deletedConfigurations: 0,
        message: getLocalizedErrorMessage(request, 'cleanup.no_demo_users')
      })
    }

    // Delete all configuration options for configurations owned by demo users
    const configurationsToDelete = await prisma.configuration.findMany({
      where: {
        userId: {
          in: userIds
        }
      },
      select: {
        id: true
      }
    })

    const configurationIds = configurationsToDelete.map(config => config.id)

    // Delete configuration options first (due to foreign key constraints)
    if (configurationIds.length > 0) {
      await prisma.configurationOption.deleteMany({
        where: {
          configurationId: {
            in: configurationIds
          }
        }
      })
    }

    // Delete configurations
    const deletedConfigurations = await prisma.configuration.deleteMany({
      where: {
        userId: {
          in: userIds
        }
      }
    })

    // Delete demo users (only those with isRegistered = false)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        AND: [
          {
            role: {
              not: 'admin'
            }
          },
          {
            isRegistered: false
          }
        ]
      }
    })

    return createApiResponse({
      deletedUsers: deletedUsers.count,
      deletedConfigurations: deletedConfigurations.count,
      message: getLocalizedErrorMessage(request, 'cleanup.success', {
        deletedUsers: deletedUsers.count,
        deletedConfigurations: deletedConfigurations.count
      })
    })
  } catch (error) {
    return handleApiError(error, 'Error cleaning up demo data', request)
  }
}

// Handle unsupported methods with 405 Method Not Allowed
export async function TRACE() {
  return new Response(null, {
    status: 405,
    headers: {
      'Allow': 'DELETE',
      'Content-Type': 'application/json'
    }
  })
}

export async function GET() {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Allow': 'DELETE',
      'Content-Type': 'application/json'
    }
  })
}

export async function PUT() {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Allow': 'DELETE',
      'Content-Type': 'application/json'
    }
  })
}

export async function POST() {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Allow': 'DELETE',
      'Content-Type': 'application/json'
    }
  })
}

export async function PATCH() {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Allow': 'DELETE',
      'Content-Type': 'application/json'
    }
  })
}
