import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/adminAuth'
import { CarsQuerySchema, CreateCarRequestSchema } from '@/schemas/api'
import { validateQueryParams, validateRequest, createApiResponse, handleApiError } from '@/lib/apiValidation'
import { CarService } from '@/services'

/**
 * @swagger
 * /api/cars:
 *   get:
 *     tags:
 *       - Cars
 *     summary: Get all cars
 *     description: Retrieves a list of all available cars with optional localization
 *     parameters:
 *       - name: locale
 *         in: query
 *         schema:
 *           type: string
 *           enum: [de, en]
 *           default: de
 *         description: Language for localized content
 *     responses:
 *       200:
 *         description: Successful response
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
 *       400:
 *         description: Invalid query parameters
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
export async function GET(request: NextRequest) {
  return validateQueryParams(CarsQuerySchema)(
    request,
    async (request, validatedParams) => {
      try {
        const locale = validatedParams.locale || 'de'

        const cars = await CarService.getCars({
          locale,
          includeOptions: true,
          includeTranslations: true
        })

        return createApiResponse(cars)
      } catch (error) {
        return handleApiError(error, 'Cars GET')
      }
    }
  )
}

/**
 * @swagger
 * /api/cars:
 *   post:
 *     tags:
 *       - Cars
 *     summary: Create new car
 *     description: Creates a new car (admin only)
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCarRequest'
 *     responses:
 *       200:
 *         description: Car successfully created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Car'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
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
export const POST = requireAdminAuth(async (request: NextRequest) => {
  return validateRequest(CreateCarRequestSchema)(
    request,
    async (request, validatedData) => {
      try {
        // Apply business validation after schema validation
        const validationErrors: Record<string, string> = {}

        if (!validatedData.name || validatedData.name.trim().length === 0) {
          validationErrors.name = 'Name ist erforderlich'
        }
        if (!validatedData.category || validatedData.category.trim().length === 0) {
          validationErrors.category = 'Kategorie ist erforderlich'
        }
        if (validatedData.basePrice <= 0) {
          validationErrors.basePrice = 'Grundpreis muss positiv sein'
        }
        if (!validatedData.description || validatedData.description.trim().length === 0) {
          validationErrors.description = 'Beschreibung ist erforderlich'
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
          return NextResponse.json(
            {
              success: false,
              error: 'Validation error',
              details: validationErrors
            },
            { status: 400 }
          )
        }

        // Transform data for service layer
        const carInput = {
          ...validatedData,
          translations: validatedData.translations?.map(t => ({
            locale: t.locale,
            name: t.name || '',
            category: t.category || '',
            description: t.description || ''
          }))
        }

        const car = await CarService.createCar(carInput)
        return createApiResponse(car)
      } catch (error) {
        return handleApiError(error, 'Cars POST')
      }
    }
  )
})

// Export TRACE handler for 405 Method Not Allowed
