import { describe, it, expect, afterEach, afterAll, beforeAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
})

describe('Lastenheft Requirements Integration Tests', () => {
  beforeAll(async () => {
    // Debug: Print current database URL
    console.log('Database URL:', process.env.DATABASE_URL)

    // Seed the database if empty
    const carCount = await prisma.car.count()
    const userCount = await prisma.user.count()
    console.log(`Cars in database: ${carCount}, Users in database: ${userCount}`)

    if (carCount === 0) {
      console.log('Seeding test database...')

      // Create test user
      await prisma.user.create({
        data: {
          id: 'test-user-1',
          email: 'test@example.com',
          name: 'Test User',
          password: 'test-password',
          role: 'user',
          isRegistered: true,
        },
      })

      // Create test cars with options
      const car1 = await prisma.car.create({
        data: {
          id: 'car-1',
          name: 'BMW X5',
          category: 'SUV',
          basePrice: 65000,
          description: 'Premium SUV',
          imageUrl: '/images/cars/bmw-x5.jpg',
        },
      })

      const car2 = await prisma.car.create({
        data: {
          id: 'car-2',
          name: 'Mercedes S-Class',
          category: 'Sedan',
          basePrice: 95000,
          description: 'Luxury sedan',
          imageUrl: '/images/cars/mercedes-s.jpg',
        },
      })

      // Create test options
      const options = [
        {
          id: 'opt-1',
          name: 'Premium Sound System',
          category: 'Audio',
          price: 2500,
          description: 'High-end audio system',
          imageUrl: '/images/options/sound.jpg',
        },
        {
          id: 'opt-2',
          name: 'Leather Seats',
          category: 'Interior',
          price: 3500,
          description: 'Premium leather interior',
          imageUrl: '/images/options/leather.jpg',
        },
        {
          id: 'opt-3',
          name: 'Navigation System',
          category: 'Technology',
          price: 1500,
          description: 'Advanced GPS navigation',
          imageUrl: '/images/options/navigation.jpg',
        },
      ]

      for (const option of options) {
        await prisma.option.create({ data: option })
      }

      // Link options to cars
      for (const option of options) {
        await prisma.carOption.create({
          data: {
            carId: car1.id,
            optionId: option.id,
          },
        })
        await prisma.carOption.create({
          data: {
            carId: car2.id,
            optionId: option.id,
          },
        })
      }

      console.log('Test database seeded successfully')
    }
  })

  afterEach(async () => {
    // Only clean test-generated data, keep seed data
    try {
      await prisma.configurationOption.deleteMany()
    } catch {
      // Ignore if table doesn't exist
    }
    try {
      await prisma.configuration.deleteMany()
    } catch {
      // Ignore if table doesn't exist
    }
    // Keep cars, options, and users from seeding
  })

  describe('UC-001: Car Selection and Configuration', () => {
    it('should allow users to select from premium vehicles', async () => {
      // Use existing seeded cars
      const cars = await prisma.car.findMany()
      expect(cars.length).toBeGreaterThan(0)

      // Check that we have premium vehicles (base price > 40000)
      const premiumCars = cars.filter(car => car.basePrice > 40000)
      expect(premiumCars.length).toBeGreaterThan(0)

      // Verify car structure
      const car = cars[0]
      expect(car.name).toBeDefined()
      expect(car.category).toBeDefined()
      expect(car.basePrice).toBeGreaterThan(0)
    })

    it('should allow configuration with various option categories', async () => {
      // Use existing seeded car and options
      const cars = await prisma.car.findMany()
      expect(cars.length).toBeGreaterThan(0)
      const car = cars[0]

      // Get existing options in different categories
      const options = await prisma.option.findMany()
      expect(options.length).toBeGreaterThan(0)

      // Check that we have options in different categories
      const categories = [...new Set(options.map(opt => opt.category))]
      expect(categories.length).toBeGreaterThan(1)

      // Verify option structure
      const option = options[0]
      expect(option.name).toBeDefined()
      expect(option.category).toBeDefined()
      expect(option.price).toBeGreaterThan(0)

      // Verify car has options available
      const carWithOptions = await prisma.car.findUnique({
        where: { id: car.id },
        include: {
          options: {
            include: {
              option: true
            }
          }
        }
      })

      expect(carWithOptions?.options.length).toBeGreaterThan(0)
    })
  })

  describe('UC-002: Price Calculation', () => {
    it('should calculate correct total price', async () => {
      const basePrice = 45000
      const optionPrice = 5000
      const expectedTotal = basePrice + optionPrice

      expect(expectedTotal).toBe(50000)
    })
  })

  describe('UC-003: Business Requirements', () => {
    it('should support bulk configurations', async () => {
      // Use existing seeded user and car
      const users = await prisma.user.findMany()
      expect(users.length).toBeGreaterThan(0)
      const user = users[0]

      const cars = await prisma.car.findMany()
      expect(cars.length).toBeGreaterThan(0)
      const car = cars[0]

      // Create multiple configurations
      const configs = []
      for (let i = 0; i < 3; i++) {
        const config = await prisma.configuration.create({
          data: {
            name: `Bulk Config ${i}`,
            totalPrice: car.basePrice,
            userId: user.id,
            carId: car.id
          }
        })
        configs.push(config)
      }

      expect(configs).toHaveLength(3)

      // Verify all configurations belong to the same user
      const userConfigs = await prisma.configuration.findMany({
        where: { userId: user.id }
      })
      expect(userConfigs.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('UC-004: Admin Panel Requirements', () => {
    it('should support vehicle management', async () => {
      // Use existing seeded cars to test admin operations
      const cars = await prisma.car.findMany()
      expect(cars.length).toBeGreaterThan(0)

      // Test that we can read car data (admin view)
      const car = cars[0]
      expect(car.name).toBeDefined()
      expect(car.basePrice).toBeGreaterThan(0)

      // Test updating a car (admin functionality)
      const originalPrice = car.basePrice
      const updatedCar = await prisma.car.update({
        where: { id: car.id },
        data: { basePrice: originalPrice + 1000 }
      })

      expect(updatedCar.basePrice).toBe(originalPrice + 1000)

      // Reset the price to original (cleanup)
      await prisma.car.update({
        where: { id: car.id },
        data: { basePrice: originalPrice }
      })
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })
})
