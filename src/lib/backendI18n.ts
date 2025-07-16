import { NextRequest } from 'next/server'
import type { Locale } from './i18n'

// Backend error messages in multiple languages
const errorMessages = {
  de: {
    // Auth errors
    'auth.required': 'Authentifizierung erforderlich',
    'auth.session_expired': 'Session abgelaufen',
    'auth.invalid_session': 'Ungültige Session',
    'auth.invalid_credentials': 'Ungültige Anmeldedaten',
    'auth.invalid_email_password': 'Ungültige Email-Adresse oder Passwort',
    'auth.admin_cannot_delete': 'Admin-Benutzer können nicht gelöscht werden',

    // Validation errors
    'validation.error': 'Validierungsfehler',
    'validation.invalid_request_body': 'Ungültiger Request-Body',
    'validation.invalid_query_params': 'Ungültige Query-Parameter',

    // File validation
    'file.invalid_type': 'Nur JPEG, PNG und WebP Dateien sind erlaubt.',
    'file.too_large': 'Datei ist zu groß. Maximum 5MB erlaubt.',

    // Generic errors
    'error.internal_server': 'Interner Serverfehler',
    'error.not_found': 'Nicht gefunden',
    'error.forbidden': 'Zugriff verweigert',
    'error.bad_request': 'Ungültige Anfrage',
    'error.unauthorized': 'Nicht autorisiert',
    'error.conflict': 'Konflikt aufgetreten',
    'error.duplicate_entry': 'Eintrag bereits vorhanden',
    'error.constraint_violation': 'Datenbank-Constraint verletzt',
    'error.database_error': 'Datenbankfehler',

    // Cleanup messages
    'cleanup.no_demo_users': 'Keine Demo-Benutzer zum Löschen gefunden (nur Benutzer mit isRegistered = false werden gelöscht)',
    'cleanup.success': 'Erfolgreich {deletedUsers} Demo-Benutzer und {deletedConfigurations} Konfigurationen gelöscht. Registrierte Benutzer wurden geschützt.',
  },
  en: {
    // Auth errors
    'auth.required': 'Authentication required',
    'auth.session_expired': 'Session expired',
    'auth.invalid_session': 'Invalid session',
    'auth.invalid_credentials': 'Invalid credentials',
    'auth.invalid_email_password': 'Invalid email or password',
    'auth.admin_cannot_delete': 'Admin users cannot be deleted',

    // Validation errors
    'validation.error': 'Validation error',
    'validation.invalid_request_body': 'Invalid request body',
    'validation.invalid_query_params': 'Invalid query parameters',

    // File validation
    'file.invalid_type': 'Only JPEG, PNG and WebP files are allowed.',
    'file.too_large': 'File is too large. Maximum 5MB allowed.',

    // Generic errors
    'error.internal_server': 'Internal server error',
    'error.not_found': 'Not found',
    'error.forbidden': 'Access denied',
    'error.bad_request': 'Bad request',
    'error.unauthorized': 'Unauthorized',
    'error.conflict': 'Conflict occurred',
    'error.duplicate_entry': 'Entry already exists',
    'error.constraint_violation': 'Database constraint violated',
    'error.database_error': 'Database error',

    // Cleanup messages
    'cleanup.no_demo_users': 'No demo users found to delete (only users with isRegistered = false are deleted)',
    'cleanup.success': 'Successfully deleted {deletedUsers} demo users and {deletedConfigurations} configurations. Regular registered users were preserved.',
  }
} as const

/**
 * Extract locale from request headers
 */
export function getLocaleFromRequest(request: NextRequest): Locale {
  // Try to get locale from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')

  // Try to get locale from custom header (if frontend sends it)
  const customLocale = request.headers.get('x-locale')

  // Try to get locale from cookie
  const cookieLocale = request.cookies.get('locale')?.value

  // Priority: custom header > cookie > accept-language
  if (customLocale && (customLocale === 'de' || customLocale === 'en')) {
    return customLocale as Locale
  }

  if (cookieLocale && (cookieLocale === 'de' || cookieLocale === 'en')) {
    return cookieLocale as Locale
  }

  if (acceptLanguage) {
    // Parse Accept-Language header (simplified)
    if (acceptLanguage.includes('de')) {
      return 'de'
    }
    if (acceptLanguage.includes('en')) {
      return 'en'
    }
  }

  // Default to German
  return 'de'
}

/**
 * Get translated error message for backend APIs
 */
export function getErrorMessage(
  key: keyof typeof errorMessages.de,
  locale: Locale,
  replacements?: Record<string, string | number>
): string {
  const messages = errorMessages[locale] || errorMessages.de
  let message: string = messages[key] || key

  // Replace placeholders like {deletedUsers}
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      message = message.replace(`{${placeholder}}`, String(value))
    })
  }

  return message
}

/**
 * Get translated error message from request
 */
export function getLocalizedErrorMessage(
  request: NextRequest,
  key: keyof typeof errorMessages.de,
  replacements?: Record<string, string | number>
): string {
  const locale = getLocaleFromRequest(request)
  return getErrorMessage(key, locale, replacements)
}

/**
 * Validate image file with localized error messages
 */
export function validateImageFileLocalized(file: File, locale: Locale = 'de'): { isValid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: getErrorMessage('file.invalid_type', locale)
    }
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: getErrorMessage('file.too_large', locale)
    }
  }

  return { isValid: true }
}
