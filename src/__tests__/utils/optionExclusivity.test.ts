import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { validateOptionConfiguration, getConflictingOptions, filterCompatibleOptions } from '@/lib/optionValidation'
import { prisma } from '@/lib/prisma'
import { Option } from '@/types'

describe('Option Exclusivity System', () => {
  let testOptions: { id: string; name: string; category: string; price: number; exclusiveGroup?: string | null }[] = []

  beforeAll(async () => {
    // Create test options with exclusive groups
    const sportEngine = await prisma.option.create({
      data: {
        name: 'Test Sport Engine',
        category: 'Motor',
        price: 5000,
        exclusiveGroup: 'engine'
      }
    })

    const hybridEngine = await prisma.option.create({
      data: {
        name: 'Test Hybrid Engine',
        category: 'Motor',
        price: 3000,
        exclusiveGroup: 'engine'
      }
    })

    const metallicPaint = await prisma.option.create({
      data: {
        name: 'Test Metallic Paint',
        category: 'Paint',
        price: 1000,
        exclusiveGroup: 'paint'
      }
    })

    const pearlPaint = await prisma.option.create({
      data: {
        name: 'Test Pearl Paint',
        category: 'Paint',
        price: 1500,
        exclusiveGroup: 'paint'
      }
    })

    const nonExclusiveOption = await prisma.option.create({
      data: {
        name: 'Test Non-exclusive Option',
        category: 'Comfort',
        price: 800
      }
    })

    testOptions = [sportEngine, hybridEngine, metallicPaint, pearlPaint, nonExclusiveOption]
  })

  afterAll(async () => {
    // Clean up test data
    for (const option of testOptions) {
      await prisma.option.delete({ where: { id: option.id } })
    }
  })

  describe('validateOptionConfiguration', () => {
    it('should allow non-conflicting options', async () => {
      const result = await validateOptionConfiguration([
        testOptions[0].id, // Sport Engine
        testOptions[2].id, // Metallic Paint
        testOptions[4].id  // Non-exclusive Option
      ])

      expect(result.isValid).toBe(true)
      expect(result.conflictingOptions).toHaveLength(0)
    })

    it('should detect conflicts within the same exclusive group', async () => {
      const result = await validateOptionConfiguration([
        testOptions[0].id, // Sport Engine
        testOptions[1].id  // Hybrid Engine (same group)
      ])

      expect(result.isValid).toBe(false)
      expect(result.conflictingOptions).toHaveLength(2)
      expect(result.message).toContain('mutually exclusive')
    })

    it('should detect multiple group conflicts', async () => {
      const result = await validateOptionConfiguration([
        testOptions[0].id, // Sport Engine
        testOptions[1].id, // Hybrid Engine (engine group conflict)
        testOptions[2].id, // Metallic Paint
        testOptions[3].id  // Pearl Paint (paint group conflict)
      ])

      expect(result.isValid).toBe(false)
      expect(result.conflictingOptions).toHaveLength(4) // All four conflicting options
    })
  })

  describe('getConflictingOptions', () => {
    it('should return conflicting options from same exclusive group', async () => {
      const conflicts = await getConflictingOptions(testOptions[0].id) // Sport Engine

      expect(conflicts).toContain(testOptions[1].id) // Hybrid Engine
      expect(conflicts).not.toContain(testOptions[2].id) // Metallic Paint (different group)
      expect(conflicts).not.toContain(testOptions[4].id) // Non-exclusive Option
    })

    it('should return empty array for non-exclusive options', async () => {
      const conflicts = await getConflictingOptions(testOptions[4].id) // Non-exclusive Option

      expect(conflicts).toHaveLength(0)
    })
  })

  describe('filterCompatibleOptions', () => {
    it('should return all options when none are selected', () => {
      const mockOptions: Option[] = testOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        category: opt.category,
        price: opt.price,
        exclusiveGroup: opt.exclusiveGroup || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      const compatible = filterCompatibleOptions(mockOptions, [])
      expect(compatible).toHaveLength(5)
    })

    it('should filter out conflicting options from same exclusive group', () => {
      const mockOptions: Option[] = testOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        category: opt.category,
        price: opt.price,
        exclusiveGroup: opt.exclusiveGroup || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      const compatible = filterCompatibleOptions(mockOptions, [testOptions[0].id]) // Sport Engine selected

      expect(compatible.some(opt => opt.id === testOptions[1].id)).toBe(false) // Hybrid Engine filtered out
      expect(compatible.some(opt => opt.id === testOptions[2].id)).toBe(true)  // Metallic Paint available
      expect(compatible.some(opt => opt.id === testOptions[4].id)).toBe(true)  // Non-exclusive available
    })

    it('should filter multiple exclusive groups correctly', () => {
      const mockOptions: Option[] = testOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        category: opt.category,
        price: opt.price,
        exclusiveGroup: opt.exclusiveGroup || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      const selectedIds = [testOptions[0].id, testOptions[2].id] // Sport Engine + Metallic Paint
      const compatible = filterCompatibleOptions(mockOptions, selectedIds)

      expect(compatible.some(opt => opt.id === testOptions[1].id)).toBe(false) // Hybrid Engine filtered
      expect(compatible.some(opt => opt.id === testOptions[3].id)).toBe(false) // Pearl Paint filtered
      expect(compatible.some(opt => opt.id === testOptions[4].id)).toBe(true)  // Non-exclusive available
    })
  })
})
