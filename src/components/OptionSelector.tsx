'use client'

import { Check } from 'lucide-react'
import { Option, RequiredGroup } from '@/types'

interface OptionSelectorProps {
  option: Option
  isSelected: boolean
  exclusiveGroupSelected: boolean // Indicates if another option from same group is selected
  onToggle: (option: Option) => void
  className?: string
  requiredGroups?: RequiredGroup[]
}

export function OptionSelector({
  option,
  isSelected,
  exclusiveGroupSelected,
  onToggle,
  className = '',
  requiredGroups = []
}: OptionSelectorProps) {
  const isExclusive = !!option.exclusiveGroup
  const isRequired = !!option.isRequired

  // Check if this option's group is required based on RequiredGroup configuration
  const groupConfig = requiredGroups.find(rg => rg.exclusiveGroup === option.exclusiveGroup)
  const isGroupRequired = groupConfig?.isRequired || isRequired

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling to parent containers

    // If it's a required option and already selected, don't allow deselection
    if (isGroupRequired && isSelected) {
      return
    }
    onToggle(option)
  }

  if (isExclusive) {
    // Radio button style for exclusive options
    return (
      <div className="relative">
        <div
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center mt-1 transition-all ${
            isSelected
              ? isGroupRequired
                ? 'border-primary bg-primary shadow-sm cursor-default' // Required selected: not clickable
                : 'border-primary bg-primary shadow-sm cursor-pointer'  // Non-required selected: clickable
              : 'border-muted-foreground hover:border-primary/70 cursor-pointer' // Not selected: clickable
          } ${className}`}
          onClick={handleClick}
          data-testid={`option-radio-${option.id}`}
          title={`Radio: ${option.name} (${option.exclusiveGroup})${isGroupRequired ? ' - Erforderlich' : ''}${isGroupRequired && isSelected ? ' - Kann nicht abgewählt werden' : ''}`}
        >
          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-primary-foreground"></div>
          )}
        </div>
        {isGroupRequired && !isSelected && !exclusiveGroupSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}
      </div>
    )
  } else {
    // Checkbox style for independent options
    return (
      <div className="relative">
        <div
          className={`w-11 h-11 rounded-md border-2 flex items-center justify-center mt-1 transition-all ${
            isSelected
              ? isGroupRequired
                ? 'border-primary bg-primary shadow-sm cursor-default' // Required selected: not clickable
                : 'border-primary bg-primary shadow-sm cursor-pointer'  // Non-required selected: clickable
              : 'border-muted-foreground hover:border-primary/70 cursor-pointer' // Not selected: clickable
          } ${className}`}
          onClick={handleClick}
          data-testid={`option-checkbox-${option.id}`}
          title={`Checkbox: ${option.name} (no exclusive group)${isGroupRequired ? ' - Erforderlich' : ''}${isGroupRequired && isSelected ? ' - Kann nicht abgewählt werden' : ''}`}
        >
          {isSelected && <Check className="w-5 h-5 text-primary-foreground" />}
        </div>
        {isGroupRequired && !isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}
      </div>
    )
  }
}

interface OptionGroupIndicatorProps {
  exclusiveGroup?: string | null
  hasGroupSelection: boolean
  selectedOptionName?: string
  isRequired?: boolean
  requiredGroups?: RequiredGroup[]
}

export function OptionGroupIndicator({
  exclusiveGroup,
  hasGroupSelection,
  selectedOptionName,
  isRequired = false,
  requiredGroups = []
}: OptionGroupIndicatorProps) {
  if (!exclusiveGroup) return null

  // Check if this group is required based on configuration
  const groupConfig = requiredGroups.find(rg => rg.exclusiveGroup === exclusiveGroup)
  const isGroupRequired = groupConfig?.isRequired || isRequired

  const getGroupInfo = (group: string) => {
    switch (group) {
      case 'engine':
        return {
          label: 'Motor',
          description: `Wählen Sie einen Motor (nur eine Option möglich)${isGroupRequired ? ' - ERFORDERLICH' : ''}`,
          color: isGroupRequired ? 'text-red-700 bg-red-50 border-red-200' : 'text-blue-700 bg-blue-50 border-blue-200'
        }
      case 'paint':
        return {
          label: 'Lackierung',
          description: `Wählen Sie eine Lackierung (nur eine Option möglich)${isGroupRequired ? ' - ERFORDERLICH' : ''}`,
          color: isGroupRequired ? 'text-red-700 bg-red-50 border-red-200' : 'text-purple-700 bg-purple-50 border-purple-200'
        }
      case 'wheels':
        return {
          label: 'Felgen',
          description: `Wählen Sie Felgen (nur eine Option möglich)${isGroupRequired ? ' - ERFORDERLICH' : ''}`,
          color: isGroupRequired ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200'
        }
      default:
        return {
          label: group,
          description: 'Nur eine Option möglich',
          color: 'text-gray-700 bg-gray-50 border-gray-200'
        }
    }
  }

  const groupInfo = getGroupInfo(exclusiveGroup)

  return (
    <div className={`text-sm p-3 rounded-lg border ${groupInfo.color} mb-4`}>
      <div className="font-medium">{groupInfo.label}</div>
      <div className="text-xs mt-1">
        {hasGroupSelection && selectedOptionName
          ? `Ausgewählt: ${selectedOptionName}`
          : groupInfo.description
        }
      </div>
    </div>
  )
}
