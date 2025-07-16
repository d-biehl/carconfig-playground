/**
 * OptionService - Business logic for option management
 * Handles option operations, validation, conflicts, and categorization
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { NotFoundError, DatabaseError, ValidationError, ConflictError, withDatabaseError } from '@/lib/errorHandling'

export interface OptionCreateInput {
  name: string
  category: string
  price: number
  description?: string
  detailedDescription?: string
  imageUrl?: string
  imageData?: string
  imageMimeType?: string
  exclusiveGroup?: string
  isRequired?: boolean
  translations?: {
    locale: string
    name: string
    category: string
    description?: string
    detailedDescription?: string
  }[]
}

export interface OptionUpdateInput extends Partial<OptionCreateInput> {
  id: string
}

export interface OptionQueryOptions {
  locale?: string
  grouped?: boolean
  includeTranslations?: boolean
}

export class OptionService {
  /**
   * Get all options with optional localization and grouping
   */
  static async getOptions(options: OptionQueryOptions = {}) {
    const { locale = 'de', grouped = true, includeTranslations = true } = options

    try {
      logger.debug('Fetching options', { locale, grouped, includeTranslations })

      const optionsList = await withDatabaseError(async () => {
        return await prisma.option.findMany({
          include: {
            translations: includeTranslations ? {
              where: { locale }
            } : false
          },
          orderBy: [
            { category: 'asc' },
            { name: 'asc' }
          ]
        })
      }, 'OptionService.getOptions')

      // Apply localization
      const localizedOptions = optionsList.map(option => this.localizeOptionData(option))

      if (grouped) {
        // Group options by category
        const groupedOptions = localizedOptions.reduce((acc, option) => {
          const category = String(option.category)
          if (!acc[category]) {
            acc[category] = []
          }
          acc[category].push(option)
          return acc
        }, {} as Record<string, typeof localizedOptions>)

        logger.info('Grouped options retrieved successfully', {
          categories: Object.keys(groupedOptions).length,
          totalOptions: localizedOptions.length
        })
        return groupedOptions
      }

      logger.info('Options retrieved successfully', { count: localizedOptions.length })
      return localizedOptions
    } catch (error) {
      logger.error('Error fetching options', { error, locale, grouped })
      throw new DatabaseError('Failed to fetch options')
    }
  }

  /**
   * Get a single option by ID
   */
  static async getOptionById(id: string, locale = 'de') {
    try {
      logger.debug('Fetching option by ID', { id, locale })

      const option = await withDatabaseError(async () => {
        return await prisma.option.findUnique({
          where: { id },
          include: {
            translations: {
              where: { locale }
            }
          }
        })
      }, 'OptionService.getOptionById')

      if (!option) {
        logger.warn('Option not found', { id })
        throw new NotFoundError('Option', id)
      }

      const localizedOption = this.localizeOptionData(option)
      logger.info('Option retrieved successfully', { id, locale })
      return localizedOption
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      logger.error('Error fetching option by ID', { error, id, locale })
      throw new DatabaseError('Failed to fetch option')
    }
  }

  /**
   * Create a new option
   */
  static async createOption(input: OptionCreateInput) {
    try {
      logger.debug('Creating new option', { name: input.name, category: input.category })

      // Validate input data
      if (!input.name?.trim()) {
        throw new ValidationError('Option name is required')
      }
      if (!input.category?.trim()) {
        throw new ValidationError('Option category is required')
      }
      if (typeof input.price !== 'number' || input.price < 0) {
        throw new ValidationError('Valid option price is required (must be >= 0)')
      }

      // Validate image data if provided
      if (input.imageData && (!input.imageMimeType || !input.imageMimeType.startsWith('image/'))) {
        throw new ValidationError('Invalid image format - only image files are allowed')
      }

      // Validate exclusive group conflicts
      if (input.exclusiveGroup) {
        await this.validateExclusiveGroupConflicts(input.exclusiveGroup, input.name)
      }

      const result = await withDatabaseError(async () => {
        const option = await prisma.option.create({
          data: {
            name: input.name,
            category: input.category,
            price: typeof input.price === 'string' ? parseFloat(input.price) : input.price,
            description: input.description || null,
            detailedDescription: input.detailedDescription || null,
            imageUrl: input.imageData ? null : input.imageUrl,
            imageData: input.imageData || null,
            imageMimeType: input.imageMimeType || null,
            exclusiveGroup: input.exclusiveGroup || null,
            isRequired: input.isRequired || false
          }
        })

        // Create translations if provided
        if (input.translations && input.translations.length > 0) {
          await prisma.optionTranslation.createMany({
            data: input.translations.map(translation => ({
              optionId: option.id,
              locale: translation.locale,
              name: translation.name,
              category: translation.category,
              description: translation.description || null,
              detailedDescription: translation.detailedDescription || null
            }))
          })
        }

        // Return created option with translations
        return await prisma.option.findUnique({
          where: { id: option.id },
          include: { translations: true }
        })
      }, 'OptionService.createOption')

      logger.info('Option created successfully', { id: result?.id, name: input.name })
      return result
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error
      }
      logger.error('Error creating option', { error, input: { name: input.name, category: input.category } })
      throw new DatabaseError('Failed to create option')
    }
  }

  /**
   * Update an existing option
   */
  static async updateOption(input: OptionUpdateInput) {
    try {
      logger.debug('Updating option', { id: input.id })

      // Check if option exists
      const existingOption = await prisma.option.findUnique({
        where: { id: input.id }
      })

      if (!existingOption) {
        logger.warn('Option not found for update', { id: input.id })
        throw new Error('Option not found')
      }

      // Validate image data if provided
      if (input.imageData && (!input.imageMimeType || !input.imageMimeType.startsWith('image/'))) {
        throw new Error('Invalid image format')
      }

      // Validate exclusive group conflicts if changed
      if (input.exclusiveGroup && input.exclusiveGroup !== existingOption.exclusiveGroup) {
        await this.validateExclusiveGroupConflicts(input.exclusiveGroup, input.name || existingOption.name, input.id)
      }

      // Build update data
      const updateData: Partial<typeof existingOption> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.category !== undefined) updateData.category = input.category
      if (input.price !== undefined) updateData.price = typeof input.price === 'string' ? parseFloat(input.price) : input.price
      if (input.description !== undefined) updateData.description = input.description
      if (input.detailedDescription !== undefined) updateData.detailedDescription = input.detailedDescription
      if (input.imageUrl !== undefined) updateData.imageUrl = input.imageData ? null : input.imageUrl
      if (input.imageData !== undefined) updateData.imageData = input.imageData
      if (input.imageMimeType !== undefined) updateData.imageMimeType = input.imageMimeType
      if (input.exclusiveGroup !== undefined) updateData.exclusiveGroup = input.exclusiveGroup
      if (input.isRequired !== undefined) updateData.isRequired = input.isRequired

      const option = await prisma.option.update({
        where: { id: input.id },
        data: updateData,
        include: {
          translations: true
        }
      })

      // Handle translations update if provided
      if (input.translations) {
        // Delete existing translations
        await prisma.optionTranslation.deleteMany({
          where: { optionId: input.id }
        })

        // Create new translations
        await prisma.optionTranslation.createMany({
          data: input.translations.map((t) => ({
            optionId: input.id,
            locale: t.locale,
            name: t.name,
            category: t.category,
            description: t.description || null,
            detailedDescription: t.detailedDescription || null
          }))
        })
      }

      logger.info('Option updated successfully', { id: input.id })
      return option
    } catch (error) {
      logger.error('Error updating option', { error, id: input.id })
      throw error instanceof Error ? error : new Error('Failed to update option')
    }
  }

  /**
   * Delete an option
   */
  static async deleteOption(id: string) {
    try {
      logger.debug('Deleting option', { id })

      // Check if option exists
      const existingOption = await prisma.option.findUnique({
        where: { id }
      })

      if (!existingOption) {
        logger.warn('Option not found for deletion', { id })
        throw new Error('Option not found')
      }

      // Delete related data in proper order
      await prisma.$transaction(async (tx) => {
        // Delete option translations
        await tx.optionTranslation.deleteMany({
          where: { optionId: id }
        })

        // Delete car-option relations
        await tx.carOption.deleteMany({
          where: { optionId: id }
        })

        // Delete configuration-option relations
        await tx.configurationOption.deleteMany({
          where: { optionId: id }
        })

        // Delete the option
        await tx.option.delete({
          where: { id }
        })
      })

      logger.info('Option deleted successfully', { id })
      return true
    } catch (error) {
      logger.error('Error deleting option', { error, id })
      throw new Error('Failed to delete option')
    }
  }

  /**
   * Get options for admin (all translations included)
   */
  static async getOptionsForAdmin() {
    try {
      logger.debug('Fetching options for admin')

      const options = await prisma.option.findMany({
        include: {
          translations: {
            orderBy: {
              locale: 'asc'
            }
          }
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      })

      logger.info('Admin options retrieved successfully', { count: options.length })
      return options
    } catch (error) {
      logger.error('Error fetching admin options', { error })
      throw new Error('Failed to fetch options for admin')
    }
  }

  /**
   * Validate exclusive group conflicts
   */
  private static async validateExclusiveGroupConflicts(exclusiveGroup: string, optionName: string, excludeId?: string) {
    if (!exclusiveGroup.trim()) return

    const conflictingOptions = await prisma.option.findMany({
      where: {
        exclusiveGroup,
        id: excludeId ? { not: excludeId } : undefined
      },
      select: {
        id: true,
        name: true
      }
    })

    if (conflictingOptions.length > 0) {
      const conflictNames = conflictingOptions.map(opt => opt.name).join(', ')
      logger.warn('Exclusive group conflict detected', {
        exclusiveGroup,
        optionName,
        conflictingOptions: conflictNames
      })
      throw new Error(`Option conflicts with existing options in group "${exclusiveGroup}": ${conflictNames}`)
    }
  }

  /**
   * Get options by exclusive group
   */
  static async getOptionsByExclusiveGroup(exclusiveGroup: string) {
    try {
      logger.debug('Fetching options by exclusive group', { exclusiveGroup })

      const options = await prisma.option.findMany({
        where: {
          exclusiveGroup
        },
        include: {
          translations: true
        }
      })

      const localizedOptions = options.map(option => this.localizeOptionData(option))
      logger.info('Options by exclusive group retrieved', { exclusiveGroup, count: options.length })
      return localizedOptions
    } catch (error) {
      logger.error('Error fetching options by exclusive group', { error, exclusiveGroup })
      throw new Error('Failed to fetch options by exclusive group')
    }
  }

  /**
   * Validate option conflicts for a configuration
   */
  static async validateOptionConflicts(selectedOptions: string[]) {
    try {
      logger.debug('Validating option conflicts', { selectedOptions })

      // Validate input
      if (!Array.isArray(selectedOptions)) {
        throw new ValidationError('Selected options must be an array')
      }
      if (selectedOptions.length === 0) {
        return { hasConflicts: false, conflicts: [] }
      }

      const options = await withDatabaseError(async () => {
        return await prisma.option.findMany({
          where: {
            id: { in: selectedOptions }
          },
          select: {
            id: true,
            name: true,
            exclusiveGroup: true
          }
        })
      }, 'OptionService.validateOptionConflicts')

      // Check if all requested options exist
      if (options.length !== selectedOptions.length) {
        const foundIds = options.map(o => o.id)
        const missingIds = selectedOptions.filter(id => !foundIds.includes(id))
        throw new NotFoundError(`Options`, missingIds.join(', '))
      }

      const conflicts: string[] = []
      const exclusiveGroups = new Map<string, string[]>()

      // Group options by exclusive group
      options.forEach(option => {
        if (option.exclusiveGroup) {
          if (!exclusiveGroups.has(option.exclusiveGroup)) {
            exclusiveGroups.set(option.exclusiveGroup, [])
          }
          exclusiveGroups.get(option.exclusiveGroup)!.push(option.name)
        }
      })

      // Check for conflicts (more than one option in same exclusive group)
      exclusiveGroups.forEach((optionNames, group) => {
        if (optionNames.length > 1) {
          conflicts.push(`Exclusive group "${group}": ${optionNames.join(', ')}`)
        }
      })

      if (conflicts.length > 0) {
        logger.warn('Option conflicts detected', { conflicts })
        return {
          hasConflicts: true,
          conflicts
        }
      }

      logger.info('No option conflicts detected')
      return {
        hasConflicts: false,
        conflicts: []
      }
    } catch (error) {
      logger.error('Error validating option conflicts', { error, selectedOptions })
      throw new Error('Failed to validate option conflicts')
    }
  }

  /**
   * Apply localization to option data
   */
  private static localizeOptionData(option: Record<string, unknown>) {
    const translation = Array.isArray(option.translations) ? option.translations[0] : null

    return {
      ...option,
      name: (translation as Record<string, unknown>)?.name || option.name,
      category: (translation as Record<string, unknown>)?.category || option.category,
      description: (translation as Record<string, unknown>)?.description || option.description,
      detailedDescription: (translation as Record<string, unknown>)?.detailedDescription || option.detailedDescription
    }
  }
}
