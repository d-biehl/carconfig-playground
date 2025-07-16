import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, handleApiError } from '@/lib/apiValidation'

/**
 * @swagger
 * /api/configurations/{id}:
 *   get:
 *     tags:
 *       - Configurations
 *     summary: Get configuration by ID
 *     description: Retrieves a specific configuration with car and options
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Configuration'
 *       404:
 *         description: Configuration not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     tags:
 *       - Configurations
 *     summary: Delete configuration
 *     description: Deletes a configuration and all associated options
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
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
 *       404:
 *         description: Configuration not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const configuration = await prisma.configuration.findUnique({
      where: { id },
      include: {
        car: true,
        options: {
          include: {
            option: true
          }
        }
      }
    })

    if (!configuration) {
      return createApiResponse(
        null,
        'configuration not found',
        404
      )
    }

    // Transform the response to match expected format
    const transformedConfiguration = {
      ...configuration,
      options: configuration.options.map(co => co.option)
    }

    return createApiResponse(transformedConfiguration)
  } catch (error) {
    return handleApiError(error, 'Error fetching configuration')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete configuration options first (due to foreign key constraints)
    await prisma.configurationOption.deleteMany({
      where: { configurationId: id }
    })

    // Delete the configuration
    await prisma.configuration.delete({
      where: { id }
    })

    return createApiResponse({
      message: 'Configuration successfully deleted'
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return createApiResponse(
        null,
        'configuration not found',
        404
      )
    }
    return handleApiError(error, 'Error deleting configuration')
  }
}

// Export TRACE handler for 405 Method Not Allowed
