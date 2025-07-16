import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Schema for checkout session creation
const createCheckoutSessionSchema = z.object({
  carId: z.string(),
  selectedOptions: z.array(z.string()),
  configurationName: z.string().optional(),
  userId: z.string().optional()
})

// POST /api/checkout/session - Create checkout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCheckoutSessionSchema.parse(body)

    // Generate unique session ID
    const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get car details
    const car = await prisma.car.findUnique({
      where: { id: validatedData.carId },
      include: {
        translations: true
      }
    })

    if (!car) {
      return NextResponse.json({
        success: false,
        error: 'Car not found'
      }, { status: 404 })
    }

    // Get option details
    const options = await prisma.option.findMany({
      where: {
        id: { in: validatedData.selectedOptions }
      },
      include: {
        translations: true
      }
    })

    // Calculate total price
    const totalPrice = car.basePrice + options.reduce((sum, option) => sum + option.price, 0)

    // Store checkout session in database (expires after 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.checkoutSession.create({
      data: {
        id: sessionId,
        carId: validatedData.carId,
        selectedOptions: JSON.stringify(validatedData.selectedOptions),
        totalPrice,
        configurationName: validatedData.configurationName,
        userId: validatedData.userId,
        expiresAt
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        car,
        options,
        totalPrice,
        configurationName: validatedData.configurationName,
        expiresAt
      }
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// GET /api/checkout/session?sessionId=xxx - Get checkout session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    // Get checkout session from database
    const checkoutSession = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: {
        car: {
          include: {
            translations: true
          }
        }
      }
    })

    if (!checkoutSession) {
      return NextResponse.json({
        success: false,
        error: 'Checkout session not found or expired'
      }, { status: 404 })
    }

    // Check if session is expired
    if (checkoutSession.expiresAt < new Date()) {
      // Delete expired session
      await prisma.checkoutSession.delete({
        where: { id: sessionId }
      })

      return NextResponse.json({
        success: false,
        error: 'Checkout session expired'
      }, { status: 410 })
    }

    // Get option details
    const selectedOptionIds = JSON.parse(checkoutSession.selectedOptions)
    const options = await prisma.option.findMany({
      where: {
        id: { in: selectedOptionIds }
      },
      include: {
        translations: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        car: checkoutSession.car,
        options,
        totalPrice: checkoutSession.totalPrice,
        configurationName: checkoutSession.configurationName,
        createdAt: checkoutSession.createdAt,
        expiresAt: checkoutSession.expiresAt
      }
    })

  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/checkout/session?sessionId=xxx - Delete checkout session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    await prisma.checkoutSession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Checkout session deleted'
    })

  } catch (error) {
    console.error('Error deleting checkout session:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Export TRACE handler for 405 Method Not Allowed
