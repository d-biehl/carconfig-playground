import { CreateCarRequestSchema, CreateCarBusinessSchema, CreateOptionRequestSchema, CreateOptionBusinessSchema } from '@/schemas/api'

/**
 * Two-stage validation approach:
 * 1. Schema validation (lenient, OpenAPI compliant)
 * 2. Business validation (strict, application logic)
 */

export function validateCarRequest(data: unknown) {
  // Stage 1: Schema validation (should pass Schemathesis tests)
  const schemaResult = CreateCarRequestSchema.safeParse(data)
  if (!schemaResult.success) {
    throw new Error(`Schema validation failed: ${schemaResult.error.message}`)
  }

  // Stage 2: Business validation (for real functionality)
  const businessResult = CreateCarBusinessSchema.safeParse(schemaResult.data)
  if (!businessResult.success) {
    const errors = businessResult.error.issues.reduce((acc: Record<string, string>, err) => {
      const field = err.path.join('.')
      acc[field] = err.message
      return acc
    }, {})

    throw new ValidationError('Validierungsfehler', errors)
  }

  return businessResult.data
}

export function validateOptionRequest(data: unknown) {
  // Stage 1: Schema validation (should pass Schemathesis tests)
  const schemaResult = CreateOptionRequestSchema.safeParse(data)
  if (!schemaResult.success) {
    throw new Error(`Schema validation failed: ${schemaResult.error.message}`)
  }

  // Stage 2: Business validation (for real functionality)
  const businessResult = CreateOptionBusinessSchema.safeParse(schemaResult.data)
  if (!businessResult.success) {
    const errors = businessResult.error.issues.reduce((acc: Record<string, string>, err) => {
      const field = err.path.join('.')
      acc[field] = err.message
      return acc
    }, {})

    throw new ValidationError('Validierungsfehler', errors)
  }

  return businessResult.data
}

export class ValidationError extends Error {
  constructor(public message: string, public errors: Record<string, string>) {
    super(message)
    this.name = 'ValidationError'
  }
}
