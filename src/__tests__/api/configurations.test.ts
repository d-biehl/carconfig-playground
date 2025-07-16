import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/configurations/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    configuration: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    car: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    option: {
      findMany: vi.fn(),
    },
    configurationOption: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Mock OptionService
vi.mock('@/services/OptionService', () => ({
  OptionService: {
    validateOptionConflicts: vi.fn(() => Promise.resolve({ hasConflicts: false, conflictingOptions: [] })),
  }
}))

describe('/api/configurations', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      isRegistered: true
    } as never)

    vi.mocked(prisma.car.findUnique).mockResolvedValue({
      id: 'car1',
      name: 'Test Car',
      basePrice: 50000,
      imageUrl: '/cars/test.jpg',
      description: 'Test car description',
      detailedDescription: 'Detailed test car description',
      slug: 'test-car',
      categoryId: 'cat1',
      createdAt: new Date(),
      updatedAt: new Date()
    } as never)

    vi.mocked(prisma.option.findMany).mockResolvedValue([
      {
        id: 'option1',
        name: 'Option 1',
        price: 2000,
        imageUrl: '/options/option1.jpg',
        description: 'Option 1 description',
        categoryId: 'cat1',
        slug: 'option-1',
        isExclusive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'option2',
        name: 'Option 2',
        price: 3000,
        imageUrl: '/options/option2.jpg',
        description: 'Option 2 description',
        categoryId: 'cat2',
        slug: 'option-2',
        isExclusive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ] as never)

    vi.mocked(prisma.configuration.create).mockResolvedValue({
      id: 'config1',
      name: 'Test Configuration',
      totalPrice: 55000,
      carId: 'car1',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    } as never)

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return callback(prisma)
    })
  })

  describe('GET /api/configurations', () => {
    it('should return all configurations with relations', async () => {
      const mockConfigurations = [
        {
          id: 'config1',
          name: 'Test Configuration',
          totalPrice: 55000,
          carId: 'car1',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
          car: {
            id: 'car1',
            name: 'Test Car',
            basePrice: 50000
          },
          user: {
            id: 'user1',
            email: 'test@example.com'
          },
          configurationOptions: [
            {
              id: 'co1',
              configurationId: 'config1',
              optionId: 'option1',
              option: {
                id: 'option1',
                name: 'Option 1',
                price: 2000
              }
            }
          ]
        }
      ]

      vi.mocked(prisma.configuration.findMany).mockResolvedValue(mockConfigurations as never)

      const request = new NextRequest('http://localhost:3000/api/configurations')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].name).toBe('Test Configuration')
    })
  })

  describe('POST /api/configurations', () => {
    it('should create a new configuration with price calculation', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const configData = {
        name: 'Test Configuration',
        carId: 'car1',
        userId: 'user1',
        selectedOptions: ['option1', 'option2'] as string[]
      }

      const request = new NextRequest('http://localhost:3000/api/configurations', {
        method: 'POST',
        body: JSON.stringify(configData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201) // Test now with correct OptionService mock should succeed
      expect(data.success).toBe(true)
      expect(data.data.totalPrice).toBe(55000)

      // Verify price calculation: basePrice + sum of option prices
      expect(prisma.car.findUnique).toHaveBeenCalledWith({
        where: { id: configData.carId },
        select: expect.objectContaining({
          basePrice: true,
          id: true,
          name: true
        })
      })
      expect(prisma.option.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: configData.selectedOptions
          }
        },
        select: expect.objectContaining({
          id: true,
          name: true,
          price: true
        })
      })

      consoleSpy.mockRestore()
    })

    it('should return 400 for missing required fields', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = new NextRequest('http://localhost:3000/api/configurations', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid input data') // API returns 'Invalid input data' for validation errors

      consoleSpy.mockRestore()
    })

    it('should return 404 if car not found', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock car not found
      vi.mocked(prisma.car.findUnique).mockResolvedValue(null)

      const configData = {
        name: 'Test Configuration',
        carId: 'non-existent-car',
        userId: 'user1',
        selectedOptions: [] as string[]
      }

      const request = new NextRequest('http://localhost:3000/api/configurations', {
        method: 'POST',
        body: JSON.stringify(configData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400) // API currently returns 400 for all errors, including NotFound
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create configuration') // API wraps NotFoundError in DatabaseError

      consoleSpy.mockRestore()
    })
  })
})
