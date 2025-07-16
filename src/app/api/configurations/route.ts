import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ConfigurationService } from '@/services'

// Schema for configuration creation
const createConfigurationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  carId: z.string().min(1, 'Car ID is required'),
  totalPrice: z.number().min(0, 'Total price must be positive').optional(),
  userId: z.string().min(1, 'User ID is required').optional(),
  selectedOptions: z.array(z.string()).default([])
})

/**
 * @swagger
 * /api/configurations:
 *   get:
 *     tags: [Configurations]
 *     summary: Get user configurations
 *     description: Retrieve all configurations for a specific user
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID to filter configurations
 *     responses:
 *       200:
 *         description: Configurations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   examples: [true]
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Configuration'
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const configurations = await ConfigurationService.getConfigurations({
      userId: userId || undefined,
      includeDetails: true
    })

    return NextResponse.json({
      success: true,
      data: configurations
    })
  } catch (error) {
    console.error('Error fetching configurations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch configurations'
      },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/configurations:
 *   post:
 *     tags: [Configurations]
 *     summary: Create a new configuration
 *     description: Create a new car configuration with selected options
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, carId, totalPrice]
 *             properties:
 *               name:
 *                 type: string
 *                 examples: ['My Dream Car', 'Sport Edition']
 *               carId:
 *                 type: string
 *                 examples: ['car-1', 'car-2']
 *               totalPrice:
 *                 type: number
 *                 examples: [45000, 67500]
 *               userId:
 *                 type: string
 *                 examples: ['user-123']
 *               selectedOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 examples: [['option-1', 'option-2']]
 *     responses:
 *       201:
 *         description: Configuration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   examples: [true]
 *                 data:
 *                   $ref: '#/components/schemas/Configuration'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createConfigurationSchema.parse(body)

    // If no userId provided, generate a demo user ID
    const configData = {
      ...validatedData,
      userId: validatedData.userId || `demo-user-${Date.now()}`
    }

    const configuration = await ConfigurationService.createConfiguration(configData)

    return NextResponse.json({
      success: true,
      data: configuration
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating configuration:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: error.issues
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create configuration'
      },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Export TRACE handler for 405 Method Not Allowed
