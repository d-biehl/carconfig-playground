import { describe, it, expect } from 'vitest'
import { formatPrice, generateCarImageUrl, generateOptionImageUrl, cn } from '@/lib/utils'

describe('Utils Functions', () => {
  describe('formatPrice', () => {
    it('should format prices correctly in EUR', () => {
      expect(formatPrice(45000)).toMatch(/45\.000,00\s*€/)
      expect(formatPrice(1200)).toMatch(/1\.200,00\s*€/)
      expect(formatPrice(0)).toMatch(/0,00\s*€/)
      expect(formatPrice(999.99)).toMatch(/999,99\s*€/)
    })

    it('should handle large numbers', () => {
      expect(formatPrice(1000000)).toMatch(/1\.000\.000,00\s*€/)
      expect(formatPrice(123456.78)).toMatch(/123\.456,78\s*€/)
    })
  })

  describe('generateCarImageUrl', () => {
    it('should generate correct image URLs for car names', () => {
      expect(generateCarImageUrl('Luxury X5 SUV')).toBe('/images/cars/luxury-x5-suv.jpg')
      expect(generateCarImageUrl('Elegance Sedan')).toBe('/images/cars/elegance-sedan.jpg')
      expect(generateCarImageUrl('Prestige Coupe')).toBe('/images/cars/prestige-coupe.jpg')
    })

    it('should handle special characters and spaces', () => {
      expect(generateCarImageUrl('Test Car Name')).toBe('/images/cars/test-car-name.jpg')
      expect(generateCarImageUrl('Special/Car&Name')).toBe('/images/cars/special/car&name.jpg')
    })
  })

  describe('generateOptionImageUrl', () => {
    it('should generate correct image URLs for option names', () => {
      expect(generateOptionImageUrl('Sportmotor 3.0L V6')).toBe('/images/options/sportmotor-3.0l-v6.jpg')
      expect(generateOptionImageUrl('Metallic-Lackierung')).toBe('/images/options/metallic-lackierung.jpg')
    })
  })

  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('btn', 'btn-primary')).toBe('btn btn-primary')
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500') // tailwind merge should work
    })

    it('should handle conditional classes', () => {
      expect(cn('btn', true && 'active', false && 'disabled')).toBe('btn active')
    })
  })
})
