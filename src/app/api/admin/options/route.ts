import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/adminAuth'
import { createApiResponse, handleApiError } from '@/lib/apiValidation'

/**
 * @swagger
 * /api/admin/options:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all options with all translations (admin only)
 *     description: Retrieves all options with all translations for admin management
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       additionalProperties:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Option'
 *       401:
 *         description: Unauthorized
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export const GET = requireAdminAuth(async () => {
  try {
    const options = await prisma.option.findMany({
      include: {
        translations: {
          orderBy: {
            locale: 'asc'
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    // Group options by category for better organization
    const groupedOptions = options.reduce((acc, option) => {
      const category = option.category || 'Ungrouped'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(option)
      return acc
    }, {} as Record<string, typeof options>)

    return createApiResponse(groupedOptions)
  } catch (error) {
    return handleApiError(error, 'Error fetching options for admin')
  }
})

// Handle unsupported methods with 405 Method Not Allowed
export async function TRACE() {
  return new Response(null, {
    status: 405,
    headers: {
      'Allow': 'GET',
      'Content-Type': 'application/json'
    }
  })
}

export async function PUT() {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Allow': 'GET',
      'Content-Type': 'application/json'
    }
  })
}

export async function POST() {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Allow': 'GET',
      'Content-Type': 'application/json'
    }
  })
}

export async function DELETE() {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Allow': 'GET',
      'Content-Type': 'application/json'
    }
  })
}

export async function PATCH() {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Allow': 'GET',
      'Content-Type': 'application/json'
    }
  })
}
