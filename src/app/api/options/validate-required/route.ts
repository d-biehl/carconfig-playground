import { NextRequest } from 'next/server'
import { validateRequiredOptions } from '@/lib/optionValidation'
import { z } from 'zod'
import { validateRequest, createApiResponse, handleApiError } from '@/lib/apiValidation'

const ValidateRequiredOptionsSchema = z.object({
  selectedOptionIds: z.array(z.string()),
  carId: z.string()
})

/**
 * @swagger
 * /api/options/validate-required:
 *   post:
 *     tags:
 *       - Options
 *     summary: Validate required options
 *     description: Checks if all required options are selected for a given car configuration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selectedOptionIds
 *               - carId
 *             properties:
 *               selectedOptionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of selected option IDs
 *               carId:
 *                 type: string
 *                 description: Car ID to validate against
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                     missingRequired:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Option'
 *                     message:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request: NextRequest) {
  return validateRequest(ValidateRequiredOptionsSchema)(
    request,
    async (request, validatedData) => {
      try {
        const { selectedOptionIds, carId } = validatedData
        const validationResult = await validateRequiredOptions(selectedOptionIds, carId)

        return createApiResponse(validationResult)
      } catch (error) {
        return handleApiError(error, 'required options validation')
      }
    }
  )
}

// Export TRACE handler for 405 Method Not Allowed
