import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/adminAuth'
import { UpdateCarRequestSchema } from '@/schemas/api'
import { createApiResponse, handleApiError } from '@/lib/apiValidation'
import { CarService } from '@/services'

/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     tags:
 *       - Cars
 *     summary: Get car by ID
 *     description: Retrieves a specific car by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *       - name: locale
 *         in: query
 *         schema:
 *           type: string
 *           enum: [de, en]
 *           default: de
 *         description: Language for localized content
 *     responses:
 *       200:
 *         description: Car successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Car'
 *       404:
 *         description: Car not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'de'

    const car = await CarService.getCarById(params.id, { locale })

    if (!car) {
      return NextResponse.json(
        {
          success: false,
          error: 'Car not found'
        },
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return createApiResponse(car)
  } catch (error) {
    return handleApiError(error, 'Car GET by ID')
  }
}

/**
 * @swagger
 * /api/cars/{id}:
 *   put:
 *     tags:
 *       - Cars
 *     summary: Update car
 *     description: Updates an existing car (admin only)
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Car model name
 *               category:
 *                 type: string
 *                 minLength: 1
 *                 description: Car category
 *               basePrice:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Base price in Euro
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 description: Car description
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Car image URL
 *               imageData:
 *                 type: string
 *                 description: Base64 encoded image data
 *               imageMimeType:
 *                 type: string
 *                 description: Image MIME type
 *               translations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     locale:
 *                       type: string
 *                       minLength: 2
 *                       examples: ["de", "en"]
 *                     name:
 *                       type: string
 *                       minLength: 1
 *                     category:
 *                       type: string
 *                       minLength: 1
 *                     description:
 *                       type: string
 *                       minLength: 1
 *     responses:
 *       200:
 *         description: Car successfully updated
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
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Car not found
 *       500:
 *         description: Internal server error
 */
export const PUT = requireAdminAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json()
    const validatedData = UpdateCarRequestSchema.parse(body)

    // Transform data for service layer compatibility
    const updateData = {
      id: params.id,
      ...validatedData,
      // Handle optional fields
      imageUrl: validatedData.imageUrl || undefined,
      imageData: validatedData.imageData || undefined,
      imageMimeType: validatedData.imageMimeType || undefined,
      // Filter out incomplete translations
      translations: validatedData.translations?.filter(t =>
        t.locale && t.name && t.category && t.description
      ).map(t => ({
        locale: t.locale,
        name: t.name!,
        category: t.category!,
        description: t.description!
      })) || []
    }

    const updatedCar = await CarService.updateCar(updateData)

    return createApiResponse(updatedCar)
  } catch (error) {
    return handleApiError(error, 'Car PUT')
  }
})

/**
 * @swagger
 * /api/cars/{id}:
 *   delete:
 *     tags:
 *       - Cars
 *     summary: Delete car
 *     description: Deletes a car (admin only)
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Car not found
 *       500:
 *         description: Internal server error
 */
export const DELETE = requireAdminAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await CarService.deleteCar(params.id)

    return NextResponse.json({
      success: true,
      data: { message: 'Car successfully deleted' }
    }, { status: 200 })
  } catch (error) {
    return handleApiError(error, 'Car DELETE')
  }
})

// Handle unsupported methods with 405 Method Not Allowed
export async function TRACE() {
  return new Response(JSON.stringify({
    error: 'Method Not Allowed',
    message: 'TRACE method is not allowed for this endpoint'
  }), {
    status: 405,
    headers: {
      'Allow': 'GET, PUT, DELETE',
      'Content-Type': 'application/json'
    }
  })
}
