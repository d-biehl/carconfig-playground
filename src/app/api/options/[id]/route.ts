import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/adminAuth'
import { validateRequest, createApiResponse, handleApiError } from '@/lib/apiValidation'
import { CreateOptionRequestSchema, OptionInput } from '@/schemas/api'

/**
 * @swagger
 * /api/options/{id}:
 *   get:
 *     tags:
 *       - options
 *     summary: Get option by ID
 *     description: Retrieves a specific option with translations
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: option ID
 *     responses:
 *       200:
 *         description: option retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/option'
 *       404:
 *         description: option not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     tags:
 *       - options
 *     summary: Update option
 *     description: Updates an existing option (admin only)
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: option ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOptionRequest'
 *     responses:
 *       200:
 *         description: option updated successfully
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
 *       404:
 *         description: option not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     tags:
 *       - options
 *     summary: Delete option
 *     description: Deletes an option (admin only)
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: option ID
 *     responses:
 *       200:
 *         description: option deleted successfully
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
 *                         message:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: option not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const option = await prisma.option.findUnique({
      where: {
        id: id
      },
      include: {
        translations: true
      }
    })

    if (!option) {
      return createApiResponse(
        null,
        'option not found',
        404
      )
    }

    return createApiResponse(option)
  } catch (error) {
    return handleApiError(error, 'Error fetching option')
  }
}

export const PUT = requireAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  return await validateRequest(CreateOptionRequestSchema)(
    request,
    async (request, validatedData: OptionInput) => {
      try {
        const {
          name,
          category,
          price,
          description,
          detailedDescription,
          imageUrl,
          imageData,
          imageMimeType,
          exclusiveGroup,
          isRequired,
          translations
        } = validatedData

        // Update option data
        await prisma.option.update({
          where: {
            id: id
          },
          data: {
            name,
            category,
            price: parseFloat(price.toString()),
            description,
            detailedDescription,
            imageUrl: imageData ? null : imageUrl,
            imageData: imageData || null,
            imageMimeType: imageMimeType || null,
            exclusiveGroup,
            isRequired
          }
        })

        // Handle translations if provided
        if (translations && translations.length > 0) {
          // Delete existing translations
          await prisma.optionTranslation.deleteMany({
            where: {
              optionId: id
            }
          })

          // Create new translations
          await prisma.optionTranslation.createMany({
            data: translations.map(translation => ({
              optionId: id,
              locale: translation.locale,
              name: translation.name,
              category: translation.category,
              description: translation.description || null,
              detailedDescription: translation.detailedDescription || null
            }))
          })
        }

        // Return updated option with translations
        const updatedOption = await prisma.option.findUnique({
          where: { id },
          include: { translations: true }
        })

        return createApiResponse(updatedOption)
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
          return createApiResponse(
            null,
            'option not found',
            404
          )
        }
        return handleApiError(error, 'Error updating option')
      }
    }
  )
})

export const DELETE = requireAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    await prisma.option.delete({
      where: {
        id: id
      }
    })

    return createApiResponse({
      message: 'Option successfully deleted'
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return createApiResponse(
        null,
        'option not found',
        404
      )
    }
    return handleApiError(error, 'Error deleting option')
  }
})

// Export TRACE handler for 405 Method Not Allowed
