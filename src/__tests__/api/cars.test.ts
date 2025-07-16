import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/cars/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    car: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Mock admin auth - disable auth for tests
vi.mock('@/lib/adminAuth', () => ({
  requireAdminAuth: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
}))

// Set locale to German for API tests
vi.mock('next-intl/server', () => ({
  getTranslations: () => (key: string) => {
    const germanTranslations = {
      'errors.internalServerError': 'Interner Serverfehler',
      'errors.validationError': 'Validierungsfehler',
      'errors.notFound': 'Nicht gefunden',
      'errors.unauthorized': 'Nicht autorisiert',
      'errors.forbidden': 'Verboten',
    }
    return germanTranslations[key as keyof typeof germanTranslations] || key
  },
  getLocale: () => 'de',
  getMessages: () => ({}),
}))

const createMockRequest = (method: string, body?: Record<string, unknown>) => {
  return new NextRequest('http://localhost:3000/api/cars', {
    method,
    headers: {
      'accept-language': 'de-DE,de;q=0.9,en;q=0.8',
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('/api/cars', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/cars', () => {
    it('should return all cars with options', async () => {
      const mockCars = [
        {
          id: 'car1',
          name: 'BMW X5',
          category: 'SUV',
          basePrice: 60000,
          description: 'Luxury SUV',
          imageUrl: '/images/cars/bmw-x5.jpg',
          imageData: null,
          imageMimeType: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          options: [
            {
              option: {
                id: 'option1',
                name: 'Sportpaket',
                category: 'Performance',
                price: 5000,
                description: 'Sport Package',
                imageUrl: '/images/options/sport.jpg',
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            }
          ]
        }
      ]

      vi.mocked(prisma.car.findMany).mockResolvedValue(mockCars as never)

      const request = createMockRequest('GET')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0]).toEqual(
        expect.objectContaining({
          id: 'car1',
          name: 'BMW X5',
          category: 'SUV',
          basePrice: 60000
        })
      )
      expect(prisma.car.findMany).toHaveBeenCalledWith({
        include: {
          options: {
            include: {
              option: {
                include: {
                  translations: {
                    where: {
                      locale: 'de'
                    }
                  }
                }
              }
            }
          },
          translations: {
            where: {
              locale: 'de'
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })
    })

    it('should handle database errors gracefully', async () => {
      // Suppress console.error for expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(prisma.car.findMany).mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('GET')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('POST /api/cars', () => {
    it('should create a new car successfully', async () => {
      const newCar = {
        name: 'Test Car',
        category: 'SUV',
        basePrice: 50000,
        description: 'Test description',
        imageUrl: '/images/cars/test-car.jpg'
      }

      const mockCreatedCar = {
        id: 'created-car-id',
        ...newCar,
        imageData: null,
        imageMimeType: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.car.create).mockResolvedValue(mockCreatedCar as never)

      const request = createMockRequest('POST', newCar)
      const response = await POST(request, { params: {} })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(
        expect.objectContaining({
          id: mockCreatedCar.id,
          name: mockCreatedCar.name,
          basePrice: mockCreatedCar.basePrice
        })
      )
      expect(prisma.car.create).toHaveBeenCalledWith({
        data: {
          name: newCar.name,
          category: newCar.category,
          basePrice: newCar.basePrice,
          description: newCar.description,
          imageUrl: newCar.imageUrl,
          imageData: null,
          imageMimeType: null,
          translations: undefined
        },
        include: {
          translations: true
        }
      })
    })

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        name: 'Test Car'
        // Missing required fields
      }

      const request = createMockRequest('POST', incompleteData)
      const response = await POST(request, { params: {} })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should handle database errors during creation', async () => {
      // Suppress console.error for expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const newCar = {
        name: 'Test Car',
        category: 'SUV',
        basePrice: 50000,
        description: 'Test description',
        imageUrl: '/images/cars/test-car.jpg'
      }

      vi.mocked(prisma.car.create).mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('POST', newCar)
      const response = await POST(request, { params: {} })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)

      consoleSpy.mockRestore()
    })
  })
})
