import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { validateRequest, createApiResponse, handleApiError } from '@/lib/apiValidation'
import { LocaleUpdateSchema } from '@/schemas/api'

/**
 * @swagger
 * /api/locale:
 *   post:
 *     tags:
 *       - Locale
 *     summary: Update user locale
 *     description: Updates the user's preferred language locale (de or en)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocaleUpdate'
 *     responses:
 *       200:
 *         description: Locale updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request: NextRequest) {
  return await validateRequest(LocaleUpdateSchema)(
    request,
    async (request, { locale }) => {
      try {
        const cookieStore = await cookies()
        cookieStore.set('locale', locale, {
          maxAge: 365 * 24 * 60 * 60, // 1 year
          httpOnly: false,
          sameSite: 'lax',
          path: '/'
        })

        return createApiResponse({
          message: 'Locale successfully updated'
        })
      } catch (error) {
        return handleApiError(error, 'Locale API')
      }
    }
  )
}

// Export TRACE handler for 405 Method Not Allowed
