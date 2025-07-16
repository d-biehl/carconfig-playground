'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Car, LogIn } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/configurator')
    }
  }, [isAuthenticated, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(email, password)

    if (result.success) {
      router.push('/configurator')
    } else {
      setError(result.error || t('auth.login.network_error'))
    }

    setLoading(false)
  }

  const handleDemoMode = () => {
    // Clear any existing auth data (including legacy format)
    localStorage.removeItem('carconfig_auth_token')
    localStorage.removeItem('carconfig_user_id')
    localStorage.removeItem('carconfig_user_name')
    localStorage.removeItem('carconfig_user_email')
    localStorage.removeItem('carconfig_auth_type')
    localStorage.removeItem('carconfig_session_id')
    localStorage.removeItem('user')

    // Go to configurator in demo mode
    router.push('/configurator')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-background" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 text-foreground hover:text-primary transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold">CarConfigurator</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mt-6 mb-2">{t('auth.login.welcome_back')}</h1>
          <p className="text-muted-foreground">{t('auth.login.subtitle')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg" data-testid="login-error-message">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-card-foreground">
                {t('auth.login.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors text-foreground placeholder:text-muted-foreground"
                placeholder={t('auth.login.email_placeholder')}
                required
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-card-foreground">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors text-foreground placeholder:text-muted-foreground"
                  placeholder={t('auth.login.password_placeholder')}
                  required
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="login-password-toggle"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
              data-testid="login-submit-button"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  {t('auth.login.submit')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">{locale === 'en' ? 'or' : 'oder'}</span>
              </div>
            </div>

            <button
              onClick={handleDemoMode}
              className="w-full bg-secondary text-secondary-foreground py-3 px-6 rounded-lg font-medium hover:bg-secondary/80 transition-all duration-300 border border-border"
              data-testid="login-demo-mode-button"
            >
              {t('auth.login.demo_mode')}
            </button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.login.no_account')}{' '}
                <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  {t('auth.login.sign_up')}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Links */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← {t('nav.back_to_home')}
          </Link>
        </div>
      </div>
    </div>
  )
}
