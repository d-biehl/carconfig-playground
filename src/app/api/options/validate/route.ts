import { NextRequest } from 'next/server'
import { validateOptionConfiguration } from '@/lib/optionValidation'
import { ValidateOptionsRequestSchema } from '@/schemas/api'
import { validateRequest, createApiResponse, handleApiError } from '@/lib/apiValidation'

/**
 * @swagger
 * /api/options/validate:
 *   post:
 *     tags:
 *       - options
 *     summary: Validate option configuration
 *     description: Checks if the selected options are compatible with each other
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateOptionsRequest'
 *     responses:
 *       200:
 *         description: Validation result
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
 *                         isValid:
 *                           type: boolean
 *                         conflicts:
 *                           type: array
 *                           items:
 *                             type: object
 *       400:
 *         description: Invalid input data
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
  return validateRequest(ValidateOptionsRequestSchema)(
    request,
    async (request, validatedData) => {
      try {
        const { optionIds, carId } = validatedData
        const validationResult = await validateOptionConfiguration(optionIds, carId)

        return createApiResponse(validationResult)
      } catch (error) {
        return handleApiError(error, 'options validation')
      }
    }
  )
}

// Export TRACE handler for 405 Method Not Allowed
