import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

export function generateCarImageUrl(carName: string): string {
  // In a real app, this would generate proper image URLs
  const slug = carName.toLowerCase().replace(/\s+/g, '-')
  return `/images/cars/${slug}.jpg`
}

export function generateOptionImageUrl(optionName: string): string {
  // In a real app, this would generate proper image URLs
  const slug = optionName.toLowerCase().replace(/\s+/g, '-')
  return `/images/options/${slug}.jpg`
}
