import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

export async function GET() {
  return NextResponse.json(swaggerSpec)
}

// Export TRACE handler for 405 Method Not Allowed
