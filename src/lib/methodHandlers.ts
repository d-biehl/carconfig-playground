// Utility for adding method handlers to API routes
export function createMethodNotAllowedHandlers(allowedMethods: string[]) {
  const allowHeader = allowedMethods.join(', ')

  const notAllowedResponse = (method: string) => {
    return new Response(JSON.stringify({
      error: 'Method Not Allowed',
      message: `${method} method is not allowed for this endpoint`,
      allowed: allowedMethods
    }), {
      status: 405,
      headers: {
        'Allow': allowHeader,
        'Content-Type': 'application/json'
      }
    })
  }

  return {
    TRACE: () => notAllowedResponse('TRACE'),
    OPTIONS: () => new Response(null, {
      status: 200,
      headers: {
        'Allow': allowHeader,
        'Access-Control-Allow-Methods': allowHeader,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      }
    }),
    POST: allowedMethods.includes('POST') ? undefined : () => notAllowedResponse('POST'),
    PUT: allowedMethods.includes('PUT') ? undefined : () => notAllowedResponse('PUT'),
    DELETE: allowedMethods.includes('DELETE') ? undefined : () => notAllowedResponse('DELETE'),
    PATCH: allowedMethods.includes('PATCH') ? undefined : () => notAllowedResponse('PATCH'),
    HEAD: allowedMethods.includes('HEAD') ? undefined : () => notAllowedResponse('HEAD'),
    GET: allowedMethods.includes('GET') ? undefined : () => notAllowedResponse('GET')
  }
}
