import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getLocalizedErrorMessage, getErrorMessage } from './backendI18n'

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (
    request: NextRequest,
    handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    try {
      const body = await request.json()
      const validatedData = schema.parse(body)
      return await handler(request, validatedData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: getLocalizedErrorMessage(request, 'validation.error'),
            details: error.issues.reduce((acc: Record<string, string>, err) => {
              const path = err.path.join('.')
              acc[path] = err.message
              return acc
            }, {})
          },
          { status: 400 }
        )
      }

      console.error('Request validation error:', error)
      return NextResponse.json(
        {
          success: false,
          error: getLocalizedErrorMessage(request, 'validation.invalid_request_body')
        },
        { status: 400 }
      )
    }
  }
}

export function validateQueryParams<T>(schema: z.ZodSchema<T>) {
  return async (
    request: NextRequest,
    handler: (request: NextRequest, validatedParams: T) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(request.url)
      const params = Object.fromEntries(searchParams.entries())
      const validatedParams = schema.parse(params)
      return await handler(request, validatedParams)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: getLocalizedErrorMessage(request, 'validation.invalid_query_params'),
            details: error.issues.reduce((acc: Record<string, string>, err) => {
              const path = err.path.join('.')
              acc[path] = err.message
              return acc
            }, {})
          },
          { status: 400 }
        )
      }

      console.error('Query params validation error:', error)
      return NextResponse.json(
        {
          success: false,
          error: getLocalizedErrorMessage(request, 'validation.invalid_query_params')
        },
        { status: 400 }
      )
    }
  }
}

export function createApiResponse<T>(data?: T, error?: string, status: number = 200) {
  if (error) {
    return NextResponse.json(
      {
        success: false,
        error
      },
      { status }
    )
  }

  return NextResponse.json(
    {
      success: true,
      data
    },
    { status }
  )
}

export function handleApiError(error: unknown, context: string, request?: NextRequest) {
  console.error(`${context} error:`, error)

  if (error instanceof z.ZodError) {
    const errorMessage = request
      ? getLocalizedErrorMessage(request, 'validation.error')
      : getErrorMessage('validation.error', 'de') // Fallback to German

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.issues.reduce((acc: Record<string, string>, err) => {
          const path = err.path.join('.')
          acc[path] = err.message
          return acc
        }, {})
      },
      { status: 400 }
    )
  }

  const errorMessage = request
    ? getLocalizedErrorMessage(request, 'error.internal_server')
    : getErrorMessage('error.internal_server', 'de') // Fallback to German

  return NextResponse.json(
    {
      success: false,
      error: errorMessage
    },
    { status: 500 }
  )
}
