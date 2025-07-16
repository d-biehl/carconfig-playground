'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingCart,
  Check,
  CreditCard,
  Building2,
  Smartphone,
  Shield,
  Truck,
  Calendar,
  User,
  MapPin
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { Car, Option } from '@/types'

interface ConfigData {
  car: Car
  options: Option[]
  totalPrice: number
  configurationName: string
}

export default function CheckoutPage() {
  const t = useTranslations('checkout')
  const searchParams = useSearchParams()
  const router = useRouter()
  const [configData, setConfigData] = useState<ConfigData | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<'credit' | 'debit' | 'paypal' | 'bank'>('credit')
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    zipCode: '',
    country: 'Germany'
  })
  const [orderProcessing, setOrderProcessing] = useState(false)
  const [orderCompleted, setOrderCompleted] = useState(false)

  useEffect(() => {
    const sessionId = searchParams.get('sessionId')
    if (sessionId) {
      // Fetch checkout session data from API
      fetch(`/api/checkout/session?sessionId=${sessionId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setConfigData({
              car: data.data.car,
              options: data.data.options,
              totalPrice: data.data.totalPrice,
              configurationName: data.data.configurationName || 'Custom Configuration'
            })
          } else {
            console.error('Error loading checkout session:', data.error)
            router.push('/configurator')
          }
        })
        .catch(error => {
          console.error('Error fetching checkout session:', error)
          router.push('/configurator')
        })
    } else {
      router.push('/configurator')
    }
  }, [searchParams, router])

  const handleCustomerDataChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = () => {
    return Object.values(customerData).every(value => value.trim() !== '')
  }

  const handleOrderSubmit = async () => {
    if (!isFormValid() || !configData) return

    setOrderProcessing(true)

    // Simulate order processing
    setTimeout(() => {
      setOrderProcessing(false)
      setOrderCompleted(true)
    }, 3000)
  }

  if (!configData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-lg">{t('loading_order_data')}</p>
        </div>
      </div>
    )
  }

  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-background dark:from-green-900/20" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">{t('order_successful')}</h1>
            <p className="text-lg text-muted-foreground mb-8">
              {t('thank_you_message')}
            </p>

            <div className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold text-card-foreground mb-6">{t('order_overview')}</h2>
              <div className="text-left space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('order_number')}:</span>
                  <span className="font-mono">#CO-{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('vehicle')}:</span>
                  <span className="font-semibold">{configData.car.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('total_price')}:</span>
                  <span className="font-bold text-xl text-green-600">{formatPrice(configData.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('delivery_time')}:</span>
                  <span>{t('delivery_weeks')}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                {t('to_homepage')}
              </Link>
              <Link
                href="/configurator"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('configure_new_vehicle')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-background" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Summary Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('complete_order')}
          </h1>
          <div className="text-2xl font-bold text-primary">
            {formatPrice(configData.totalPrice)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Customer Data & Payment */}
          <div className="space-y-8">
            {/* Customer Information */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
              <h2 className="text-2xl font-bold text-card-foreground mb-6 flex items-center">
                <User className="h-6 w-6 mr-3 text-primary" />
                {t('customer_data')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    {t('first_name')} *
                  </label>
                  <input
                    type="text"
                    value={customerData.firstName}
                    onChange={(e) => handleCustomerDataChange('firstName', e.target.value)}
                    autoComplete="given-name"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                    placeholder={t('first_name_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    {t('last_name')} *
                  </label>
                  <input
                    type="text"
                    value={customerData.lastName}
                    onChange={(e) => handleCustomerDataChange('lastName', e.target.value)}
                    autoComplete="family-name"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                    placeholder={t('last_name_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    {t('email')} *
                  </label>
                  <input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => handleCustomerDataChange('email', e.target.value)}
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                    placeholder={t('email_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    {t('phone')} *
                  </label>
                  <input
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => handleCustomerDataChange('phone', e.target.value)}
                    autoComplete="tel"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                    placeholder={t('phone_placeholder')}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    {t('street_number')}
                  </label>
                  <input
                    type="text"
                    value={customerData.street}
                    onChange={(e) => handleCustomerDataChange('street', e.target.value)}
                    autoComplete="street-address"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                    placeholder={t('street_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    {t('postal_code')} *
                  </label>
                  <input
                    type="text"
                    value={customerData.zipCode}
                    onChange={(e) => handleCustomerDataChange('zipCode', e.target.value)}
                    autoComplete="postal-code"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                    placeholder={t('postal_code_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    {t('city')} *
                  </label>
                  <input
                    type="text"
                    value={customerData.city}
                    onChange={(e) => handleCustomerDataChange('city', e.target.value)}
                    autoComplete="address-level2"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                    placeholder={t('city_placeholder')}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
              <h2 className="text-2xl font-bold text-card-foreground mb-6 flex items-center">
                <CreditCard className="h-6 w-6 mr-3 text-primary" />
                {t('payment_method')}
              </h2>
              <div className="space-y-3">
                {[
                  { id: 'credit', icon: CreditCard, name: t('credit_card'), desc: t('credit_card_types') },
                  { id: 'debit', icon: CreditCard, name: t('debit_card'), desc: t('german_bank_cards') },
                  { id: 'paypal', icon: Smartphone, name: 'PayPal', desc: t('secure_online_payment') },
                  { id: 'bank', icon: Building2, name: t('bank_transfer'), desc: t('traditional_transfer') }
                ].map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPayment(method.id as 'credit' | 'debit' | 'paypal' | 'bank')}
                  >
                    <div className="flex items-center">
                      <method.icon className="h-5 w-5 text-primary mr-3" />
                      <div className="flex-1">
                        <div className="font-medium text-card-foreground">{method.name}</div>
                        <div className="text-sm text-muted-foreground">{method.desc}</div>
                      </div>
                      {selectedPayment === method.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>{t('demo_mode')}:</strong> {t('demo_description')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-8">
            {/* Configuration Summary */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
              <h2 className="text-2xl font-bold text-card-foreground mb-6">{t('order_overview')}</h2>

              {/* Car Image and Basic Info */}
              <div className="flex items-center space-x-4 mb-6 p-4 bg-secondary/30 rounded-lg">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-card-foreground">{configData.car.name}</h3>
                  <p className="text-muted-foreground">{configData.configurationName}</p>
                  <p className="text-sm text-muted-foreground">{configData.car.category}</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                  <span className="text-muted-foreground">{t('base_price')}:</span>
                  <span className="font-semibold">{formatPrice(configData.car.basePrice)}</span>
                </div>

                {configData.options.map((option) => (
                  <div key={option.id} className="flex justify-between items-center p-2 text-sm">
                    <span className="text-muted-foreground">{option.name}:</span>
                    <span className="font-medium">+{formatPrice(option.price)}</span>
                  </div>
                ))}

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl">
                    <span className="text-xl font-bold text-card-foreground">{t('total_price')}:</span>
                    <span className="text-2xl font-bold text-foreground">{formatPrice(configData.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
              <h3 className="text-xl font-bold text-card-foreground mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-primary" />
                {t('delivery_info')}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{t('estimated_delivery_time')}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{t('delivery_to_address')}</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{t('free_delivery_setup')}</span>
                </div>
              </div>
            </div>

            {/* Order Button */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
              <button
                onClick={handleOrderSubmit}
                disabled={!isFormValid() || orderProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 btn-hover shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                {orderProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('processing_order')}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {t('place_order')} - {formatPrice(configData.totalPrice)}
                  </>
                )}
              </button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                {t('terms_acceptance')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
