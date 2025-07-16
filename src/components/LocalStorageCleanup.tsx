'use client'

import { useLocalStorageCleanup } from '@/hooks/useLocalStorageCleanup'

/**
 * Client-Komponente zur Bereinigung von localStorage
 * Wird automatisch beim App-Start ausgeführt
 */
export function LocalStorageCleanup() {
  useLocalStorageCleanup()
  return null // Unsichtbare Komponente
}
