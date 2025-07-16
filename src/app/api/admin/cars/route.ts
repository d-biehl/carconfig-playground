import { requireAdminAuth } from '@/lib/adminAuth'
import { createApiResponse, handleApiError } from '@/lib/apiValidation'
import { CarService } from '@/services'

/**
 * @swagger
 * /api/admin/cars:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all cars with all translations (admin only)
 *     description: Retrieves all cars with all translations for admin management
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Cars retrieved successfully
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
 *                         $ref: '#/components/schemas/Car'
 *       401:
 *         description: Unauthorized
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export const GET = requireAdminAuth(async () => {
  try {
    const cars = await CarService.getCarsForAdmin()
    return createApiResponse(cars)
  } catch (error) {
    return handleApiError(error, 'Error fetching cars for admin')
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
