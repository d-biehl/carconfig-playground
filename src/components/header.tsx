'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Sparkles, User, LogOut, Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitch } from '@/components/language-switch'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export function Header() {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setIsMobileMenuOpen(false)
    // Optional: redirect to home page
    window.location.href = '/'
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity" data-testid="header-logo">
              <div className="relative">
                <Car className="h-8 w-8 text-primary" />
                <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {t('home.title')}
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link
              href="/configurator"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent/50 ${
                pathname === '/configurator'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:text-foreground'
              }`}
              data-testid="nav-configurator"
            >
              {t('nav.configurator')}
            </Link>

            {/* Authentication-dependent navigation */}
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <>
                    {/* User is logged in */}
                    <div className="flex items-center space-x-2 px-3 py-2 bg-primary/10 rounded-lg" data-testid="user-info">
                      <User className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground hidden sm:inline">{user?.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-500/10 text-foreground/80 hover:text-red-600"
                      data-testid="logout-button"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('nav.logout')}</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* User is not logged in */}
                    <Link
                      href="/auth/login"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent/50 ${
                        pathname === '/auth/login'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground/80 hover:text-foreground'
                      }`}
                      data-testid="nav-login"
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      href="/auth/register"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent/50 ${
                        pathname === '/auth/register'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground/80 hover:text-foreground'
                      }`}
                      data-testid="nav-register"
                    >
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </>
            )}

            <LanguageSwitch currentLocale={locale} testId="desktop-language-switcher" />
            <ThemeToggle testId="desktop-theme-toggle" />
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <LanguageSwitch currentLocale={locale} testId="mobile-language-switcher" />
            <ThemeToggle testId="mobile-theme-toggle" />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-foreground hover:bg-accent/50 transition-colors"
              data-testid="mobile-menu-button"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/configurator"
                onClick={closeMobileMenu}
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                  pathname === '/configurator'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/80 hover:text-foreground hover:bg-accent/50'
                }`}
                data-testid="mobile-nav-configurator"
              >
                {t('nav.configurator')}
              </Link>

              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    <>
                      <div className="px-3 py-2 text-sm text-muted-foreground border-t border-border mt-2 pt-2">
                        {t('nav.user_menu')}
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 bg-primary/10 rounded-lg mx-1">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">{user?.name}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-lg text-base font-medium transition-colors text-foreground/80 hover:text-red-600 hover:bg-red-500/10"
                        data-testid="mobile-logout-button"
                      >
                        <div className="flex items-center space-x-2">
                          <LogOut className="h-4 w-4" />
                          <span>{t('nav.logout')}</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-2 text-sm text-muted-foreground border-t border-border mt-2 pt-2">
                        {t('nav.account')}
                      </div>
                      <Link
                        href="/auth/login"
                        onClick={closeMobileMenu}
                        className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                          pathname === '/auth/login'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground/80 hover:text-foreground hover:bg-accent/50'
                        }`}
                        data-testid="mobile-nav-login"
                      >
                        {t('nav.login')}
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={closeMobileMenu}
                        className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                          pathname === '/auth/register'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground/80 hover:text-foreground hover:bg-accent/50'
                        }`}
                        data-testid="mobile-nav-register"
                      >
                        {t('nav.register')}
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
