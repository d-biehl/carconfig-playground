'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Car, LogOut, Settings, BarChart3, Users, Plus, Edit, Trash2, Upload, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { resizeImage, validateImageFile, getImageDisplaySrc } from '@/lib/imageUtils'
import { logger } from '@/lib/logger'
import type { UserWithStats } from '@/types'

// Auth check component
function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authToken = localStorage.getItem('carconfig_auth_token')

        if (authToken) {
          // Verify token with server
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          })

          if (response.ok) {
            const data = await response.json()

            if (data.success && data.data.role === 'admin') {
              // Success: No logging needed for normal admin access
              setIsAuthenticated(true)
            } else {
              logger.security('Non-admin user attempted admin access', { component: 'admin', userId: data.data?.id || '' })
              // Clear invalid auth data
              localStorage.removeItem('carconfig_auth_token')
              localStorage.removeItem('carconfig_user_id')
              router.replace('/admin/login')
            }
          } else {
            logger.security('Invalid admin token, redirecting to login')
            // Clear invalid auth data
            localStorage.removeItem('carconfig_auth_token')
            localStorage.removeItem('carconfig_user_id')
            router.replace('/admin/login')
          }
        } else {
          // No token: redirect without logging (normal case)
          router.replace('/admin/login')
        }
      } catch (error) {
        logger.security('Admin auth check error', { component: 'admin' }, error as Error)
        // Clear auth data on error
        localStorage.removeItem('carconfig_auth_token')
        localStorage.removeItem('carconfig_user_id')
        router.replace('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

interface Car {
  id: string
  name: string
  category: string
  basePrice: number
  description: string
  imageUrl: string
  imageData?: string
  imageMimeType?: string
  translations?: {
    id: string
    carId: string
    locale: string
    name: string
    category: string
    description: string
  }[]
}

interface Option {
  id: string
  name: string
  category: string
  price: number
  description: string
  detailedDescription?: string
  imageUrl?: string
  imageData?: string
  imageMimeType?: string
  exclusiveGroup?: string
  isRequired?: boolean
  translations?: {
    id: string
    optionId: string
    locale: string
    name: string
    category: string
    description?: string
    detailedDescription?: string
  }[]
}

interface CarFormData {
  name: string
  category: string
  basePrice: string
  description: string
  imageUrl: string
  imageData?: string
  imageMimeType?: string
  translations?: {
    locale: string
    name: string
    category: string
    description: string
  }[]
}

interface OptionFormData {
  name: string
  category: string
  price: string
  description: string
  detailedDescription?: string
  imageUrl: string
  imageData?: string
  imageMimeType?: string
  exclusiveGroup?: string
  isRequired?: boolean
  translations?: {
    locale: string
    name: string
    category: string
    description?: string
    detailedDescription?: string
  }[]
}

interface Configuration {
  id: string
  name: string
  userId: string
  carId: string
  selectedOptions: string[]
  totalPrice: number
  createdAt: string
  user?: {
    name: string
    email: string
  }
  car?: {
    name: string
  }
}

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminPageContent />
    </AdminAuthGuard>
  )
}

function AdminPageContent() {
  const t = useTranslations()
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [options, setOptions] = useState<Option[] | Record<string, Option[]>>([])
  const [configurations, setConfigurations] = useState<Configuration[]>([])
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [authChecking, setAuthChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [activeTab, setActiveTab] = useState('cars')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'add' | 'edit'>('add')
  const [modalEntity, setModalEntity] = useState<'car' | 'option'>('car')
  const [selectedItem, setSelectedItem] = useState<Car | Option | null>(null)
  const [formData, setFormData] = useState<CarFormData | OptionFormData>({
    name: '',
    category: '',
    basePrice: '', // only for cars
    price: '', // only for options
    description: '',
    imageUrl: '',
    translations: [
      { locale: 'de', name: '', category: '', description: '' },
      { locale: 'en', name: '', category: '', description: '' }
    ]
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [cleaningUp, setCleaningUp] = useState(false)
  const [showTranslations, setShowTranslations] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check authentication - Skip since AdminAuthGuard already handles this
  useEffect(() => {
    // Authentication is already handled by AdminAuthGuard
    setIsAuthenticated(true)
    setAuthChecking(false)
  }, [router])

  // Fetch data
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchData = async () => {
      try {
        // Get auth token for API calls
        const authToken = localStorage.getItem('carconfig_auth_token')
        const headers: Record<string, string> = {}
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`
        }

        // Fetch each endpoint individually to identify which one is failing
        const carsRes = await fetch('/api/admin/cars', { headers })
        const optionsRes = await fetch('/api/admin/options', { headers })
        const configurationsRes = await fetch('/api/configurations', { headers })
        const usersRes = await fetch('/api/admin/users', { headers })

        // Process each response individually with error checking
        if (carsRes.ok) {
          try {
            const carsData = await carsRes.json()
            if (carsData.success) setCars(carsData.data || [])
          } catch (error) {
            console.error('Error parsing cars JSON:', error)
          }
        } else {
          console.error('Cars API failed with status:', carsRes.status)
        }

        if (optionsRes.ok) {
          try {
            const optionsData = await optionsRes.json()
            if (optionsData.success) setOptions(optionsData.data || [])
          } catch (error) {
            console.error('Error parsing options JSON:', error)
          }
        } else {
          console.error('Options API failed with status:', optionsRes.status)
        }

        if (configurationsRes.ok) {
          try {
            const configurationsData = await configurationsRes.json()
            if (configurationsData.success) setConfigurations(configurationsData.data || [])
          } catch (error) {
            console.error('Error parsing configurations JSON:', error)
          }
        } else {
          console.error('Configurations API failed with status:', configurationsRes.status)
        }

        if (usersRes.ok) {
          try {
            const usersData = await usersRes.json()
            if (usersData.success) setUsers(usersData.data || [])
          } catch (error) {
            console.error('Error parsing users JSON:', error)
          }
        } else {
          console.error('Users API failed with status:', usersRes.status)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [isAuthenticated])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      // Clear authentication data
      localStorage.removeItem('carconfig_auth_token')
      localStorage.removeItem('carconfig_user_id')

      // Also clear any legacy data
      localStorage.removeItem('user')
      localStorage.removeItem('carconfig_auth_type')
      localStorage.removeItem('carconfig_user_name')
      localStorage.removeItem('carconfig_user_email')
      localStorage.removeItem('carconfig_session_id')

      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  const handleCleanupDemoData = async () => {
    const confirmed = confirm(
      'Sind Sie sicher, dass Sie alle Demo-Benutzer und deren Konfigurationen löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.'
    )

    if (!confirmed) return

    setCleaningUp(true)
    try {
      // Get current locale from cookie or localStorage
      const currentLocale = localStorage.getItem('locale') || 'de'

      const response = await fetch('/api/admin/cleanup', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': currentLocale, // Send current locale to backend
          'X-Locale': currentLocale, // Custom header for explicit locale
          'Authorization': `Bearer ${localStorage.getItem('carconfig_auth_token')}`
        }
      })
      const data = await response.json()

      if (data.success) {
        // Use server response message which is already localized
        alert(data.data.message)
        // Refresh the data
        window.location.reload()
      } else {
        alert(`Fehler beim Löschen: ${data.error}`)
      }
    } catch (error) {
      console.error('Error cleaning up demo data:', error)
      alert('Fehler beim Löschen der Demo-Daten')
    } finally {
      setCleaningUp(false)
    }
  }

  // Image Upload Functions
  const handleImageUpload = async (file: File) => {
    if (!validateImageFile(file)) return

    setUploadingImage(true)
    try {
      const resizedImage = await resizeImage(file)
      setImagePreview(resizedImage)
      setFormData({
        ...formData,
        imageData: resizedImage,
        imageMimeType: file.type,
        imageUrl: '' // Clear URL if uploading new image
      })
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Fehler beim Verarbeiten des Bildes')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageRemove = () => {
    setImagePreview(null)
    setFormData({
      ...formData,
      imageData: undefined,
      imageMimeType: undefined
      // imageUrl bleibt erhalten, damit Benutzer zwischen Upload und URL wechseln können
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Helper functions for translations
  const updateTranslation = (locale: string, field: string, value: string) => {
    const currentData = formData as CarFormData | OptionFormData
    const newTranslations = [...(currentData.translations || [])]
    const translationIndex = newTranslations.findIndex(t => t.locale === locale)

    if (translationIndex >= 0) {
      newTranslations[translationIndex] = { ...newTranslations[translationIndex], [field]: value }
    } else {
      if (modalEntity === 'option') {
        const newTranslation = {
          locale,
          name: field === 'name' ? value : '',
          category: field === 'category' ? value : '',
          description: field === 'description' ? value : '',
          detailedDescription: field === 'detailedDescription' ? value : ''
        }
        newTranslations.push(newTranslation)
      } else {
        const newTranslation = {
          locale,
          name: field === 'name' ? value : '',
          category: field === 'category' ? value : '',
          description: field === 'description' ? value : ''
        }
        newTranslations.push(newTranslation)
      }
    }

    setFormData({ ...formData, translations: newTranslations } as CarFormData | OptionFormData)
  }

  const getTranslationValue = (locale: string, field: string): string => {
    const currentData = formData as CarFormData | OptionFormData
    const translation = currentData.translations?.find(t => t.locale === locale)
    return (translation as Record<string, string>)?.[field] || ''
  }

  // CRUD Functions
  const handleAddCar = () => {
    setModalType('add')
    setModalEntity('car')
    setSelectedItem(null)
    setImagePreview(null)
    setFormData({
      name: '',
      category: '',
      basePrice: '',
      description: '',
      imageUrl: '',
      translations: [
        { locale: 'de', name: '', category: '', description: '' },
        { locale: 'en', name: '', category: '', description: '' }
      ]
    })
    setShowModal(true)
  }

  const handleEditCar = (car: Car) => {
    setModalType('edit')
    setModalEntity('car')
    setSelectedItem(car)
    setImagePreview(getImageDisplaySrc(car))

    // Initialize translations with existing data or defaults
    const deTranslation = car.translations?.find(t => t.locale === 'de') || { locale: 'de', name: '', category: '', description: '' }
    const enTranslation = car.translations?.find(t => t.locale === 'en') || { locale: 'en', name: '', category: '', description: '' }

    setFormData({
      name: car.name,
      category: car.category,
      basePrice: car.basePrice.toString(),
      description: car.description,
      imageUrl: car.imageUrl || '',
      imageData: car.imageData,
      imageMimeType: car.imageMimeType,
      translations: [
        {
          locale: 'de',
          name: deTranslation.name || car.name,
          category: deTranslation.category || car.category,
          description: deTranslation.description || car.description
        },
        {
          locale: 'en',
          name: enTranslation.name || car.name,
          category: enTranslation.category || car.category,
          description: enTranslation.description || car.description
        }
      ]
    })
    setShowModal(true)
  }

  const handleAddOption = () => {
    setModalType('add')
    setModalEntity('option')
    setSelectedItem(null)
    setImagePreview(null)
    setFormData({
      name: '',
      category: '',
      price: '',
      description: '',
      detailedDescription: '',
      imageUrl: '',
      exclusiveGroup: '',
      isRequired: false,
      translations: [
        { locale: 'de', name: '', category: '', description: '', detailedDescription: '' },
        { locale: 'en', name: '', category: '', description: '', detailedDescription: '' }
      ]
    })
    setShowModal(true)
  }

  const handleEditOption = (option: Option) => {
    setModalType('edit')
    setModalEntity('option')
    setSelectedItem(option)
    setImagePreview(getImageDisplaySrc(option))

    // Initialize translations with existing data or defaults
    const deTranslation = option.translations?.find(t => t.locale === 'de') || { locale: 'de', name: '', category: '', description: '', detailedDescription: '' }
    const enTranslation = option.translations?.find(t => t.locale === 'en') || { locale: 'en', name: '', category: '', description: '', detailedDescription: '' }

    setFormData({
      name: option.name,
      category: option.category,
      price: option.price.toString(),
      description: option.description || '',
      detailedDescription: option.detailedDescription || '',
      imageUrl: option.imageUrl || '',
      imageData: option.imageData,
      imageMimeType: option.imageMimeType,
      exclusiveGroup: option.exclusiveGroup || '',
      isRequired: option.isRequired || false,
      translations: [
        {
          locale: 'de',
          name: deTranslation.name || option.name,
          category: deTranslation.category || option.category,
          description: deTranslation.description || option.description || '',
          detailedDescription: deTranslation.detailedDescription || option.detailedDescription || ''
        },
        {
          locale: 'en',
          name: enTranslation.name || option.name,
          category: enTranslation.category || option.category,
          description: enTranslation.description || option.description || '',
          detailedDescription: enTranslation.detailedDescription || option.detailedDescription || ''
        }
      ]
    })
    setShowModal(true)
  }

  const handleDeleteCar = async (id: string) => {
    if (!confirm(t('admin.cars_management.confirm_delete'))) return

    try {
      const response = await fetch(`/api/cars/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('carconfig_auth_token')}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setCars(cars.filter(car => car.id !== id))
      } else {
        alert(t('admin.cars_management.error_deleting', { error: data.error }))
      }
    } catch (error) {
      console.error('Error deleting car:', error)
      alert(t('admin.cars_management.error_deleting_car'))
    }
  }

  const handleDeleteOption = async (id: string) => {
    if (!confirm(t('admin.options_management.confirm_delete'))) return

    try {
      const response = await fetch(`/api/options/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('carconfig_auth_token')}`
        }
      })
      const data = await response.json()

      if (data.success) {
        // Update options state based on whether it's an array or grouped object
        if (Array.isArray(options)) {
          setOptions(options.filter((option: Option) => option.id !== id))
        } else {
          const updatedOptions = { ...options }
          Object.keys(updatedOptions).forEach(category => {
            updatedOptions[category] = updatedOptions[category].filter((option: Option) => option.id !== id)
          })
          setOptions(updatedOptions)
        }
      } else {
        alert(t('admin.options_management.error_deleting', { error: data.error }))
      }
    } catch (error) {
      console.error('Error deleting option:', error)
      alert('Error deleting option')
    }
  }

  const handleDeleteUser = async (id: string, userName: string) => {
    if (!confirm(t('admin.users_management.confirm_delete', { userName }))) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('carconfig_auth_token')}`
        },
        body: JSON.stringify({ userId: id })
      })
      const data = await response.json()

      if (data.success) {
        setUsers(users.filter(user => user.id !== id))
      } else {
        alert(t('admin.users_management.error_deleting', { error: data.error }))
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(t('admin.users_management.error_deleting_user'))
    }
  }

  const handleDeleteConfiguration = async (id: string) => {
    if (!confirm(t('admin.configurations_management.confirm_delete'))) return

    try {
      const response = await fetch(`/api/configurations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('carconfig_auth_token')}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setConfigurations(configurations.filter(config => config.id !== id))
      } else {
        alert(t('admin.configurations_management.error_deleting', { error: data.error }))
      }
    } catch (error) {
      console.error('Error deleting configuration:', error)
      alert(t('admin.configurations_management.error_deleting_configuration'))
    }
  }

  const handleSubmitForm = async () => {
    if (!selectedItem && modalType === 'edit') return

    setSubmitting(true)

    try {
      let url, method, body

      // Prepare image data - prioritize uploaded image over URL
      const hasImageData = formData.imageData && formData.imageData.trim() !== ''
      const hasImageUrl = formData.imageUrl && formData.imageUrl.trim() !== ''

      if (modalEntity === 'car') {
        url = modalType === 'add' ? '/api/cars' : `/api/cars/${selectedItem?.id}`
        method = modalType === 'add' ? 'POST' : 'PUT'
        const carFormData = formData as CarFormData

        // Build the body with required fields
        const carBody: Record<string, unknown> = {
          name: carFormData.name,
          category: carFormData.category,
          description: carFormData.description,
          basePrice: parseFloat(carFormData.basePrice),
          translations: carFormData.translations?.filter(t => t.name.trim() !== '' || t.category.trim() !== '' || t.description.trim() !== '')
        }

        // Only include image fields if they have actual values
        if (hasImageData) {
          carBody.imageData = formData.imageData
          carBody.imageMimeType = formData.imageMimeType
        } else if (hasImageUrl) {
          carBody.imageUrl = formData.imageUrl
        }

        body = carBody
      } else {
        url = modalType === 'add' ? '/api/options' : `/api/options/${selectedItem?.id}`
        method = modalType === 'add' ? 'POST' : 'PUT'
        const optionFormData = formData as OptionFormData

        // Build the body with required fields
        const optionBody: Record<string, unknown> = {
          name: optionFormData.name,
          category: optionFormData.category,
          description: optionFormData.description,
          detailedDescription: optionFormData.detailedDescription,
          price: parseFloat(optionFormData.price),
          exclusiveGroup: optionFormData.exclusiveGroup || null,
          isRequired: optionFormData.isRequired || false,
          translations: optionFormData.translations?.filter(t => t.name.trim() !== '' || t.category.trim() !== '' || (t.description && t.description.trim() !== ''))
        }

        // Only include image fields if they have actual values
        if (hasImageData) {
          optionBody.imageData = formData.imageData
          optionBody.imageMimeType = formData.imageMimeType
        } else if (hasImageUrl) {
          optionBody.imageUrl = formData.imageUrl
        }

        body = optionBody
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('carconfig_auth_token')}`
        },
        body: JSON.stringify(body)
      })

      let data
      let responseText = ''
      try {
        responseText = await response.text()
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        console.error('Response status:', response.status)
        console.error('Response text:', responseText)
        alert('Fehler beim Verarbeiten der Server-Antwort')
        return
      }

      if (data.success) {
        if (modalEntity === 'car') {
          if (modalType === 'add') {
            setCars([...cars, data.data])
          } else {
            setCars(cars.map(car => car.id === selectedItem?.id ? data.data : car))
          }
        } else {
          // Handle options update - refetch to get proper grouping
          const authToken = localStorage.getItem('carconfig_auth_token')
          const headers: Record<string, string> = {}
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`
          }
          const optionsResponse = await fetch('/api/admin/options', { headers })
          const optionsData = await optionsResponse.json()
          if (optionsData.success) {
            setOptions(optionsData.data)
          }
        }
        setShowModal(false)
        setImagePreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        console.error('API Error Details:')
        console.error('Response status:', response.status)
        console.error('Response data:', data)
        console.error('Validation details:', data.details)
        console.error('URL:', url)
        console.error('Method:', method)
        console.error('Body:', body)

        if (response.status === 401) {
          alert('Authentifizierung fehlgeschlagen. Bitte melden Sie sich erneut an.')
          // Optional: Redirect to login
          localStorage.removeItem('carconfig_auth_token')
          localStorage.removeItem('carconfig_user_id')
          router.push('/admin/login')
        } else {
          const errorMessage = data?.error || data?.message || 'Unbekannter Fehler'
          let detailsMessage = ''
          if (data?.details) {
            detailsMessage = '\n\nDetails:\n' + Object.entries(data.details).map(([field, error]) => `- ${field}: ${error}`).join('\n')
          }
          alert(`Fehler beim Speichern: ${errorMessage}${detailsMessage}`)
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error submitting form')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Escape key for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showModal])

  // Handle click outside modal
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false)
    }
  }

  // Show loading while checking authentication
  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-lg">{t('admin.checking_auth')}</p>
        </div>
      </div>
    )
  }

  // If not authenticated, this component shouldn't render (redirect should happen)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-background" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('admin.title')}</h1>
            <p className="text-muted-foreground">{t('admin.subtitle')}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCleanupDemoData}
              disabled={cleaningUp}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-lg transition-colors disabled:opacity-50"
              data-testid="admin-cleanup-demo-data-button"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {cleaningUp ? 'Lösche...' : 'Demo-Daten löschen'}
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 border border-border rounded-lg transition-colors disabled:opacity-50"
              data-testid="admin-logout-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('admin.cars')}</p>
                <p className="text-3xl font-bold text-card-foreground">{cars.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Car className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('admin.options')}</p>
                <p className="text-3xl font-bold text-card-foreground">{Array.isArray(options) ? options.length : Object.keys(options || {}).reduce((sum, key) => sum + (options[key]?.length || 0), 0)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('admin.configurations')}</p>
                <p className="text-3xl font-bold text-card-foreground">{configurations.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('admin.users')}</p>
                <p className="text-3xl font-bold text-card-foreground">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-card rounded-2xl shadow-lg border border-border mb-8">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {              [
                { id: 'cars', name: t('admin.tabs.cars'), icon: Car },
                { id: 'options', name: t('admin.tabs.options'), icon: Settings },
                { id: 'users', name: t('admin.tabs.users'), icon: Users },
                { id: 'configurations', name: t('admin.tabs.configurations'), icon: BarChart3 }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      }
                    `}
                    data-testid={`admin-tab-${tab.id}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'cars' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-card-foreground">{t('admin.cars_management.title')}</h3>
                  <button
                    onClick={handleAddCar}
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    data-testid="admin-add-car-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin.cars_management.add_new')}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border table-fixed">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-2/5">
                          Fahrzeug
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">
                          Kategorie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">
                          Grundpreis
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {cars.map((car) => (
                        <tr key={car.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <Image
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={getImageDisplaySrc(car) || '/images/cars/default.jpg'}
                                  alt={car.name}
                                  width={40}
                                  height={40}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/cars/default.jpg'
                                  }}
                                />
                              </div>
                              <div className="ml-4 min-w-0 flex-1">
                                <div className="text-sm font-medium text-card-foreground truncate">{car.name}</div>
                                <div className="text-sm text-muted-foreground max-w-xs break-words">{car.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {car.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            €{car.basePrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEditCar(car)}
                              className="text-primary hover:text-primary/80 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCar(car.id)}
                              className="text-destructive hover:text-destructive/80 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-card-foreground">{t('admin.users_management.title')}</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Benutzer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Rolle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Konfigurationen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-card-foreground">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {user.configurationsCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="text-destructive hover:text-destructive/80 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'configurations' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-card-foreground">{t('admin.configurations_management.title')}</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Benutzer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Fahrzeug
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Gesamtpreis
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Erstellt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {configurations.map((config) => (
                        <tr key={config.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">
                            {config.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {config.user?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {config.car?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            €{config.totalPrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(config.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteConfiguration(config.id)}
                              className="text-destructive hover:text-destructive/80 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'options' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-card-foreground">{t('admin.options_management.title')}</h3>
                  <button
                    onClick={handleAddOption}
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin.options_management.add_new')}
                  </button>
                </div>

                {Array.isArray(options) ? (
                  // If options is an array (flat structure)
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border table-fixed">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-2/5">
                            Option
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">
                            Kategorie
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">
                            Preis
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">
                            Aktionen
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {options.map((option: Option) => (
                          <tr key={option.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-card-foreground">{option.name}</div>
                                <div className="text-sm text-muted-foreground max-w-xs break-words">{option.description}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {option.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              €{option.price.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleEditOption(option)}
                                className="text-primary hover:text-primary/80 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteOption(option.id)}
                                className="text-destructive hover:text-destructive/80 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // If options is grouped by category
                  <div className="space-y-6">
                    {Object.entries(options).map(([category, categoryOptions]) => (
                      <div key={category} className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-muted/30 px-6 py-3 border-b border-border">
                          <h4 className="text-lg font-medium text-card-foreground">{category}</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-border table-fixed">
                            <thead className="bg-muted/20">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-3/5">
                                  Option
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">
                                  Preis
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">
                                  Aktionen
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {categoryOptions.map((option: Option) => (
                                <tr key={option.id} className="hover:bg-muted/50">
                                  <td className="px-6 py-4">
                                    <div>
                                      <div className="text-sm font-medium text-card-foreground">{option.name}</div>
                                      <div className="text-sm text-muted-foreground max-w-xs break-words">{option.description}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    €{option.price.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                      onClick={() => handleEditOption(option)}
                                      className="text-primary hover:text-primary/80 transition-colors"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOption(option.id)}
                                      className="text-destructive hover:text-destructive/80 transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal for Add/Edit Car/Option */}
        {showModal && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            data-testid="admin-modal"
            onClick={handleModalBackdropClick}
          >
            <div
              className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col"
              data-testid="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fixed Header */}
              <div className="flex-shrink-0 p-6 pb-4 border-b border-border" data-testid="modal-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-card-foreground" data-testid="modal-title">
                    {modalType === 'add'
                      ? (modalEntity === 'car' ? t('admin.add_car') : t('admin.add_option'))
                      : (modalEntity === 'car' ? t('admin.edit_car') : t('admin.edit_option'))
                    }
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    data-testid="close-modal"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 py-4" data-testid="modal-body">
                <form id="modal-form" onSubmit={(e) => { e.preventDefault(); handleSubmitForm(); }} className="h-full" data-testid="admin-form">
                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Kategorie
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Kategorie wählen</option>
                      {modalEntity === 'car' ? (
                        <>
                          <option value="Limousine">Limousine</option>
                          <option value="SUV">SUV</option>
                          <option value="Coupe">Coupe</option>
                          <option value="Cabrio">Cabrio</option>
                        </>
                      ) : (
                        <>
                          <option value="Motor">Motor</option>
                          <option value="Innenausstattung">Innenausstattung</option>
                          <option value="Außenausstattung">Außenausstattung</option>
                          <option value="Technologie">Technologie</option>
                          <option value="Komfort">Komfort</option>
                          <option value="Sicherheit">Sicherheit</option>
                        </>
                      )}
                    </select>
                  </div>

                  {modalEntity === 'car' ? (
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">
                        Grundpreis (€)
                      </label>
                      <input
                        type="number"
                        value={(formData as CarFormData).basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value } as CarFormData)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                        min="0"
                        step="100"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                          Preis (€)
                        </label>
                        <input
                          type="number"
                          value={(formData as OptionFormData).price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value } as OptionFormData)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                          min="0"
                          step="10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                          Exklusive Gruppe
                        </label>
                        <input
                          type="text"
                          value={(formData as OptionFormData).exclusiveGroup || ''}
                          onChange={(e) => setFormData({ ...formData, exclusiveGroup: e.target.value } as OptionFormData)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="z.B. motor, farbe, felgen"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Optionen mit derselben Gruppe schließen sich gegenseitig aus
                        </p>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isRequired"
                          checked={(formData as OptionFormData).isRequired || false}
                          onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked } as OptionFormData)}
                          className="mr-2"
                        />
                        <label htmlFor="isRequired" className="text-sm font-medium text-card-foreground">
                          Pflichtausstattung
                        </label>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Beschreibung
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      required
                    />
                  </div>

                  {modalEntity === 'option' && (
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">
                        Detaillierte Beschreibung
                      </label>
                      <textarea
                        value={(formData as OptionFormData).detailedDescription || ''}
                        onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value } as OptionFormData)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={4}
                        placeholder="Erweiterte Beschreibung für das Detail-Modal"
                      />
                    </div>
                  )}

                  {/* Translations Section */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-card-foreground">Übersetzungen</h3>
                      <button
                        type="button"
                        onClick={() => setShowTranslations(!showTranslations)}
                        className="text-primary hover:text-primary/80 text-sm"
                      >
                        {showTranslations ? 'Verbergen' : 'Bearbeiten'}
                      </button>
                    </div>

                    {showTranslations && (
                      <div className="space-y-6">
                        {['de', 'en'].map((locale) => (
                          <div key={locale} className="border border-border rounded-lg p-4">
                            <h4 className="font-medium text-card-foreground mb-3 flex items-center">
                              <span className="mr-2">{locale === 'de' ? '🇩🇪' : '🇺🇸'}</span>
                              {locale === 'de' ? 'Deutsch' : 'English'}
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1">
                                  Name ({locale.toUpperCase()})
                                </label>
                                <input
                                  type="text"
                                  value={getTranslationValue(locale, 'name')}
                                  onChange={(e) => updateTranslation(locale, 'name', e.target.value)}
                                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder={`Name auf ${locale === 'de' ? 'Deutsch' : 'Englisch'}`}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1">
                                  Kategorie ({locale.toUpperCase()})
                                </label>
                                <input
                                  type="text"
                                  value={getTranslationValue(locale, 'category')}
                                  onChange={(e) => updateTranslation(locale, 'category', e.target.value)}
                                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder={`Kategorie auf ${locale === 'de' ? 'Deutsch' : 'Englisch'}`}
                                />
                              </div>
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-card-foreground mb-1">
                                Beschreibung ({locale.toUpperCase()})
                              </label>
                              <textarea
                                value={getTranslationValue(locale, 'description')}
                                onChange={(e) => updateTranslation(locale, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={3}
                                placeholder={`Beschreibung auf ${locale === 'de' ? 'Deutsch' : 'Englisch'}`}
                              />
                            </div>

                            {modalEntity === 'option' && (
                              <div className="mt-4">
                                <label className="block text-sm font-medium text-card-foreground mb-1">
                                  Detaillierte Beschreibung ({locale.toUpperCase()})
                                </label>
                                <textarea
                                  value={getTranslationValue(locale, 'detailedDescription')}
                                  onChange={(e) => updateTranslation(locale, 'detailedDescription', e.target.value)}
                                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  rows={3}
                                  placeholder={`Detaillierte Beschreibung auf ${locale === 'de' ? 'Deutsch' : 'Englisch'}`}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Bild
                    </label>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-border rounded-lg p-6 relative">
                      {imagePreview ? (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleImageRemove}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                          <div className="mt-4">
                            <label
                              htmlFor="image-upload"
                              className="cursor-pointer rounded-md bg-background font-medium text-primary hover:text-primary/80"
                            >
                              <span>Bild hochladen</span>
                              <input
                                ref={fileInputRef}
                                id="image-upload"
                                name="image-upload"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleImageUpload(file)
                                }}
                              />
                            </label>
                            <p className="pl-1 text-muted-foreground">oder Drag & Drop</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG, JPG, GIF bis zu 10MB
                          </p>
                        </div>
                      )}
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                          <div className="text-foreground text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-2">Bild wird verarbeitet...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* URL Alternative */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-card text-muted-foreground">
                          {formData.imageData ? 'URL-Eingabe gesperrt (Datei hochgeladen)' : 'oder Bild-URL verwenden'}
                        </span>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder={modalEntity === 'car' ? "/images/cars/example.jpg oder https://..." : "/images/options/example.png oder https://..."}
                      value={formData.imageUrl || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value })
                        if (e.target.value && !imagePreview) {
                          setImagePreview(e.target.value)
                        }
                      }}
                      className={`w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                        formData.imageData ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={!!formData.imageData}
                    />

                    {formData.imageData && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Tipp: Entfernen Sie das hochgeladene Bild, um eine URL zu verwenden
                      </p>
                    )}
                  </div>
                </div>
                </form>
              </div>

              {/* Fixed Footer */}
              <div className="flex-shrink-0 p-6 pt-4 border-t border-border">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    form="modal-form"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Speichern...' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
