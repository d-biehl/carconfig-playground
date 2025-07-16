/**
 * ConfigurationService - Business logic for configuration management
 * Handles configuration operations, price calculation, and validation
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { NotFoundError, DatabaseError, ValidationError, withDatabaseError } from '@/lib/errorHandling'
import { OptionService } from './OptionService'

export interface ConfigurationCreateInput {
  name: string
  carId: string
  userId: string
  selectedOptions: string[]
  totalPrice?: number
}

export interface ConfigurationUpdateInput extends Partial<ConfigurationCreateInput> {
  id: string
}

export interface ConfigurationQueryOptions {
  userId?: string
  includeDetails?: boolean
  locale?: string
}

export interface PriceCalculationResult {
  basePrice: number
  optionsPrices: { id: string; name: string; price: number }[]
  totalPrice: number
}

export class ConfigurationService {
  /**
   * Get configurations with optional filtering
   */
  static async getConfigurations(options: ConfigurationQueryOptions = {}) {
    const { userId, includeDetails = true, locale = 'de' } = options

    try {
      logger.debug('Fetching configurations', { userId, includeDetails, locale })

      const whereClause = userId ? { userId } : {}

      const configurations = await withDatabaseError(async () => {
        return await prisma.configuration.findMany({
          where: whereClause,
          ...(includeDetails && {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              },
              car: {
                include: {
                  translations: {
                    where: { locale }
                  }
                }
              },
              options: {
                include: {
                  option: {
                    include: {
                      translations: {
                        where: { locale }
                      }
                    }
                  }
                }
              }
            }
          }),
          orderBy: {
            createdAt: 'desc'
          }
        })
      }, 'ConfigurationService.getConfigurations')

      logger.info('Configurations retrieved successfully', {
        count: configurations.length,
        userId: userId || 'all'
      })
      return configurations
    } catch (error) {
      logger.error('Error fetching configurations', { error, userId })
      throw new DatabaseError('Failed to fetch configurations')
    }
  }

  /**
   * Get a single configuration by ID
   */
  static async getConfigurationById(id: string, locale = 'de') {
    try {
      logger.debug('Fetching configuration by ID', { id, locale })

      const configuration = await prisma.configuration.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          car: {
            include: {
              translations: {
                where: { locale }
              }
            }
          },
          options: {
            include: {
              option: {
                include: {
                  translations: {
                    where: { locale }
                  }
                }
              }
            }
          }
        }
      })

      if (!configuration) {
        logger.warn('Configuration not found', { id })
        return null
      }

      logger.info('Configuration retrieved successfully', { id })
      return configuration
    } catch (error) {
      logger.error('Error fetching configuration by ID', { error, id })
      throw new Error('Failed to fetch configuration')
    }
  }

  /**
   * Create a new configuration
   */
  static async createConfiguration(input: ConfigurationCreateInput) {
    try {
      logger.debug('Creating new configuration', {
        name: input.name,
        carId: input.carId,
        userId: input.userId,
        optionsCount: input.selectedOptions.length
      })

      // Validate input data
      if (!input.name?.trim()) {
        throw new ValidationError('Configuration name is required')
      }
      if (!input.carId?.trim()) {
        throw new ValidationError('Car ID is required')
      }
      if (!input.userId?.trim()) {
        throw new ValidationError('User ID is required')
      }
      if (!Array.isArray(input.selectedOptions)) {
        throw new ValidationError('Selected options must be an array')
      }

      const result = await withDatabaseError(async () => {
        // Validate car exists
        const car = await prisma.car.findUnique({
          where: { id: input.carId },
          select: { id: true, name: true, basePrice: true }
        })

        if (!car) {
          throw new NotFoundError('Car', input.carId)
        }

        // Validate user exists
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
          select: { id: true, name: true }
        })

        if (!user) {
          throw new NotFoundError('User', input.userId)
        }

        // Validate options exist and check for conflicts
        if (input.selectedOptions.length > 0) {
          const conflictCheck = await OptionService.validateOptionConflicts(input.selectedOptions)
          if (conflictCheck.hasConflicts) {
            throw new ValidationError(`Option conflicts detected: ${conflictCheck.conflicts.join(', ')}`)
          }
        }

        // Calculate total price if not provided
        let totalPrice = input.totalPrice
        if (totalPrice === undefined) {
          const priceCalculation = await this.calculatePrice(input.carId, input.selectedOptions)
          totalPrice = priceCalculation.totalPrice
        }

        // Create configuration in transaction
        return await prisma.$transaction(async (tx) => {
          const config = await tx.configuration.create({
            data: {
              name: input.name,
              carId: input.carId,
              userId: input.userId,
              totalPrice
            }
          })

          // Create configuration-option relations
          if (input.selectedOptions.length > 0) {
            await tx.configurationOption.createMany({
              data: input.selectedOptions.map(optionId => ({
                configurationId: config.id,
                optionId
              }))
            })
          }

          return config
        })
      }, 'ConfigurationService.createConfiguration')

      logger.info('Configuration created successfully', {
        id: result.id,
        name: result.name,
        totalPrice: result.totalPrice
      })
      return result
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error
      }
      logger.error('Error creating configuration', {
        error,
        input: { name: input.name, carId: input.carId, userId: input.userId }
      })
      throw new DatabaseError('Failed to create configuration')
    }
  }

  /**
   * Update an existing configuration
   */
  static async updateConfiguration(input: ConfigurationUpdateInput) {
    try {
      logger.debug('Updating configuration', { id: input.id })

      // Check if configuration exists
      const existingConfig = await prisma.configuration.findUnique({
        where: { id: input.id }
      })

      if (!existingConfig) {
        logger.warn('Configuration not found for update', { id: input.id })
        throw new Error('Configuration not found')
      }

      // Validate car if changed
      if (input.carId && input.carId !== existingConfig.carId) {
        const car = await prisma.car.findUnique({
          where: { id: input.carId },
          select: { id: true }
        })
        if (!car) {
          throw new Error('Car not found')
        }
      }

      // Validate options and check conflicts if changed
      if (input.selectedOptions) {
        if (input.selectedOptions.length > 0) {
          const conflictCheck = await OptionService.validateOptionConflicts(input.selectedOptions)
          if (conflictCheck.hasConflicts) {
            throw new Error(`Option conflicts detected: ${conflictCheck.conflicts.join(', ')}`)
          }
        }
      }

      // Build update data
      const updateData: Partial<typeof existingConfig> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.carId !== undefined) updateData.carId = input.carId
      if (input.totalPrice !== undefined) updateData.totalPrice = input.totalPrice

      // Recalculate price if car or options changed
      if ((input.carId && input.carId !== existingConfig.carId) || input.selectedOptions) {
        const carId = input.carId || existingConfig.carId
        const selectedOptions = input.selectedOptions || []
        const priceCalculation = await this.calculatePrice(carId, selectedOptions)
        updateData.totalPrice = priceCalculation.totalPrice
      }

      // Update configuration in transaction
      const configuration = await prisma.$transaction(async (tx) => {
        const config = await tx.configuration.update({
          where: { id: input.id },
          data: updateData
        })

        // Update options if provided
        if (input.selectedOptions !== undefined) {
          // Delete existing option relations
          await tx.configurationOption.deleteMany({
            where: { configurationId: input.id }
          })

          // Create new option relations
          if (input.selectedOptions.length > 0) {
            await tx.configurationOption.createMany({
              data: input.selectedOptions.map(optionId => ({
                configurationId: input.id,
                optionId
              }))
            })
          }
        }

        return config
      })

      logger.info('Configuration updated successfully', { id: input.id })
      return configuration
    } catch (error) {
      logger.error('Error updating configuration', { error, id: input.id })
      throw error instanceof Error ? error : new Error('Failed to update configuration')
    }
  }

  /**
   * Delete a configuration
   */
  static async deleteConfiguration(id: string) {
    try {
      logger.debug('Deleting configuration', { id })

      // Check if configuration exists
      const existingConfig = await prisma.configuration.findUnique({
        where: { id }
      })

      if (!existingConfig) {
        logger.warn('Configuration not found for deletion', { id })
        throw new Error('Configuration not found')
      }

      // Delete configuration and related data in transaction
      await prisma.$transaction(async (tx) => {
        // Delete configuration-option relations
        await tx.configurationOption.deleteMany({
          where: { configurationId: id }
        })

        // Delete the configuration
        await tx.configuration.delete({
          where: { id }
        })
      })

      logger.info('Configuration deleted successfully', { id })
      return true
    } catch (error) {
      logger.error('Error deleting configuration', { error, id })
      throw new Error('Failed to delete configuration')
    }
  }

  /**
   * Calculate total price for a car with selected options
   */
  static async calculatePrice(carId: string, selectedOptions: string[]): Promise<PriceCalculationResult> {
    try {
      logger.debug('Calculating price', { carId, optionsCount: selectedOptions.length })

      // Get car base price
      const car = await prisma.car.findUnique({
        where: { id: carId },
        select: { basePrice: true, name: true }
      })

      if (!car) {
        throw new Error('Car not found for price calculation')
      }

      let optionsPrices: { id: string; name: string; price: number }[] = []
      let optionsTotal = 0

      // Get option prices if any selected
      if (selectedOptions.length > 0) {
        const options = await prisma.option.findMany({
          where: {
            id: { in: selectedOptions }
          },
          select: {
            id: true,
            name: true,
            price: true
          }
        })

        optionsPrices = options.map(option => ({
          id: option.id,
          name: option.name,
          price: option.price
        }))

        optionsTotal = options.reduce((sum, option) => sum + option.price, 0)
      }

      const result = {
        basePrice: car.basePrice,
        optionsPrices,
        totalPrice: car.basePrice + optionsTotal
      }

      logger.info('Price calculated successfully', {
        carId,
        basePrice: result.basePrice,
        optionsTotal,
        totalPrice: result.totalPrice
      })
      return result
    } catch (error) {
      logger.error('Error calculating price', { error, carId, selectedOptions })
      throw new Error('Failed to calculate price')
    }
  }

  /**
   * Get configurations by user ID
   */
  static async getConfigurationsByUserId(userId: string, locale = 'de') {
    return this.getConfigurations({ userId, includeDetails: true, locale })
  }

  /**
   * Validate configuration data before save
   */
  static async validateConfiguration(input: ConfigurationCreateInput): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      // Validate required fields
      if (!input.name?.trim()) {
        errors.push('Configuration name is required')
      }

      if (!input.carId?.trim()) {
        errors.push('Car selection is required')
      }

      if (!input.userId?.trim()) {
        errors.push('User ID is required')
      }

      // Validate car exists
      if (input.carId) {
        const car = await prisma.car.findUnique({
          where: { id: input.carId },
          select: { id: true }
        })
        if (!car) {
          errors.push('Selected car does not exist')
        }
      }

      // Validate user exists
      if (input.userId) {
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
          select: { id: true }
        })
        if (!user) {
          errors.push('User does not exist')
        }
      }

      // Validate options and check conflicts
      if (input.selectedOptions.length > 0) {
        const conflictCheck = await OptionService.validateOptionConflicts(input.selectedOptions)
        if (conflictCheck.hasConflicts) {
          errors.push(...conflictCheck.conflicts.map(conflict => `Option conflict: ${conflict}`))
        }
      }

      const isValid = errors.length === 0
      logger.debug('Configuration validation completed', { isValid, errorsCount: errors.length })

      return { isValid, errors }
    } catch (error) {
      logger.error('Error validating configuration', { error, input })
      errors.push('Validation failed due to system error')
      return { isValid: false, errors }
    }
  }
}
