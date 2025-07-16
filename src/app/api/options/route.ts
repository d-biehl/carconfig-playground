import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/adminAuth'
import { createApiResponse, handleApiError, validateQueryParams } from '@/lib/apiValidation'
import { CreateOptionRequestSchema, OptionsQuerySchema } from '@/schemas/api'
import { OptionService } from '@/services'

/**
 * @swagger
 * /api/options:
 *   get:
 *     tags:
 *       - options
 *     summary: Get all options
 *     description: Retrieves all options with translations grouped by category
 *     parameters:
 *       - name: locale
 *         in: query
 *         schema:
 *           type: string
 *           enum: [de, en]
 *         description: Language locale for translations
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
 *                           $ref: '#/components/schemas/option'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     tags:
 *       - options
 *     summary: Create new option
 *     description: Creates a new option with translations (admin only)
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOptionRequest'
 *     responses:
 *       201:
 *         description: Option created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/option'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request: NextRequest) {
  return validateQueryParams(OptionsQuerySchema)(
    request,
    async (request, validatedParams) => {
      try {
        const locale = validatedParams.locale || 'de'

        const groupedOptions = await OptionService.getOptions({
          grouped: true,
          includeTranslations: true,
          locale
        })

        return createApiResponse(groupedOptions)
      } catch (error) {
        return handleApiError(error, 'Options GET')
      }
    }
  )
}

export const POST = requireAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()

    // Parse with lenient schema
    const validatedData = CreateOptionRequestSchema.parse(body)

    // Apply business validation if needed (basic validation for empty strings)
    const validationErrors: Record<string, string> = {}

    if (!validatedData.name || validatedData.name.trim().length === 0) {
      validationErrors.name = 'Name ist erforderlich'
    }
    if (!validatedData.category || validatedData.category.trim().length === 0) {
      validationErrors.category = 'Kategorie ist erforderlich'
    }

    // Validate translations if provided
    if (validatedData.translations && validatedData.translations.length > 0) {
      const invalidTranslations = validatedData.translations.filter(t =>
        !t.locale || t.locale.trim().length === 0
      )
      if (invalidTranslations.length > 0) {
        validationErrors.translations = 'Locale is required for all translations'
      }
    }

    // Return validation errors if any
    if (Object.keys(validationErrors).length > 0) {
      return createApiResponse(null, 'Validation error', 400)
    }

    // Transform for service layer
    const optionInput = {
      ...validatedData,
      translations: validatedData.translations?.map(t => ({
        locale: t.locale,
        name: t.name || '',
        category: t.category || '',
        description: t.description || '',
        detailedDescription: t.detailedDescription
      }))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdOption = await OptionService.createOption(optionInput as any)
    return createApiResponse(createdOption, undefined, 201)
  } catch (error) {
    return handleApiError(error, 'Error creating option', request)
  }
})

// Export TRACE handler for 405 Method Not Allowed
