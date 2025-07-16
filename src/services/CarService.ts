/**
 * CarService - Business logic for car management
 * Handles car operations, localization, and image processing
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { NotFoundError, DatabaseError, ValidationError, withDatabaseError } from '@/lib/errorHandling'

export interface CarCreateInput {
  name: string
  category: string
  basePrice: number
  description: string
  imageUrl?: string
  imageData?: string
  imageMimeType?: string
  translations?: {
    locale: string
    name: string
    category: string
    description: string
  }[]
}

export interface CarUpdateInput extends Partial<CarCreateInput> {
  id: string
}

export interface CarQueryOptions {
  locale?: string
  includeOptions?: boolean
  includeTranslations?: boolean
}

export class CarService {
  /**
   * Get all cars with optional localization and filtering
   */
  static async getCars(options: CarQueryOptions = {}) {
    const { locale = 'de', includeOptions = true, includeTranslations = true } = options

    try {
      logger.debug('Fetching cars', { locale, includeOptions, includeTranslations })

      const cars = await withDatabaseError(async () => {
        return await prisma.car.findMany({
          include: {
            options: includeOptions ? {
              include: {
                option: {
                  include: {
                    translations: {
                      where: { locale }
                    }
                  }
                }
              }
            } : false,
            translations: includeTranslations ? {
              where: { locale }
            } : false
          },
          orderBy: {
            name: 'asc'
          }
        })
      }, 'CarService.getCars')

      // Apply localization
      const localizedCars = cars.map(car => this.localizeCarData(car))

      logger.info('Cars retrieved successfully', { count: cars.length, locale })
      return localizedCars
    } catch (error) {
      logger.error('Error fetching cars', { error, locale })
      throw new DatabaseError('Failed to fetch cars')
    }
  }

  /**
   * Get a single car by ID
   */
  static async getCarById(id: string, options: CarQueryOptions = {}) {
    const { locale = 'de', includeOptions = true } = options

    try {
      logger.debug('Fetching car by ID', { id, locale })

      const car = await withDatabaseError(async () => {
        return await prisma.car.findUnique({
          where: { id },
          include: {
            options: includeOptions ? {
              include: {
                option: {
                  include: {
                    translations: {
                      where: { locale }
                    }
                  }
                }
              }
            } : false,
            translations: {
              where: { locale }
            }
          }
        })
      }, 'CarService.getCarById')

      if (!car) {
        logger.warn('Car not found', { id })
        throw new NotFoundError('Car', id)
      }

      const localizedCar = this.localizeCarData(car)
      logger.info('Car retrieved successfully', { id, locale })
      return localizedCar
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      logger.error('Error fetching car by ID', { error, id, locale })
      throw new DatabaseError('Failed to fetch car')
    }
  }

  /**
   * Create a new car
   */
  static async createCar(input: CarCreateInput) {
    try {
      logger.debug('Creating new car', { name: input.name, category: input.category })

      // Validate image data if provided
      if (input.imageData && (!input.imageMimeType || !input.imageMimeType.startsWith('image/'))) {
        throw new ValidationError('Invalid image format - only image files are allowed')
      }

      // Validate required fields
      if (!input.name?.trim()) {
        throw new ValidationError('Car name is required')
      }
      if (!input.category?.trim()) {
        throw new ValidationError('Car category is required')
      }
      if (typeof input.basePrice !== 'number' || input.basePrice <= 0) {
        throw new ValidationError('Valid base price is required')
      }

      const car = await withDatabaseError(async () => {
        return await prisma.car.create({
          data: {
            name: input.name,
            category: input.category,
            basePrice: typeof input.basePrice === 'string' ? parseFloat(input.basePrice) : input.basePrice,
            description: input.description,
            imageUrl: input.imageData ? null : (input.imageUrl || `/images/cars/${input.name.toLowerCase().replace(/\s+/g, '-')}.jpg`),
            imageData: input.imageData || null,
            imageMimeType: input.imageMimeType || null,
            translations: input.translations ? {
              create: input.translations.map((t) => ({
                locale: t.locale,
                name: t.name,
                category: t.category,
                description: t.description
              }))
            } : undefined
          },
          include: {
            translations: true
          }
        })
      }, 'CarService.createCar')

      logger.info('Car created successfully', { id: car.id, name: car.name })
      return car
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      logger.error('Error creating car', { error, input: { name: input.name, category: input.category } })
      throw new DatabaseError('Failed to create car')
    }
  }

  /**
   * Update an existing car
   */
  static async updateCar(input: CarUpdateInput) {
    try {
      logger.debug('Updating car', { id: input.id })

      // Validate image data if provided
      if (input.imageData && (!input.imageMimeType || !input.imageMimeType.startsWith('image/'))) {
        throw new ValidationError('Invalid image format - only image files are allowed')
      }

      // Validate fields if provided
      if (input.name !== undefined && !input.name?.trim()) {
        throw new ValidationError('Car name cannot be empty')
      }
      if (input.category !== undefined && !input.category?.trim()) {
        throw new ValidationError('Car category cannot be empty')
      }
      if (input.basePrice !== undefined && (typeof input.basePrice !== 'number' || input.basePrice <= 0)) {
        throw new ValidationError('Valid base price is required')
      }

      const car = await withDatabaseError(async () => {
        // Check if car exists
        const existingCar = await prisma.car.findUnique({
          where: { id: input.id }
        })

        if (!existingCar) {
          throw new NotFoundError('Car', input.id)
        }

        // Build update data
        const updateData: Partial<typeof existingCar> = {}
        if (input.name !== undefined) updateData.name = input.name
        if (input.category !== undefined) updateData.category = input.category
        if (input.basePrice !== undefined) updateData.basePrice = typeof input.basePrice === 'string' ? parseFloat(input.basePrice) : input.basePrice
        if (input.description !== undefined) updateData.description = input.description
        if (input.imageUrl !== undefined) updateData.imageUrl = input.imageData ? null : input.imageUrl
        if (input.imageData !== undefined) updateData.imageData = input.imageData
        if (input.imageMimeType !== undefined) updateData.imageMimeType = input.imageMimeType

        const updatedCar = await prisma.car.update({
          where: { id: input.id },
          data: updateData,
          include: {
            translations: true
          }
        })

        // Handle translations update if provided
        if (input.translations) {
          // Delete existing translations
          await prisma.carTranslation.deleteMany({
            where: { carId: input.id }
          })

          // Create new translations
          await prisma.carTranslation.createMany({
            data: input.translations.map((t) => ({
              carId: input.id,
              locale: t.locale,
              name: t.name,
              category: t.category,
              description: t.description
            }))
          })
        }

        return updatedCar
      }, 'CarService.updateCar')

      logger.info('Car updated successfully', { id: input.id })
      return car
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error
      }
      logger.error('Error updating car', { error, id: input.id })
      throw new DatabaseError('Failed to update car')
    }
  }

  /**
   * Delete a car
   */
  static async deleteCar(id: string) {
    try {
      logger.debug('Deleting car', { id })

      const result = await withDatabaseError(async () => {
        // Check if car exists
        const existingCar = await prisma.car.findUnique({
          where: { id }
        })

        if (!existingCar) {
          throw new NotFoundError('Car', id)
        }

        // Delete related data in proper order using transaction
        await prisma.$transaction(async (tx) => {
          // Delete car translations
          await tx.carTranslation.deleteMany({
            where: { carId: id }
          })

          // Delete car-option relations
          await tx.carOption.deleteMany({
            where: { carId: id }
          })

          // Delete the car
          await tx.car.delete({
            where: { id }
          })
        })

        return true
      }, 'CarService.deleteCar')

      logger.info('Car deleted successfully', { id })
      return result
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      logger.error('Error deleting car', { error, id })
      throw new DatabaseError('Failed to delete car')
    }
  }

  /**
   * Apply localization to car data
   */
  private static localizeCarData(car: Record<string, unknown>) {
    const translation = Array.isArray(car.translations) ? car.translations[0] : null

    const localizedCar: Record<string, unknown> = {
      ...car,
      name: (translation as Record<string, unknown>)?.name || car.name,
      category: (translation as Record<string, unknown>)?.category || car.category,
      description: (translation as Record<string, unknown>)?.description || car.description
    }

    // Localize options if present
    if (Array.isArray(car.options)) {
      localizedCar.options = car.options.map((carOption: Record<string, unknown>) => {
        const option = carOption.option as Record<string, unknown>
        const optionTranslation = Array.isArray(option?.translations) ? option.translations[0] : null
        return {
          ...carOption,
          option: {
            ...option,
            name: (optionTranslation as Record<string, unknown>)?.name || option?.name,
            category: (optionTranslation as Record<string, unknown>)?.category || option?.category,
            description: (optionTranslation as Record<string, unknown>)?.description || option?.description,
            detailedDescription: (optionTranslation as Record<string, unknown>)?.detailedDescription || option?.detailedDescription,
            exclusiveGroup: option?.exclusiveGroup,
            isRequired: option?.isRequired
          }
        }
      })
    }

    return localizedCar
  }

  /**
   * Get cars for admin (all translations included)
   */
  static async getCarsForAdmin() {
    try {
      logger.debug('Fetching cars for admin')

      const cars = await withDatabaseError(async () => {
        return await prisma.car.findMany({
          include: {
            translations: {
              orderBy: {
                locale: 'asc'
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        })
      }, 'CarService.getCarsForAdmin')

      logger.info('Admin cars retrieved successfully', { count: cars.length })
      return cars
    } catch (error) {
      logger.error('Error fetching admin cars', { error })
      throw new DatabaseError('Failed to fetch cars for admin')
    }
  }
}
