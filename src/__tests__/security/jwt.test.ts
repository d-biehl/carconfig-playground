import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateToken, verifyToken, decodeToken, isTokenExpired } from '@/lib/jwt'
import { requireAdminAuth } from '@/lib/adminAuth'
import { NextRequest, NextResponse } from 'next/server'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

// Import the mocked prisma to get access to the mock functions
import { prisma } from '@/lib/prisma'
const mockPrisma = vi.mocked(prisma, true)
const mockUserFindUnique = vi.mocked(prisma.user.findUnique)

describe('JWT Security Tests', () => {
  describe('generateToken', () => {
    it('should generate valid JWT tokens', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'admin'
      }

      const token = generateToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include correct payload in token', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'admin@example.com',
        role: 'admin'
      }

      const token = generateToken(payload)
      const decoded = decodeToken(token)

      expect(decoded).toBeDefined()
      expect(decoded!.userId).toBe(payload.userId)
      expect(decoded!.email).toBe(payload.email)
      expect(decoded!.role).toBe(payload.role)
      expect(decoded!.iat).toBeDefined()
      expect(decoded!.exp).toBeDefined()
    })
  })

  describe('verifyToken', () => {
    it('should verify valid tokens', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'admin@example.com',
        role: 'admin'
      }

      const token = generateToken(payload)
      const verified = verifyToken(token)

      expect(verified).toBeDefined()
      expect(verified!.userId).toBe(payload.userId)
      expect(verified!.email).toBe(payload.email)
      expect(verified!.role).toBe(payload.role)
    })

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.jwt.token'
      const verified = verifyToken(invalidToken)

      expect(verified).toBeNull()
    })

    it('should reject tampered tokens', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'admin@example.com',
        role: 'admin'
      }

      const token = generateToken(payload)
      const tamperedToken = token.slice(0, -5) + 'XXXXX' // Tamper with signature
      const verified = verifyToken(tamperedToken)

      expect(verified).toBeNull()
    })
  })

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'admin@example.com',
        role: 'admin'
      }

      const token = generateToken(payload)
      const decoded = decodeToken(token)

      expect(decoded).toBeDefined()
      expect(decoded!.userId).toBe(payload.userId)
      expect(decoded!.email).toBe(payload.email)
      expect(decoded!.role).toBe(payload.role)
    })

    it('should return null for malformed tokens', () => {
      const malformedToken = 'not.a.jwt'
      const decoded = decodeToken(malformedToken)

      expect(decoded).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for valid tokens', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'admin@example.com',
        role: 'admin'
      }

      const token = generateToken(payload)
      const expired = isTokenExpired(token)

      expect(expired).toBe(false)
    })

    it('should return true for tokens without expiration', () => {
      const malformedToken = 'invalid.token'
      const expired = isTokenExpired(malformedToken)

      expect(expired).toBe(true)
    })
  })

  describe('requireAdminAuth middleware', () => {
    const mockHandler = vi.fn()

    beforeEach(() => {
      mockHandler.mockClear()
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }))
      vi.clearAllMocks()
    })

    it('should reject requests without Authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/cars')

      const protectedHandler = requireAdminAuth(mockHandler)
      const response = await protectedHandler(request, undefined)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(401)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Authentication required')
    })

    it('should reject requests with malformed Authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/cars')
      request.headers.set('authorization', 'InvalidHeader')

      const protectedHandler = requireAdminAuth(mockHandler)
      const response = await protectedHandler(request, undefined)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(401)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Authentication required')
    })

    it('should reject requests with invalid JWT tokens', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/cars')
      request.headers.set('authorization', 'Bearer invalid-jwt-token')

      const protectedHandler = requireAdminAuth(mockHandler)
      const response = await protectedHandler(request, undefined)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(401)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Invalid token')
    })

    it('should reject requests from non-admin users', async () => {
      const payload = {
        userId: 'test-user-id',
        email: 'user@example.com',
        role: 'user' // Non-admin role
      }

      const token = generateToken(payload)
      const request = new NextRequest('http://localhost:3000/api/admin/cars')
      request.headers.set('authorization', `Bearer ${token}`)

      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user',
        isRegistered: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as never)

      const protectedHandler = requireAdminAuth(mockHandler)
      const response = await protectedHandler(request, undefined)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(403)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Admin access required')
    })

    it('should allow requests from admin users', async () => {
      const payload = {
        userId: 'admin-user-id',
        email: 'admin@example.com',
        role: 'admin'
      }

      const token = generateToken(payload)
      const request = new NextRequest('http://localhost:3000/api/admin/cars')
      request.headers.set('authorization', `Bearer ${token}`)

      // Mock admin user lookup
      mockUserFindUnique.mockResolvedValue({
        id: 'admin-user-id',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'hashed-password',
        role: 'admin',
        isRegistered: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as never)

      const protectedHandler = requireAdminAuth(mockHandler)
      const response = await protectedHandler(request, undefined)

      expect(mockHandler).toHaveBeenCalledWith(request, undefined)
      expect(response.status).toBe(200) // Success response from mockHandler
    })

    it('should handle database errors gracefully', async () => {
      const payload = {
        userId: 'test-user-id',
        email: 'admin@example.com',
        role: 'admin'
      }

      const token = generateToken(payload)
      const request = new NextRequest('http://localhost:3000/api/admin/cars')
      request.headers.set('authorization', `Bearer ${token}`)

      // Mock database error
      mockUserFindUnique.mockRejectedValue(new Error('Database connection failed'))

      const protectedHandler = requireAdminAuth(mockHandler)
      const response = await protectedHandler(request, undefined)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(500)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Internal server error')
    })
  })

  describe('JWT Security Configuration', () => {
    it('should use secure JWT settings', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'admin@example.com',
        role: 'admin'
      }

      const token = generateToken(payload)
      const decoded = decodeToken(token)

      expect(decoded).toBeDefined()
      expect(decoded!.exp).toBeDefined()
      expect(decoded!.iat).toBeDefined()

      // Token should expire in the future
      const now = Math.floor(Date.now() / 1000)
      expect(decoded!.exp).toBeGreaterThan(now)

      // Token should not be valid for more than 30 days (reasonable limit)
      const maxExpiry = now + (30 * 24 * 60 * 60) // 30 days
      expect(decoded!.exp).toBeLessThanOrEqual(maxExpiry)
    })
  })
})
