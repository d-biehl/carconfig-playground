'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import type { User } from '@/types'
import { clearAllAuthData } from '@/hooks/useLocalStorageCleanup'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authToken = localStorage.getItem('carconfig_auth_token')
        const userId = localStorage.getItem('carconfig_user_id')

        if (authToken && userId) {
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            })

            if (response.ok) {
              const data = await response.json()
              if (data.success) {
                setAuthState({
                  user: data.data,
                  isLoading: false,
                  isAuthenticated: true
                })
              } else {
                logger.auth('Token invalid, clearing auth', userId, 'token_invalid')
                clearAllAuthData()
                setAuthState({
                  user: null,
                  isLoading: false,
                  isAuthenticated: false
                })
              }
            } else {
              logger.auth('Auth check failed, clearing auth', userId, 'auth_check_failed')
              clearAllAuthData()
              setAuthState({
                user: null,
                isLoading: false,
                isAuthenticated: false
              })
            }
          } catch (fetchError) {
            logger.auth('Error validating token', userId, 'token_validation_error')
            console.error('Token validation error:', fetchError)
            clearAllAuthData()
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false
            })
          }
        } else {
          clearAllAuthData()
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      } catch (error) {
        logger.auth('Error checking auth', '', 'check_auth_error')
        console.error('Auth check error:', error)
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }
    }

    checkAuth()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'carconfig_auth_token' || e.key === 'carconfig_user_id') {
        checkAuth()
      }
    }

    const handleAuthChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authChanged', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authChanged', handleAuthChange)
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        const { user, token } = data.data

        clearAllAuthData()
        localStorage.setItem('carconfig_auth_token', token)
        localStorage.setItem('carconfig_user_id', user.id)

        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true
        })

        window.dispatchEvent(new CustomEvent('authChanged'))

        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      logger.auth('Login error occurred', email, 'login_error')
      console.error('Login error:', error)
      return { success: false, error: 'Fehler bei der Anmeldung' }
    }
  }

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (data.success) {
        const { user, token } = data.data

        clearAllAuthData()
        localStorage.setItem('carconfig_auth_token', token)
        localStorage.setItem('carconfig_user_id', user.id)

        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true
        })

        // Trigger custom event to force header update
        window.dispatchEvent(new CustomEvent('authChanged'))

        logger.auth('Auth state updated after registration', user.id, 'auth_state_updated')
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      logger.auth('Registration error occurred', email, 'registration_error')
      console.error('Registration error:', error)
      return { success: false, error: 'Fehler bei der Registrierung' }
    }
  }

  const logout = () => {
    clearAllAuthData()
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false
    })
    // Trigger custom event to force header update
    window.dispatchEvent(new CustomEvent('authChanged'))
  }

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    login,
    register,
    logout
  }
}
