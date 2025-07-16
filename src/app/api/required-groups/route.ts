import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, createApiResponse, handleApiError } from '@/lib/apiValidation'
import { RequiredGroupUpdateSchema } from '@/schemas/api'

/**
 * @swagger
 * /api/required-groups:
 *   get:
 *     tags:
 *       - required groups
 *     summary: Get all required groups
 *     description: Retrieves all exclusive groups and their required status
 *     responses:
 *       200:
 *         description: Required groups retrieved successfully
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
 *                         $ref: '#/components/schemas/RequiredGroup'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     tags:
 *       - required groups
 *     summary: Update required group status
 *     description: Updates whether an exclusive group is required for configurations
 *     security:
 *       - tokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequiredGroupUpdate'
 *     responses:
 *       200:
 *         description: Required group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RequiredGroup'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET() {
  try {
    const requiredGroups = await prisma.requiredGroup.findMany({
      orderBy: {
        exclusiveGroup: 'asc'
      }
    })

    return createApiResponse(requiredGroups)
  } catch (error) {
    return handleApiError(error, 'Error fetching required groups')
  }
}

export async function PUT(request: NextRequest) {
  return await validateRequest(RequiredGroupUpdateSchema)(
    request,
    async (request, { exclusiveGroup, isRequired }) => {
      try {
        const updatedGroup = await prisma.requiredGroup.update({
          where: {
            exclusiveGroup: exclusiveGroup
          },
          data: {
            isRequired: isRequired
          }
        })

        return createApiResponse(updatedGroup)
      } catch (error) {
        return handleApiError(error, 'Error updating required group')
      }
    }
  )
}

// Export TRACE handler for 405 Method Not Allowed
