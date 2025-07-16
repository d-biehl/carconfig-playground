'use client'

import { Option } from '@/types'
import { AlertTriangle } from 'lucide-react'

interface ExclusiveGroupIndicatorProps {
  option: Option
  selectedOptions: Option[]
  onRemoveConflicting?: (conflictingOptions: Option[]) => void
}

export function ExclusiveGroupIndicator({
  option,
  selectedOptions,
  onRemoveConflicting
}: ExclusiveGroupIndicatorProps) {
  if (!option.exclusiveGroup) return null

  const conflictingOptions = selectedOptions.filter(
    selected =>
      selected.id !== option.id &&
      selected.exclusiveGroup === option.exclusiveGroup
  )

  if (conflictingOptions.length === 0) return null

  const handleRemoveConflicting = () => {
    if (onRemoveConflicting) {
      onRemoveConflicting(conflictingOptions)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
      <div className="flex items-start space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-amber-800">
            Diese Option schließt folgende Optionen aus:
          </div>
          <div className="text-sm text-amber-700 mt-1">
            {conflictingOptions.map(opt => opt.name).join(', ')}
          </div>
          {onRemoveConflicting && (
            <button
              onClick={handleRemoveConflicting}
              className="text-xs text-amber-600 underline mt-1 hover:text-amber-800"
            >
              Konfliktende Optionen entfernen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ExclusiveGroupBadgeProps {
  exclusiveGroup: string
  className?: string
}

export function ExclusiveGroupBadge({ exclusiveGroup, className = '' }: ExclusiveGroupBadgeProps) {
  const getGroupLabel = (group: string) => {
    switch (group) {
      case 'engine': return 'Motor'
      case 'paint': return 'Lackierung'
      case 'wheels': return 'Felgen'
      default: return group
    }
  }

  const getGroupColor = (group: string) => {
    switch (group) {
      case 'engine': return 'bg-blue-100 text-blue-800'
      case 'paint': return 'bg-purple-100 text-purple-800'
      case 'wheels': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGroupColor(exclusiveGroup)} ${className}`}>
      {getGroupLabel(exclusiveGroup)}
    </span>
  )
}
