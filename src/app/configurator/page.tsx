'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Car, Check, X, BarChart3, Settings, Upload, ShoppingCart, Trash2, User, Info } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useTranslations, useLocale } from 'next-intl'
import type { Option, CarWithOptions, Configuration, RequiredGroup } from '@/types'
import { ExclusiveGroupBadge } from '@/components/ExclusiveGroupIndicator'
import { OptionSelector } from '@/components/OptionSelector'
export default function ConfiguratorPage() {
  const t = useTranslations()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [cars, setCars] = useState<CarWithOptions[]>([])
  const [selectedCar, setSelectedCar] = useState<CarWithOptions | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([])
  const [savedConfigurations, setSavedConfigurations] = useState<Configuration[]>([])
  const [loading, setLoading] = useState(true)
  const [configurationName, setConfigurationName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSavedConfigs, setShowSavedConfigs] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserName, setCurrentUserName] = useState<string>('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [selectedOptionForDetails, setSelectedOptionForDetails] = useState<Option | null>(null)
  const [requiredGroups, setRequiredGroups] = useState<RequiredGroup[]>([])

  const fetchSavedConfigurations = useCallback(async () => {
    if (!currentUserId) return
    try {
      const response = await fetch(`/api/configurations?userId=${currentUserId}`)
      if (!response.ok) {
        console.error('Failed to fetch configurations:', response.status, response.statusText)
        return
      }

      const text = await response.text()
      if (!text.trim()) {
        console.error('Empty response from configurations API')
        return
      }

      const data = JSON.parse(text)
      if (data.success && Array.isArray(data.data)) {
        setSavedConfigurations(data.data)
      }
    } catch (error) {
      console.error('Error fetching saved configurations:', error)
    }
  }, [currentUserId])

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

  const fetchCurrentUser = useCallback(async () => {
    try {
      // Check authentication type - use new secure auth system
      const authToken = localStorage.getItem('carconfig_auth_token')
      const storedUserId = localStorage.getItem('carconfig_user_id')

      if (authToken && storedUserId) {
        // User is authenticated, verify with server
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setCurrentUserId(data.data.id)
              setCurrentUserName(data.data.name)
              return
            }
          }

          // Token invalid, clear auth data and fall through to demo mode
          localStorage.removeItem('carconfig_auth_token')
          localStorage.removeItem('carconfig_user_id')
        } catch (authError) {
          console.error('Auth verification failed:', authError)
          localStorage.removeItem('carconfig_auth_token')
          localStorage.removeItem('carconfig_user_id')
        }
      }

      // Check for existing demo session
      const storedSessionId = localStorage.getItem('carconfig_session_id')

      let response
      if (storedUserId && !authToken) {
        // Try to restore existing demo session
        response = await fetch('/api/user/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: storedUserId,
            sessionId: storedSessionId
          })
        })
      } else {
        // Create new demo user session
        response = await fetch('/api/user/demo')
      }

      const data = await response.json()
      if (data.success) {
        setCurrentUserId(data.data.id)
        setCurrentUserName(data.data.name)

        // Store user session data in localStorage for persistence
        localStorage.setItem('carconfig_user_id', data.data.id)
        if (data.data.sessionId) {
          localStorage.setItem('carconfig_session_id', data.data.sessionId)
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      // Fallback: create new session
      try {
        const response = await fetch('/api/user/demo')
        const data = await response.json()
        if (data.success) {
          setCurrentUserId(data.data.id)
          setCurrentUserName(data.data.name)
          localStorage.setItem('carconfig_user_id', data.data.id)
          if (data.data.sessionId) {
            localStorage.setItem('carconfig_session_id', data.data.sessionId)
          }
        }
      } catch (fallbackError) {
        console.error('Error creating fallback user session:', fallbackError)
      }
    }
  }, [])

  const fetchCars = useCallback(async () => {
    try {
      const response = await fetch(`/api/cars?locale=${locale}`)
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setCars(data.data)

        // Auto-select car if carId parameter is provided
        const carId = searchParams.get('carId')
        if (carId) {
          const preselectedCar = data.data.find((car: CarWithOptions) => car.id === carId)
          if (preselectedCar) {
            setSelectedCar(preselectedCar)
            // Don't set selectedOptions here, let the useEffect handle it after requiredGroups are loaded
          }
        }
      } else {
        console.error('Invalid response format or no cars data')
        setCars([])
      }
    } catch (error) {
      console.error('Error fetching cars:', error)
      setCars([])
    } finally {
      setLoading(false)
    }
  }, [searchParams, locale])

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  useEffect(() => {
    fetchCars()
  }, [fetchCars])

  useEffect(() => {
    fetchRequiredGroups()
  }, [fetchRequiredGroups])

  useEffect(() => {
    if (currentUserId) {
      fetchSavedConfigurations()
    }
  }, [currentUserId, fetchSavedConfigurations])

  // Function to automatically select default options for required groups
  const selectDefaultOptionsForRequiredGroups = useCallback(async (availableOptions: Option[]): Promise<Option[]> => {
    const defaultSelected: Option[] = []

    // Get required groups
    const requiredGroupNames = requiredGroups
      .filter(rg => rg.isRequired)
      .map(rg => rg.exclusiveGroup)

    // For each required group, select the cheapest option
    for (const groupName of requiredGroupNames) {
      const groupOptions = availableOptions.filter(opt => opt.exclusiveGroup === groupName)
      if (groupOptions.length > 0) {
        // Sort by price and select the cheapest one
        const cheapestOption = groupOptions.sort((a, b) => a.price - b.price)[0]
        defaultSelected.push(cheapestOption)
      }
    }

    return defaultSelected
  }, [requiredGroups])

  // Function to calculate minimum price (base price + cheapest required options)
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

  // Refetch cars when locale changes
  useEffect(() => {
    if (locale) {
      fetchCars()
    }
  }, [locale, fetchCars])

  // Auto-select default options for required groups when car and requiredGroups are available
  useEffect(() => {
    if (selectedCar && requiredGroups.length > 0 && selectedOptions.length === 0) {
      const autoSelectDefaults = async () => {
        const defaultOptions = await selectDefaultOptionsForRequiredGroups(
          selectedCar.options.map(co => co.option)
        )
        if (defaultOptions.length > 0) {
          setSelectedOptions(defaultOptions)
        }
      }
      autoSelectDefaults()
    }
  }, [selectedCar, requiredGroups, selectedOptions.length, selectDefaultOptionsForRequiredGroups])

  // Handle Escape key for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedOptionForDetails) {
          setSelectedOptionForDetails(null)
        } else if (deleteConfirm) {
          setDeleteConfirm(null)
        }
      }
    }

    if (selectedOptionForDetails || deleteConfirm) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [selectedOptionForDetails, deleteConfirm])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000) // Auto-hide after 4 seconds
  }

  const loadConfiguration = async (configId: string) => {
    try {
      const response = await fetch(`/api/configurations/${configId}`)
      const data = await response.json()
      if (data.success) {
        const config = data.data
        // Find the car
        const car = cars.find(c => c.id === config.carId)
        if (car) {
          setSelectedCar(car)
          setSelectedOptions(config.options || [])
          setConfigurationName(config.name)
          setShowSavedConfigs(false)
        }
      }
    } catch (error) {
      console.error('Error loading configuration:', error)
      showToast(t('configurator.error_loading_configuration'), 'error')
    }
  }

  const handleCarSelect = async (car: CarWithOptions) => {
    setSelectedCar(car)

    // Auto-select default options for required groups
    const defaultOptions = await selectDefaultOptionsForRequiredGroups(car.options.map(co => co.option))
    setSelectedOptions(defaultOptions)
  }

  const handleOptionToggle = async (option: Option) => {
    setSelectedOptions(prev => {
      const isSelected = prev.some(o => o.id === option.id)

      // Check if this option's group is required
      const groupConfig = requiredGroups.find(rg => rg.exclusiveGroup === option.exclusiveGroup)
      const isGroupRequired = groupConfig?.isRequired || option.isRequired

      if (isSelected) {
        // For required options, don't allow deselection - only switching to another option
        if (isGroupRequired) {
          return prev // Don't change anything, keep the required option selected
        }

        // For non-required options, allow removal
        return prev.filter(o => o.id !== option.id)
      } else {
        // Add option, but first check for conflicts
        let newSelectedOptions = [...prev, option]

        // Remove conflicting options from the same exclusive group
        if (option.exclusiveGroup) {
          newSelectedOptions = newSelectedOptions.filter(opt =>
            opt.id === option.id || opt.exclusiveGroup !== option.exclusiveGroup
          )
        }

        return newSelectedOptions
      }
    })
  }

  const getTotalPrice = () => {
    if (!selectedCar) return 0
    const basePrice = selectedCar.basePrice
    const optionsPrice = selectedOptions.reduce((sum, option) => sum + option.price, 0)
    return basePrice + optionsPrice
  }

  const groupOptionsByCategory = (options: Option[]) => {
    return options.reduce((acc, option) => {
      if (!acc[option.category]) {
        acc[option.category] = []
      }
      acc[option.category].push(option)
      return acc
    }, {} as Record<string, Option[]>)
  }

  // Helper function to group options by exclusive group within a category
  const groupByExclusiveGroup = (options: Option[]) => {
    const exclusiveGroups: Record<string, Option[]> = {}
    const independentOptions: Option[] = []

    options.forEach(option => {
      if (option.exclusiveGroup) {
        if (!exclusiveGroups[option.exclusiveGroup]) {
          exclusiveGroups[option.exclusiveGroup] = []
        }
        exclusiveGroups[option.exclusiveGroup].push(option)
      } else {
        independentOptions.push(option)
      }
    })

    return { exclusiveGroups, independentOptions }
  }

  // Helper to check if an option from the same exclusive group is selected
  const isExclusiveGroupSelected = (exclusiveGroup: string, exceptOptionId?: string) => {
    return selectedOptions.some(selected =>
      selected.exclusiveGroup === exclusiveGroup &&
      selected.id !== exceptOptionId
    )
  }

  const saveConfiguration = async () => {
    if (!selectedCar || !configurationName.trim()) {
      showToast(t('configurator.please_select_car_and_name'), 'error')
      return
    }

    // Check if all required options are selected
    try {
      const response = await fetch('/api/options/validate-required', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedOptionIds: selectedOptions.map(o => o.id),
          carId: selectedCar.id
        })
      })

      const requiredValidation = await response.json()

      if (!response.ok) {
        showToast(t('configurator.validation_error'), 'error')
        return
      }

      if (!requiredValidation.data.isValid) {
        showToast(`${t('configurator.required_options_missing')}${requiredValidation.data.missingRequired.map((o: Option) => o.name).join(', ')}`, 'error')
        return
      }
    } catch (error) {
      console.error('Required options validation error:', error)
      showToast(t('configurator.validation_error'), 'error')
      return
    }

    setSaving(true)
    try {
      const totalPrice = getTotalPrice()
      const payload = {
        name: configurationName,
        carId: selectedCar.id,
        totalPrice: totalPrice,
        userId: currentUserId,
        selectedOptions: selectedOptions.map(o => o.id)
      }

      const response = await fetch('/api/configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (data.success) {
        showToast(t('configurator.configuration_saved_success'), 'success')
        setConfigurationName('')
        // Reload saved configurations to show the new one
        await fetchSavedConfigurations()
        // Optionally show the saved configurations dropdown
        setShowSavedConfigs(true)
      } else {
        showToast(`${t('configurator.error_saving_configuration')}: ${data.error}`, 'error')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      showToast(t('configurator.error_saving_configuration'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteConfiguration = async (configId: string) => {
    try {
      const response = await fetch(`/api/configurations/${configId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        // Remove from local state
        setSavedConfigurations(prev => prev.filter(config => config.id !== configId))
        showToast(t('configurator.configuration_deleted_success'), 'success')
      } else {
        showToast(`${t('configurator.error_deleting_configuration')}: ${data.error}`, 'error')
      }
    } catch (error) {
      console.error('Error deleting configuration:', error)
      showToast(t('configurator.error_deleting_configuration'), 'error')
    } finally {
      setDeleteConfirm(null)
    }
  }



  const isAuthenticated = () => {
    return localStorage.getItem('carconfig_auth_type') === 'authenticated'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-lg">{t('configurator.loading_cars')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-background" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Saved Configurations Button */}
        {currentUserName && (
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{currentUserName}</span>
                {isAuthenticated() && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                    {t('auth.authenticated')}
                  </span>
                )}
              </div>
              {selectedCar && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('configurator.total_price')}</p>
                  <div className="text-xl font-bold text-foreground" data-testid="header-total-price">
                    {formatPrice(getTotalPrice())}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowSavedConfigs(!showSavedConfigs)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 border border-border rounded-lg transition-colors"
              data-testid="saved-configurations-toggle"
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('configurator.saved_configurations')}
            </button>
          </div>
        )}

        {/* Saved Configurations Dropdown */}
        {showSavedConfigs && (
          <div className="mb-8 bg-card rounded-2xl shadow-lg border border-border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-card-foreground">{t('configurator.saved_configurations')}</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  {t('configurator.user_label')} {currentUserName}
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('carconfig_user_id')
                    localStorage.removeItem('carconfig_session_id')
                    window.location.reload()
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title={t('configurator.start_new_user_session')}
                >
                  {t('configurator.new_session')}
                </button>
              </div>
            </div>
            {savedConfigurations.length === 0 ? (
              <p className="text-muted-foreground">{t('configurator.no_saved_configurations')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedConfigurations.map((config) => (
                  <div
                    key={config.id}
                    className="p-4 bg-background rounded-lg border border-border hover:border-primary transition-colors relative group"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => loadConfiguration(config.id)}
                      data-testid={`saved-config-${config.id}`}
                    >
                      <h4 className="font-semibold text-foreground pr-8">{config.name}</h4>
                      <p className="text-sm text-muted-foreground">{config.car?.name}</p>
                      <p className="text-sm font-medium text-foreground">{formatPrice(config.totalPrice)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(config.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(config.id)
                      }}
                      className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('configurator.delete_configuration')}
                      data-testid={`delete-config-${config.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
            data-testid="delete-confirmation-dialog"
            onClick={() => setDeleteConfirm(null)}
          >
            <div
              className="bg-card p-6 rounded-lg shadow-2xl border border-border max-w-md w-full mx-4"
              data-testid="dialog-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-card-foreground" data-testid="dialog-title">{t('configurator.delete_configuration_title')}</h3>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                  data-testid="dialog-close-button"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-muted-foreground mb-6" data-testid="dialog-message">
                {t('configurator.delete_configuration_message')}
              </p>
              <div className="flex justify-end space-x-4" data-testid="dialog-actions">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="cancel-delete-button"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => deleteConfiguration(deleteConfirm)}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                  data-testid="confirm-delete-button"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedCar ? (
          // Car Selection
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">{t('configurator.choose_vehicle')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('configurator.choose_vehicle_subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cars.map((car) => (
                <div
                  key={car.id}
                  className="group relative bg-card rounded-2xl overflow-hidden shadow-lg border border-border card-hover cursor-pointer"
                  onClick={() => handleCarSelect(car)}
                  data-testid={`car-card-${car.name.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={car.imageUrl || '/images/cars/default.svg'}
                      alt={car.name}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      data-testid="car-image"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-background/90 text-foreground backdrop-blur" data-testid="car-category">
                        {car.category}
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/90 text-primary-foreground backdrop-blur" data-testid="configure-label">
                        {locale === 'en' ? 'Configure →' : 'Konfigurieren →'}
                      </span>
                    </div>
                  </div>
                  <div className="relative p-6">
                    <h3 className="text-xl font-semibold text-card-foreground mb-2" data-testid="car-title">{car.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4" data-testid="car-description">{car.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground" data-testid="car-category-text">{car.category}</span>
                      <span className="text-xl font-bold text-foreground" data-testid="car-price">
                        {locale === 'en' ? 'from' : 'ab'} {formatPrice(calculateMinimumPrice(car))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Configuration View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Car Info & Options */}
            <div className="lg:col-span-2 space-y-8">
              {/* Selected Car */}
              <div className="relative bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
                <div className="relative p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-card-foreground mb-2">{selectedCar.name}</h2>
                      <p className="text-muted-foreground text-lg">{selectedCar.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCar(null)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                      data-testid="car-back-button"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="h-80 bg-muted rounded-xl overflow-hidden relative mb-6">
                    <Image
                      src={selectedCar.imageUrl || '/images/cars/default.svg'}
                      alt={selectedCar.name}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-xl">
                    <span className="text-lg font-medium text-secondary-foreground">Basispreis:</span>
                    <span className="text-2xl font-bold text-foreground" data-testid="car-base-price">
                      {formatPrice(selectedCar.basePrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
                <h3 className="text-2xl font-bold text-card-foreground mb-6 flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                  {t('configurator.additional_equipment')}
                </h3>
                {Object.entries(groupOptionsByCategory(selectedCar.options.map(co => co.option))).map(([category, options]) => {
                  const { exclusiveGroups, independentOptions } = groupByExclusiveGroup(options)

                  return (
                    <div key={category} className="mb-8">
                      <h4 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
                        <span className="w-2 h-2 bg-primary rounded-full mr-3" />
                        {category}
                      </h4>

                      <div className="space-y-6">
                        {/* Render exclusive groups */}
                        {Object.entries(exclusiveGroups).map(([groupName, groupOptions]) => {
                          return (
                            <div key={groupName}>
                              <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-4">
                                {groupOptions.map((option) => {
                                  const isSelected = selectedOptions.some(o => o.id === option.id)
                                  const groupHasSelection = isExclusiveGroupSelected(groupName, option.id)

                                  return (
                                    <div
                                      key={option.id}
                                      className={`option-card group relative border-2 rounded-xl p-3 sm:p-4 transition-all duration-300 ${
                                        isSelected
                                          ? 'border-primary bg-primary/5 shadow-md'
                                          : groupHasSelection
                                          ? 'border-border/50 bg-muted/20 opacity-60'
                                          : 'border-border hover:border-primary/50 hover:bg-accent/30'
                                      }`}
                                    >
                                      <div className="option-content">
                                        <div className="option-left-content">
                                          <OptionSelector
                                            option={option}
                                            isSelected={isSelected}
                                            exclusiveGroupSelected={groupHasSelection}
                                            onToggle={handleOptionToggle}
                                            requiredGroups={requiredGroups}
                                          />
                                          {option.imageUrl && (
                                            <div className="flex-shrink-0">
                                              <Image
                                                src={option.imageUrl}
                                                alt={option.name}
                                                width={64}
                                                height={64}
                                                className="w-12 h-12 sm:w-12 sm:h-12 object-cover rounded-lg border border-border flex-shrink-0"
                                              />
                                            </div>
                                          )}
                                          <div
                                            className="option-text-content cursor-pointer"
                                            onClick={() => handleOptionToggle(option)}
                                          >
                                            <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                              <h5 className="font-semibold text-card-foreground text-sm sm:text-base truncate">{option.name}</h5>
                                              {option.exclusiveGroup && groupOptions.length > 2 && (
                                                <ExclusiveGroupBadge exclusiveGroup={option.exclusiveGroup} />
                                              )}
                                            </div>
                                            {option.description && (
                                              <p className="text-muted-foreground text-xs sm:text-sm mt-1 line-clamp-2">{option.description}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="option-right-content">
                                          <div className="flex flex-col items-end space-y-2">
                                            <span className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">
                                              +{formatPrice(option.price)}
                                            </span>
                                            {option.detailedDescription && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setSelectedOptionForDetails(option)
                                                }}
                                                className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-all duration-200 hover:scale-105"
                                                title={t('configurator.option_details_button_title')}
                                                data-testid="details-button"
                                              >
                                                <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                {t('configurator.option_details_button')}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}

                        {/* Render independent options */}
                        {independentOptions.length > 0 && (
                          <div>
                            {Object.keys(exclusiveGroups).length > 0 && (
                              <div className="text-sm font-medium text-muted-foreground mb-3 border-t pt-4">
                                {t('configurator.multiple_selectable_options')}
                              </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-4">
                              {independentOptions.map((option) => {
                                const isSelected = selectedOptions.some(o => o.id === option.id)
                                return (
                                  <div
                                    key={option.id}
                                    className={`option-card group relative border-2 rounded-xl p-3 sm:p-4 transition-all duration-300 ${
                                      isSelected
                                        ? 'border-primary bg-primary/5 shadow-md'
                                        : 'border-border hover:border-primary/50 hover:bg-accent/30'
                                    }`}
                                  >
                                    <div className="option-content">
                                      <div className="option-left-content">
                                        <OptionSelector
                                          option={option}
                                          isSelected={isSelected}
                                          exclusiveGroupSelected={false}
                                          onToggle={handleOptionToggle}
                                          requiredGroups={requiredGroups}
                                        />
                                        {option.imageUrl && (
                                          <div className="flex-shrink-0">
                                            <Image
                                              src={option.imageUrl}
                                              alt={option.name}
                                              width={64}
                                              height={64}
                                              className="w-12 h-12 sm:w-12 sm:h-12 object-cover rounded-lg border border-border flex-shrink-0"
                                            />
                                          </div>
                                        )}
                                        <div
                                          className="option-text-content cursor-pointer"
                                          onClick={() => handleOptionToggle(option)}
                                        >
                                          <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                            <h5 className="font-semibold text-card-foreground text-sm sm:text-base truncate">{option.name}</h5>
                                          </div>
                                          {option.description && (
                                            <p className="text-muted-foreground text-xs sm:text-sm mt-1 line-clamp-2">{option.description}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="option-right-content">
                                        <div className="flex flex-col items-end space-y-2">
                                          <span className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">
                                            +{formatPrice(option.price)}
                                          </span>
                                          {option.detailedDescription && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedOptionForDetails(option)
                                              }}
                                              className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-all duration-200 hover:scale-105"
                                              title={t('configurator.option_details_button_title')}
                                              data-testid="details-button"
                                            >
                                              <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                              {t('configurator.option_details_button')}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column: Summary & Save */}
            <div className="space-y-8">
              {/* Price Summary */}
              <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
                <h3 className="text-xl font-bold text-card-foreground mb-6 flex items-center">
                  <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                  </div>
                  {t('configurator.price_calculation')}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                    <span className="text-muted-foreground">{t('configurator.base_price')}:</span>
                    <span className="font-semibold text-lg" data-testid="summary-base-price">
                      {formatPrice(selectedCar.basePrice)}
                    </span>
                  </div>
                  {selectedOptions.map((option) => (
                    <div key={option.id} className="flex justify-between items-center p-2 text-sm">
                      <div className="flex items-center space-x-2">
                        {option.imageUrl && (
                          <Image
                            src={option.imageUrl}
                            alt={option.name}
                            width={24}
                            height={24}
                            className="w-6 h-6 object-cover rounded border border-border"
                          />
                        )}
                        <span className="text-muted-foreground">{option.name}:</span>
                      </div>
                      <span className="font-medium">+{formatPrice(option.price)}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl">
                      <span className="text-xl font-bold text-card-foreground">{t('configurator.total_price')}:</span>
                      <span className="text-2xl font-bold text-foreground" data-testid="total-price">
                        {formatPrice(getTotalPrice())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Configuration */}
              <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
                <h3 className="text-xl font-bold text-card-foreground mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
                    <Settings className="h-4 w-4 text-blue-500" />
                  </div>
                  {t('configurator.save_configuration')}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground">{t('configurator.configuration_name_placeholder')}</label>
                    <input
                      type="text"
                      placeholder={t('configurator.configuration_name_input_placeholder')}
                      value={configurationName}
                      onChange={(e) => setConfigurationName(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors text-foreground placeholder:text-muted-foreground"
                      data-testid="configuration-name-input"
                    />
                  </div>
                  <button
                    onClick={saveConfiguration}
                    disabled={saving || !configurationName.trim()}
                    className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all duration-300 btn-hover shadow-lg hover:shadow-xl"
                    data-testid="save-configuration-button"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        {t('configurator.saving')}
                      </span>
                    ) : (
                      t('configurator.save_configuration')
                    )}
                  </button>
                </div>
              </div>

              {/* Purchase Actions */}
              <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
                <h3 className="text-xl font-bold text-card-foreground mb-6 flex items-center">
                  <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingCart className="h-4 w-4 text-green-500" />
                  </div>
                  {t('configurator.purchase_actions')}
                </h3>
                <div className="space-y-4">
                  <button
                    onClick={async () => {
                      try {
                        // Create checkout session
                        const response = await fetch('/api/checkout/session', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            carId: selectedCar.id,
                            selectedOptions: selectedOptions.map(o => o.id),
                            configurationName: configurationName || `${selectedCar.name} ${t('configurator.title')}`,
                            userId: currentUserId
                          })
                        })

                        const data = await response.json()
                        if (data.success) {
                          // Redirect to checkout with session ID
                          router.push(`/checkout?sessionId=${data.data.sessionId}`)
                        } else {
                          showToast(`Error creating checkout session: ${data.error}`, 'error')
                        }
                      } catch (error) {
                        console.error('Error creating checkout session:', error)
                        showToast('Error creating checkout session', 'error')
                      }
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 btn-hover shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {t('configurator.buy_now')} - {formatPrice(getTotalPrice())}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t('configurator.secure_checkout')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Option Details Modal */}
      {selectedOptionForDetails && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          data-testid="option-details-modal"
          onClick={() => setSelectedOptionForDetails(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            data-testid="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border p-6 rounded-t-2xl" data-testid="modal-header">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  {selectedOptionForDetails.imageUrl && (
                    <div className="flex-shrink-0">
                      <Image
                        src={selectedOptionForDetails.imageUrl}
                        alt={selectedOptionForDetails.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-xl border border-border"
                        data-testid="option-image"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-card-foreground mb-2" data-testid="option-title">
                      {selectedOptionForDetails.name}
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary" data-testid="option-category">
                        {selectedOptionForDetails.category}
                      </span>
                      <span className="text-2xl font-bold text-foreground" data-testid="option-price">
                        +{formatPrice(selectedOptionForDetails.price)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOptionForDetails(null)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
                  data-testid="modal-close-button"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6" data-testid="modal-body">
              {/* Short Description */}
              {selectedOptionForDetails.description && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-card-foreground mb-2" data-testid="description-title">{t('configurator.option_details_overview')}</h4>
                  <p className="text-muted-foreground leading-relaxed" data-testid="description-text">
                    {selectedOptionForDetails.description}
                  </p>
                </div>
              )}

              {/* Detailed Description */}
              {selectedOptionForDetails.detailedDescription && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-card-foreground mb-2" data-testid="detailed-description-title">{t('configurator.option_details_detailed_description')}</h4>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line" data-testid="detailed-description-text">
                      {selectedOptionForDetails.detailedDescription}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-border" data-testid="modal-actions">
                <button
                  onClick={() => setSelectedOptionForDetails(null)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="close-button"
                >
                  {t('configurator.option_details_close')}
                </button>
                <button
                  onClick={() => {
                    handleOptionToggle(selectedOptionForDetails)
                    setSelectedOptionForDetails(null)
                  }}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    selectedOptions.some(o => o.id === selectedOptionForDetails.id)
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                  data-testid="toggle-option-button"
                >
                  {selectedOptions.some(o => o.id === selectedOptionForDetails.id)
                    ? t('configurator.option_details_remove')
                    : t('configurator.option_details_add')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300" data-testid="toast-notification">
          <div className={`
            p-4 rounded-lg shadow-lg border max-w-md
            ${toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }
          `} data-testid="toast-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {toast.type === 'success' ? (
                  <Check className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" data-testid="toast-success-icon" />
                ) : (
                  <X className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" data-testid="toast-error-icon" />
                )}
                <span className="font-medium" data-testid="toast-message">{toast.message}</span>
              </div>
              <button
                onClick={() => setToast(null)}
                className="ml-4 text-current hover:opacity-75 transition-opacity"
                data-testid="toast-close-button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
