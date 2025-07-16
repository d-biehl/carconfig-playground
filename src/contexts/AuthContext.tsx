'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { logger } from '@/lib/logger'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
              setUser(data.data)
              setIsAuthenticated(true)
            } else {
              logger.auth('Token invalid, clearing auth', userId, 'token_invalid')
              clearAuthData()
              setUser(null)
              setIsAuthenticated(false)
            }
          } else {
            logger.auth('Auth check failed, clearing auth', userId, 'auth_check_failed')
            clearAuthData()
            setUser(null)
            setIsAuthenticated(false)
          }
        } catch (fetchError) {
          logger.auth('Error validating token', userId, 'token_validation_error')
          console.error('AuthProvider: Error validating token:', fetchError)
          clearAuthData()
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        clearAuthData()
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      logger.auth('Error checking auth', '', 'check_auth_error')
      console.error('AuthProvider: Error checking auth:', error)
      clearAuthData()
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const clearAuthData = () => {
    // Remove all auth-related localStorage items (including legacy ones)
    localStorage.removeItem('carconfig_auth_token')
    localStorage.removeItem('carconfig_user_id')

    // Clean up legacy data
    localStorage.removeItem('user')
    localStorage.removeItem('carconfig_auth_type')
    localStorage.removeItem('carconfig_user_name')
    localStorage.removeItem('carconfig_user_email')
    localStorage.removeItem('carconfig_session_id')
  }

  useEffect(() => {
    checkAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        // Success: No logging needed for normal login
        localStorage.setItem('carconfig_auth_token', token)
        localStorage.setItem('carconfig_user_id', user.id)

        // Clean up any legacy data
        clearAuthData()
        localStorage.setItem('carconfig_auth_token', token)
        localStorage.setItem('carconfig_user_id', user.id)

        setUser(user)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('AuthProvider: Login error:', error)
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
        // Success: No logging needed for normal registration
        localStorage.setItem('carconfig_auth_token', token)
        localStorage.setItem('carconfig_user_id', user.id)

        // Clean up any legacy data
        clearAuthData()
        localStorage.setItem('carconfig_auth_token', token)
        localStorage.setItem('carconfig_user_id', user.id)

        setUser(user)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('AuthProvider: Registration error:', error)
      return { success: false, error: 'Fehler bei der Registrierung' }
    }
  }

  const logout = () => {
    // Success: No logging needed for normal logout
    clearAuthData()
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
