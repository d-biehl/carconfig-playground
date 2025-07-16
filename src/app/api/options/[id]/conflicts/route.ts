import { NextRequest } from 'next/server'
import { getConflictingOptions } from '@/lib/optionValidation'
import { createApiResponse, handleApiError } from '@/lib/apiValidation'

/**
 * @swagger
 * /api/options/{id}/conflicts:
 *   get:
 *     tags:
 *       - options
 *     summary: Get conflicting options
 *     description: Retrieves all options that conflict with the specified option
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: option ID to check conflicts for
 *     responses:
 *       200:
 *         description: Conflicting options retrieved successfully
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
 *                         conflictingoptionIds:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Array of conflicting option IDs
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: optionId } = await params

    if (!optionId) {
      return createApiResponse(
        null,
        'option ID is required',
        400
      )
    }

    const conflictingOptionIds = await getConflictingOptions(optionId)

    return createApiResponse({ conflictingOptionIds })
  } catch (error) {
    return handleApiError(error, 'Error fetching konfliktierenden optionen')
  }
}

// Export TRACE handler for 405 Method Not Allowed
