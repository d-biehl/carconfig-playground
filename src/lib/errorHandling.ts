import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from './logger'
import { getLocalizedErrorMessage } from './backendI18n'

// Enhanced Error Types
export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.context = context
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR', { details })
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string | number) {
    super(`${resource} not found`, 404, 'NOT_FOUND', { resource, id })
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, conflictData?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', conflictData)
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, 'DATABASE_ERROR', { originalError: originalError?.message })
  }
}

// Enhanced API Error Handler
export function createApiErrorHandler(context: string) {
  return (error: unknown, request?: NextRequest): NextResponse => {
    // Log error with context
    logger.error(`API Error in ${context}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      url: request?.url,
      method: request?.method
    })

    // Handle known API errors
    if (error instanceof ApiError) {
      const errorMessage = request
        ? getLocalizedErrorMessage(request, 'error.internal_server') // Fallback to existing key
        : error.message

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: error.code,
          ...(error.context && { details: error.context })
        },
        { status: error.statusCode }
      )
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessage = request
        ? getLocalizedErrorMessage(request, 'validation.error')
        : 'Validation error'

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: 'VALIDATION_ERROR',
          details: error.issues.reduce((acc: Record<string, string>, err) => {
            const path = err.path.join('.')
            acc[path] = err.message
            return acc
          }, {})
        },
        { status: 400 }
      )
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string }
      return handlePrismaError(prismaError, request)
    }

    // Handle unknown errors
    const errorMessage = request
      ? getLocalizedErrorMessage(request, 'error.internal_server')
      : 'Internal server error'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Prisma Error Handler
function handlePrismaError(
  error: { code: string; message: string },
  request?: NextRequest
): NextResponse {
  logger.error('Prisma Error', { code: error.code, message: error.message })

  switch (error.code) {
    case 'P2002': // Unique constraint violation
      const errorMessage = request
        ? getLocalizedErrorMessage(request, 'error.duplicate_entry')
        : 'Duplicate entry'

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: 'DUPLICATE_ENTRY'
        },
        { status: 409 }
      )

    case 'P2025': // Record not found
      const notFoundMessage = request
        ? getLocalizedErrorMessage(request, 'error.not_found')
        : 'Record not found'

      return NextResponse.json(
        {
          success: false,
          error: notFoundMessage,
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )

    case 'P2003': // Foreign key constraint violation
      const constraintMessage = request
        ? getLocalizedErrorMessage(request, 'error.constraint_violation')
        : 'Constraint violation'

      return NextResponse.json(
        {
          success: false,
          error: constraintMessage,
          code: 'CONSTRAINT_VIOLATION'
        },
        { status: 400 }
      )

    default:
      const dbErrorMessage = request
        ? getLocalizedErrorMessage(request, 'error.database_error')
        : 'Database error'

      return NextResponse.json(
        {
          success: false,
          error: dbErrorMessage,
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      )
  }
}

// Enhanced API Response Creator
export function createApiResponse<T>(
  data?: T,
  status: number = 200,
  meta?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta })
    },
    { status }
  )
}

// Async error boundary for API routes
export function withErrorBoundary<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      const request = args[0] as NextRequest
      const errorHandler = createApiErrorHandler(context)
      return errorHandler(error, request)
    }
  }
}

// Database operation wrapper
export async function withDatabaseError<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    logger.error(`Database operation failed in ${context}`, {
      error: error instanceof Error ? error.message : String(error),
      context
    })

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string }
      throw new DatabaseError(`Database operation failed: ${context}`, prismaError as unknown as Error)
    }

    throw new DatabaseError(`Unknown database error in ${context}`)
  }
}

// Request context extractor
export function extractRequestContext(request: NextRequest) {
  return {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(
      Array.from(request.headers.entries()).filter(([key]) =>
        ['user-agent', 'accept-language', 'authorization'].includes(key.toLowerCase())
      )
    ),
    timestamp: new Date().toISOString()
  }
}
