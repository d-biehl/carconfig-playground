'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, User, Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminLoginPage() {
  const t = useTranslations()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Check if user is already logged in as admin
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const authToken = localStorage.getItem('carconfig_auth_token')

        if (authToken) {
          // Verify token with server
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data.role === 'admin') {
              router.push('/admin')
            }
          }
        }
      } catch (error) {
        console.error('Admin Login - Error checking existing auth:', error)
      }
    }

    // Check after a small delay to ensure localStorage is ready
    setTimeout(checkExistingAuth, 100)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(email, password)

      if (result.success) {
        router.push('/admin')
        router.refresh()
      } else {
        setError(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-background" />
      </div>

      {/* Login Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-card-foreground" data-testid="admin-login-title">
                Admin Login
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to access the admin panel
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4" data-testid="admin-login-error">
                  <div className="text-sm text-destructive">{error}</div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-card-foreground">
                    Email
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                      placeholder="Enter admin email"
                      data-testid="admin-email-input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-card-foreground">
                    {t('auth.login.password')}
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                      placeholder="Enter admin password"
                      data-testid="admin-password-input"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="admin-password-toggle"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                  data-testid="admin-login-button"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>

              <div className="text-center">
                <div className="bg-secondary/50 border border-border rounded-lg p-4">
                  <div className="text-sm text-secondary-foreground">
                    <strong>Demo Credentials</strong><br />
                    Email: <code className="bg-muted px-2 py-1 rounded text-foreground">admin@carconfigurator.com</code><br />
                    Password: <code className="bg-muted px-2 py-1 rounded text-foreground">admin123</code>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
