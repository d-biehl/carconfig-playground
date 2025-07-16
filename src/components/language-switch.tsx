'use client'

import { useState } from 'react'
import { Languages, Check } from 'lucide-react'

interface LanguageSwitchProps {
  currentLocale: string
  testId?: string
}

const languages = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
]

export function LanguageSwitch({ currentLocale, testId }: LanguageSwitchProps) {
  const [isOpen, setIsOpen] = useState(false)

  const setLocale = async (locale: string) => {
    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale }),
      })
      window.location.reload()
    } catch (error) {
      console.error('Failed to set locale:', error)
    }
  }

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  // Use a consistent testId that won't cause hydration mismatches
  const buttonTestId = testId || "language-switcher"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
        data-testid={buttonTestId}
      >
        <Languages className="h-4 w-4" />
        <span>{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-sm" data-testid="language-dropdown">
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-3 py-2 mb-1">
                Sprache auswählen
              </div>
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => {
                    setLocale(language.code)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                    currentLocale === language.code
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-foreground hover:bg-accent/50 border border-transparent hover:border-border/50'
                  }`}
                  data-testid={`language-option-${language.code}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-base">{language.flag}</span>
                    <span className="font-medium">{language.name}</span>
                  </div>
                  {currentLocale === language.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
