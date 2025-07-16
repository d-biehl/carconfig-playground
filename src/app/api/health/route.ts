import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint for Docker container monitoring
 * GET /api/health
 */
export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: process.uptime(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);

    const healthData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(healthData, { status: 503 });
  }
}
