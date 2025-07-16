import { vi } from 'vitest'
import React from 'react'

// German translations for testing
const translations = {
  'home.hero_title': 'Konfigurieren Sie Ihr',
  'home.hero_subtitle': 'Entdecken Sie unsere Premium-Fahrzeuge und gestalten Sie Ihren Traumwagen. Von der Lackierung bis zur Ausstattung - alles nach Ihren Wünschen.',
  'home.start_configuration': 'Konfigurator starten',
  'home.learn_more': 'Mehr erfahren',
  'home.features.title': 'Warum CarConfigurator?',
  'home.features.subtitle': 'Entdecken Sie die Vorteile unserer Plattform',
  'home.features.feature1.title': 'Premium Fahrzeuge',
  'home.features.feature1.description': 'Exklusive Auswahl hochwertiger Fahrzeuge',
  'home.features.feature2.title': 'Individuelle Konfiguration',
  'home.features.feature2.description': 'Gestalten Sie Ihr Fahrzeug nach Ihren Wünschen',
  'home.features.feature3.title': 'Transparente Preise',
  'home.features.feature3.description': 'Faire und nachvollziehbare Preisgestaltung',
  'common.brand': 'CarConfigurator',
  'common.copyright': '© 2025 CarConfigurator',
  'common.footer.description': 'Erstellt für die Demonstration',
  'navigation.home': 'Home',
  'navigation.configurator': 'Konfigurator',
  'navigation.admin': 'Admin',
  'configurator.loading_cars': 'Lade Fahrzeuge...',
  'configurator.no_cars': 'Keine Fahrzeuge verfügbar',
  'configurator.select_car': 'Fahrzeug auswählen',
  'configurator.additional_equipment': 'Zusatzausstattung',
  'configurator.options': 'Optionen',
  'configurator.configuration_summary': 'Konfigurationszusammenfassung',
  'configurator.base_price': 'Basispreis',
  'configurator.total_price': 'Gesamtpreis',
  'configurator.save_configuration': 'Konfiguration speichern',
  'configurator.configuration_saved': 'Konfiguration gespeichert!',
  'configurator.configuration_saved_success': 'Konfiguration erfolgreich gespeichert!',
  'configurator.error_saving_configuration': 'Fehler beim Speichern der Konfiguration',
  'configurator.saved_configurations': 'Gespeicherte Konfigurationen',
  'configurator.no_saved_configurations': 'Keine gespeicherten Konfigurationen vorhanden',
  'configurator.user_label': 'Benutzer:',
  'configurator.new_session': 'Neue Sitzung',
  'configurator.start_new_user_session': 'Neue Benutzersitzung starten'
}

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key as keyof typeof translations] || key,
  useLocale: () => 'de',
  useMessages: () => translations,
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: () => (key: string) => translations[key as keyof typeof translations] || key,
  getLocale: () => 'de',
  getMessages: () => translations,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    toString: vi.fn(),
  }),
  usePathname: () => '/test',
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Mock NextIntlClientProvider for component tests
export const IntlTestProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'intl-provider' }, children)
}
