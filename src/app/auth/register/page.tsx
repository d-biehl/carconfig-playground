'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Car, UserPlus } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const { register, isAuthenticated } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/configurator')
    }
  }, [isAuthenticated, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('auth.register.password_mismatch'))
      setLoading(false)
      return
    }

    const result = await register(email, password, name)

    if (result.success) {
      // Add a longer delay to ensure state is fully updated
      setTimeout(() => {
        router.push('/configurator')
      }, 500)
    } else {
      setError(result.error || t('auth.register.network_error'))
    }

    setLoading(false)

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
          <h1 className="text-3xl font-bold text-foreground mt-6 mb-2">{t('auth.register.title')}</h1>
          <p className="text-muted-foreground">{t('auth.register.subtitle')}</p>
        </div>

        {/* Registration Form */}
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg" data-testid="register-error-message">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-card-foreground">
                {t('auth.register.name')}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors text-foreground placeholder:text-muted-foreground"
                placeholder={t('auth.register.name_placeholder')}
                data-testid="register-name-input"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-card-foreground">
                {t('auth.register.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors text-foreground placeholder:text-muted-foreground"
                placeholder={t('auth.register.email_placeholder')}
                data-testid="register-email-input"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-card-foreground">
                {t('auth.register.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors text-foreground placeholder:text-muted-foreground"
                  placeholder={t('auth.register.password_placeholder')}
                  data-testid="register-password-input"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="register-password-toggle"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-card-foreground">
                {t('auth.register.confirm_password')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors text-foreground placeholder:text-muted-foreground"
                  placeholder={t('auth.register.confirm_password_placeholder')}
                  data-testid="register-confirm-password-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="register-confirm-password-toggle"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
              data-testid="register-submit-button"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  {t('auth.register.submit')}
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
              data-testid="register-demo-mode-button"
            >
              {t('auth.register.demo_mode')}
            </button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.register.already_account')}{' '}
                <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  {t('auth.register.sign_in')}
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
