'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Car, Settings, BarChart3, Sparkles } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useTranslations, useLocale } from 'next-intl'
import type { CarWithOptions, RequiredGroup } from '@/types'

export default function Home() {
  const t = useTranslations()
  const locale = useLocale()
  const [cars, setCars] = useState<CarWithOptions[]>([])
  const [requiredGroups, setRequiredGroups] = useState<RequiredGroup[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequiredGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/required-groups')
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setRequiredGroups(data.data)
      }
    } catch (error) {
      console.error('Error fetching required groups:', error)
    }
  }, [])

  const calculateMinimumPrice = useCallback((car: CarWithOptions): number => {
    const basePrice = car.basePrice

    // If requiredGroups are not loaded yet, fallback to base price
    if (requiredGroups.length === 0) {
      return basePrice
    }

    let requiredOptionsPrice = 0

    // Get required groups
    const requiredGroupNames = requiredGroups
      .filter(rg => rg.isRequired)
      .map(rg => rg.exclusiveGroup)

    // Calculate price of cheapest option for each required group
    for (const groupName of requiredGroupNames) {
      const groupOptions = car.options
        .map(co => co.option)
        .filter(opt => opt.exclusiveGroup === groupName)

      if (groupOptions.length > 0) {
        // Add the price of the cheapest option in this group
        const cheapestPrice = Math.min(...groupOptions.map(opt => opt.price))
        requiredOptionsPrice += cheapestPrice
      }
    }

    return basePrice + requiredOptionsPrice
  }, [requiredGroups])

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await fetch(`/api/cars?locale=${locale}`)
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          const uniqueCars = data.data.reduce((acc: CarWithOptions[], car: CarWithOptions) => {
            if (!acc.find(c => c.name === car.name)) {
              acc.push(car)
            }
            return acc
          }, [])
          setCars(uniqueCars.slice(0, 3))
        }
      } catch (error) {
        console.error('Error fetching cars:', error)
        setCars([
          {
            id: 'fallback-1',
            name: 'Luxury X5 SUV',
            category: 'SUV',
            basePrice: 45000,
            description: 'Premium-SUV mit sportlichem Design',
            imageUrl: '/images/cars/luxury-x5.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
            options: []
          },
          {
            id: 'fallback-2',
            name: 'Elegance Sedan',
            category: 'Sedan',
            basePrice: 35000,
            description: 'Elegante Business-Limousine',
            imageUrl: '/images/cars/elegance-sedan.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
            options: []
          },
          {
            id: 'fallback-3',
            name: 'Prestige Coupe',
            category: 'Coupe',
            basePrice: 40000,
            description: 'Luxuriöse Mittelklasse-Limousine',
            imageUrl: '/images/cars/prestige-coupe.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
            options: []
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchCars()
  }, [locale])

  // Fetch required groups on component mount
  useEffect(() => {
    fetchRequiredGroups()
  }, [fetchRequiredGroups])

  return (
    <div className="bg-background">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-background" />
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center">
          <div className="mb-6 sm:mb-8">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="mr-1 h-3 w-3" />
              {locale === 'en' ? 'New: AI-powered Configuration' : 'Neu: KI-powered Konfiguration'}
            </span>
          </div>
          <h2 className="text-3xl font-extrabold sm:text-4xl md:text-5xl lg:text-6xl" data-testid="hero-title">
            <span className="block text-foreground">{t('home.hero_title')}</span>
            <span className="block text-primary font-bold">
              {locale === 'en' ? 'Awaits' : 'wartet auf Sie'}
            </span>
          </h2>
          <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground px-4">
            {t('home.hero_subtitle')}
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link
              href="/configurator"
              className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl min-h-[48px]"
              data-testid="get-started-button"
            >
              <Car className="mr-2 h-5 w-5" />
              {t('home.start_configuration')}
            </Link>
            <Link
              href="#cars"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-lg text-foreground bg-secondary hover:bg-secondary/80 transition-all duration-300 min-h-[48px]"
              data-testid="learn-more-button"
            >
              {t('home.learn_more')}
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 sm:mt-20 lg:mt-24">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{t('home.features.title')}</h3>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground px-4">
              {t('home.features.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group relative bg-card rounded-2xl p-6 sm:p-8 shadow-lg border border-border card-hover">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4 sm:mb-6">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-2 sm:mb-3">{t('home.features.feature1.title')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('home.features.feature1.description')}
                </p>
              </div>
            </div>

            <div className="group relative bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-xl mb-6">
                  <Settings className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3">{t('home.features.feature2.title')}</h3>
                <p className="text-muted-foreground">
                  {t('home.features.feature2.description')}
                </p>
              </div>
            </div>

            <div className="group relative bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-center w-12 h-12 bg-pink-500/10 rounded-xl mb-6">
                  <BarChart3 className="h-6 w-6 text-pink-500" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3">{t('home.features.feature3.title')}</h3>
                <p className="text-muted-foreground">
                  {t('home.features.feature3.description')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Car Preview Section */}
        <div id="cars" className="mt-16 sm:mt-20 lg:mt-24">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              {locale === 'en' ? 'Our Vehicles' : 'Unsere Fahrzeuge'}
            </h3>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground px-4">
              {locale === 'en' ? 'Discover our exclusive vehicle selection' : 'Entdecken Sie unsere exklusive Fahrzeugauswahl'}
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : cars.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {cars.map((car, index) => (
                <div key={car.id} className="group relative bg-card rounded-2xl overflow-hidden shadow-lg border border-border card-hover">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
                    <Image
                      src={car.imageUrl || '/images/cars/default.svg'}
                      alt={car.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      priority={index === 0}
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-background/90 text-foreground backdrop-blur">
                        {car.category}
                      </span>
                    </div>
                  </div>
                  <div className="relative p-4 sm:p-6">
                    <h4 className="text-lg sm:text-xl font-semibold text-card-foreground mb-2">{car.name}</h4>
                    <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{car.description}</p>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <span className="text-xl sm:text-2xl font-bold text-foreground">
                        {locale === 'en' ? 'from' : 'ab'} {formatPrice(calculateMinimumPrice(car))}
                      </span>
                      <Link
                        href={`/configurator?carId=${car.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors duration-200 min-h-[40px]"
                      >
                        {locale === 'en' ? 'Configure →' : 'Konfigurieren →'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-card rounded-2xl p-8 sm:p-12 border border-border">
                <Car className="mx-auto h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-muted-foreground text-base sm:text-lg">
                  {t('configurator.no_cars_available')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
