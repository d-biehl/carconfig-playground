import { useEffect } from 'react'

/**
 * Hook for cleaning up legacy localStorage entries
 */
export function useLocalStorageCleanup() {
  useEffect(() => {
    const cleanupLegacyAuth = () => {
      const legacyKeys = [
        'user',
        'carconfig_user_name',
        'carconfig_user_email',
        'carconfig_auth_type',
      ]

      const hasNewAuth = localStorage.getItem('carconfig_auth_token')

      if (hasNewAuth) {
        legacyKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key)
          }
        })
      } else {
        const sensitiveLegacyKeys = ['user', 'carconfig_user_email']
        sensitiveLegacyKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key)
          }
        })
      }

      const sessionId = localStorage.getItem('carconfig_session_id')
      const userId = localStorage.getItem('carconfig_user_id')

      if (sessionId && !userId) {
        localStorage.removeItem('carconfig_session_id')
      }
    }

    cleanupLegacyAuth()

    const cleanupInterval = setInterval(cleanupLegacyAuth, 5 * 60 * 1000)

    return () => {
      clearInterval(cleanupInterval)
    }
  }, [])
}

/**
 * Clear all auth-related localStorage data
 */
export function clearAllAuthData() {
  const authKeys = [
    'carconfig_auth_token',
    'carconfig_user_id',
    'carconfig_session_id',
    'user',
    'carconfig_auth_type',
    'carconfig_user_name',
    'carconfig_user_email',
  ]

  authKeys.forEach(key => {
    localStorage.removeItem(key)
  })
}

/**
 * Funktion zum Abrufen der aktuell gespeicherten localStorage-Keys (nur für Debugging)
 */
export function getStoredAuthKeys(): string[] {
  const authKeys = [
    'carconfig_auth_token',
    'carconfig_user_id',
    'carconfig_session_id',
    'user',
    'carconfig_auth_type',
    'carconfig_user_name',
    'carconfig_user_email',
  ]

  return authKeys.filter(key => localStorage.getItem(key) !== null)
}
