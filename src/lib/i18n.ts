import { cookies } from 'next/headers'

export type Locale = 'de' | 'en'

export const locales: Locale[] = ['de', 'en']
export const defaultLocale: Locale = 'de'

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value as Locale
  return locale && locales.includes(locale) ? locale : defaultLocale
}

export function getLocalizedContent<T extends Record<string, unknown>>(
  content: T,
  translations: Record<string, T>,
  locale: Locale
): T {
  const translation = translations[locale]
  if (!translation) {
    return content
  }

  // Merge default content with translation
  return {
    ...content,
    ...translation
  }
}

export interface TranslatableContent {
  name: string
  category: string
  description: string
}

export interface CarWithTranslations {
  id: string
  name: string
  category: string
  basePrice: number
  description: string
  imageUrl: string
  translations?: Array<{
    locale: string
    name: string
    category: string
    description: string
  }>
}

export interface OptionWithTranslations {
  id: string
  name: string
  category: string
  price: number
  description?: string
  imageUrl?: string
  translations?: Array<{
    locale: string
    name: string
    category: string
    description?: string
  }>
}

export function getTranslatedCar(car: CarWithTranslations, locale: Locale): CarWithTranslations {
  const translation = car.translations?.find(t => t.locale === locale)

  if (!translation) {
    return car
  }

  return {
    ...car,
    name: translation.name,
    category: translation.category,
    description: translation.description
  }
}

export function getTranslatedOption(option: OptionWithTranslations, locale: Locale): OptionWithTranslations {
  const translation = option.translations?.find(t => t.locale === locale)

  if (!translation) {
    return option
  }

  return {
    ...option,
    name: translation.name,
    category: translation.category,
    description: translation.description || option.description
  }
}
