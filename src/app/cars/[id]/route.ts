import { NextRequest, NextResponse } from 'next/server'

/**
 * @swagger
 * /cars/{id}:
 *   get:
 *     tags:
 *       - Cars (Frontend Routes)
 *     summary: Get car details page (Frontend Route)
 *     description: Frontend route that displays a specific car details page. Returns HTML content.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car details page HTML
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Page not found
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  // This is a frontend route, redirect to the actual page
  return NextResponse.redirect(new URL(`/configurator?carId=${resolvedParams.id}`, request.url))
}

// Export TRACE handler
