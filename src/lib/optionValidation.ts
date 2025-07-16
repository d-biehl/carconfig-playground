import { Option } from '@/types'
import { prisma } from './prisma'

export interface OptionValidationResult {
  isValid: boolean
  conflictingOptions: Option[]
  message?: string
}

/**
 * Validates if a set of options can be configured together
 * @param optionIds Array of option IDs to validate
 * @param carId Optional car ID to validate compatibility
 * @returns Validation result with any conflicts
 */
export async function validateOptionConfiguration(
  optionIds: string[],
  carId?: string
): Promise<OptionValidationResult> {
  try {
    // Get all options with their details
    const options = await prisma.option.findMany({
      where: {
        id: {
          in: optionIds
        }
      },
      include: {
        conflictsWith: {
          include: {
            toOption: true
          }
        }
      }
    })

    // Check for exclusive group conflicts
    const exclusiveGroups = new Map<string, Option[]>()

    for (const option of options) {
      if (option.exclusiveGroup) {
        if (!exclusiveGroups.has(option.exclusiveGroup)) {
          exclusiveGroups.set(option.exclusiveGroup, [])
        }
        exclusiveGroups.get(option.exclusiveGroup)!.push(option as Option)
      }
    }

    // Find conflicts within exclusive groups
    const conflictingOptions: Option[] = []
    for (const [, groupOptions] of exclusiveGroups) {
      if (groupOptions.length > 1) {
        conflictingOptions.push(...groupOptions)
      }
    }

    // Check for explicit conflicts
    for (const option of options) {
      for (const conflict of option.conflictsWith) {
        if (optionIds.includes(conflict.toOptionId)) {
          if (!conflictingOptions.some(o => o.id === option.id)) {
            conflictingOptions.push(option as Option)
          }
          if (!conflictingOptions.some(o => o.id === conflict.toOption.id)) {
            conflictingOptions.push(conflict.toOption as Option)
          }
        }
      }
    }

    if (conflictingOptions.length > 0) {
      return {
        isValid: false,
        conflictingOptions,
        message: 'Some selected options are mutually exclusive'
      }
    }

    // If carId is provided, check car compatibility
    if (carId) {
      const carOptions = await prisma.carOption.findMany({
        where: {
          carId,
          optionId: {
            in: optionIds
          }
        }
      })

      const incompatibleOptionIds = optionIds.filter(
        id => !carOptions.some(co => co.optionId === id)
      )

      if (incompatibleOptionIds.length > 0) {
        const incompatibleOptions = options.filter(
          o => incompatibleOptionIds.includes(o.id)
        )

        return {
          isValid: false,
          conflictingOptions: incompatibleOptions as Option[],
          message: 'Some options are not compatible with this car model'
        }
      }
    }

    return {
      isValid: true,
      conflictingOptions: []
    }

  } catch (error) {
    console.error('Error validating option configuration:', error)
    return {
      isValid: false,
      conflictingOptions: [],
      message: 'Error validating configuration'
    }
  }
}

/**
 * Gets options that would conflict with a given option
 * @param optionId The option ID to check conflicts for
 * @returns Array of conflicting option IDs
 */
export async function getConflictingOptions(optionId: string): Promise<string[]> {
  try {
    const option = await prisma.option.findUnique({
      where: { id: optionId },
      include: {
        conflictsWith: true,
        conflictsAgainst: true
      }
    })

    if (!option) return []

    const conflictingIds: string[] = []

    // Add explicit conflicts
    option.conflictsWith.forEach(conflict => {
      conflictingIds.push(conflict.toOptionId)
    })

    option.conflictsAgainst.forEach(conflict => {
      conflictingIds.push(conflict.fromOptionId)
    })

    // Add options from the same exclusive group
    if (option.exclusiveGroup) {
      const groupOptions = await prisma.option.findMany({
        where: {
          exclusiveGroup: option.exclusiveGroup,
          id: {
            not: optionId
          }
        },
        select: {
          id: true
        }
      })

      groupOptions.forEach(opt => {
        conflictingIds.push(opt.id)
      })
    }

    return [...new Set(conflictingIds)] // Remove duplicates

  } catch (error) {
    console.error('Error getting conflicting options:', error)
    return []
  }
}

/**
 * Filters options that are compatible with already selected options
 * @param availableOptions All available options
 * @param selectedOptionIds Currently selected option IDs
 * @returns Filtered options that don't conflict
 */
export function filterCompatibleOptions(
  availableOptions: Option[],
  selectedOptionIds: string[]
): Option[] {
  if (selectedOptionIds.length === 0) {
    return availableOptions
  }

  return availableOptions.filter(option => {
    // Check if this option conflicts with any selected option
    const hasExclusiveGroupConflict = selectedOptionIds.some(selectedId => {
      const selectedOption = availableOptions.find(o => o.id === selectedId)
      return selectedOption?.exclusiveGroup &&
             selectedOption.exclusiveGroup === option.exclusiveGroup
    })

    return !hasExclusiveGroupConflict
  })
}

/**
 * Validates if all required options are selected for a car
 * @param selectedOptionIds Array of selected option IDs
 * @param carId Car ID to check requirements for
 * @returns Validation result indicating missing required options
 */
export async function validateRequiredOptions(
  selectedOptionIds: string[],
  carId: string
): Promise<{ isValid: boolean; missingRequired: Option[]; message?: string }> {
  try {
    // Get all options available for the car
    const carWithOptions = await prisma.car.findUnique({
      where: { id: carId },
      include: {
        options: {
          include: {
            option: true
          }
        }
      }
    })

    if (!carWithOptions) {
      return {
        isValid: false,
        missingRequired: [],
        message: 'Car not found'
      }
    }

    // Get required groups configuration
    const requiredGroups = await prisma.requiredGroup.findMany({
      where: {
        isRequired: true
      }
    })

    const requiredGroupNames = new Set(requiredGroups.map(rg => rg.exclusiveGroup))

    // Find all required options for this car - check both individual required options and required groups
    const allCarOptions = carWithOptions.options.map(co => co.option as Option)

    // Individual required options
    const individuallyRequiredOptions = allCarOptions.filter(option => option.isRequired)

    // Options from required groups (exclusive groups that are marked as required)
    const groupRequiredOptions = allCarOptions.filter(option =>
      option.exclusiveGroup && requiredGroupNames.has(option.exclusiveGroup)
    )

    // Check which individually required options are missing
    const missingIndividualRequired = individuallyRequiredOptions.filter(
      requiredOption => !selectedOptionIds.includes(requiredOption.id)
    )

    // For required exclusive groups, check if at least one option from each group is selected
    const selectedOptions = allCarOptions.filter(option => selectedOptionIds.includes(option.id))
    const selectedGroups = new Set(
      selectedOptions
        .filter(opt => opt.exclusiveGroup)
        .map(opt => opt.exclusiveGroup!)
    )

    // Check if all required exclusive groups have a selection
    const missingRequiredGroups = Array.from(requiredGroupNames)
      .filter(group => !selectedGroups.has(group))

    // For each missing required group, add one representative option as "missing"
    const missingGroupRepresentatives = missingRequiredGroups.map(group => {
      const optionsInGroup = groupRequiredOptions.filter(opt => opt.exclusiveGroup === group)
      return optionsInGroup[0] // Just take the first option as representative
    }).filter(Boolean)

    const allMissingRequired = [...missingIndividualRequired, ...missingGroupRepresentatives]

    return {
      isValid: allMissingRequired.length === 0,
      missingRequired: allMissingRequired,
      message: allMissingRequired.length > 0
        ? `Folgende Optionen sind erforderlich: ${allMissingRequired.map(opt => opt.name).join(', ')}`
        : undefined
    }
  } catch (error) {
    console.error('Error validating required options:', error)
    return {
      isValid: false,
      missingRequired: [],
      message: 'Validation error occurred'
    }
  }
}
