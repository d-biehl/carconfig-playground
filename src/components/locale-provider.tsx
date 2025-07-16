'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface LocaleContextType {
  locale: string
  setLocale: (locale: string) => void
  isLoading: boolean
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState('de')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Get initial locale from cookie
    const storedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] || 'de'
    setLocaleState(storedLocale)
  }, [])

  const setLocale = async (newLocale: string) => {
    if (newLocale === locale) return

    setIsLoading(true)

    try {
      // Set cookie
      document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`

      // Update state
      setLocaleState(newLocale)

      // Force a router refresh to reload translations
      window.location.reload()
    } catch (error) {
      console.error('Error setting locale:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isLoading }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
