export interface Car {
  id: string
  name: string
  category: string
  basePrice: number
  description: string
  imageUrl?: string | null      // Legacy field for URLs
  imageData?: string | null     // Base64 encoded image data
  imageMimeType?: string | null // MIME type
  createdAt: Date
  updatedAt: Date
  translations?: CarTranslation[]
}

export interface CarTranslation {
  id: string
  carId: string
  locale: string
  name: string
  category: string
  description: string
  createdAt: Date
  updatedAt: Date
}

export interface Option {
  id: string
  name: string
  category: string
  price: number
  description?: string | null
  detailedDescription?: string | null // Extended description for modal
  imageUrl?: string | null      // Legacy field for URLs
  imageData?: string | null     // Base64 encoded image data
  imageMimeType?: string | null // MIME type
  exclusiveGroup?: string | null // Options with same group exclude each other
  isRequired?: boolean          // Required options must be selected
  createdAt: Date
  updatedAt: Date
  translations?: OptionTranslation[]
}

export interface OptionTranslation {
  id: string
  optionId: string
  locale: string
  name: string
  category: string
  description?: string | null
  detailedDescription?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  password: string
  role: string
  isRegistered: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Configuration {
  id: string
  name: string
  totalPrice: number
  userId: string
  carId: string
  createdAt: Date
  updatedAt: Date
  user?: Omit<User, 'password'>
  car?: Car
  options?: Option[]
}

export interface CarWithOptions extends Car {
  options: {
    option: Option
  }[]
}

export interface ConfigurationWithDetails extends Omit<Configuration, 'options'> {
  car: Car
  options: {
    option: Option
  }[]
}

export interface CarConfiguratorState {
  selectedCar?: Car
  selectedOptions: Option[]
  totalPrice: number
}

export interface OptionCategory {
  name: string
  options: Option[]
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Form types
export interface CarFormData {
  name: string
  category: string
  basePrice: number
  description: string
  imageUrl: string
  translations?: {
    locale: string
    name: string
    category: string
    description: string
  }[]
}

export interface OptionFormData {
  name: string
  category: string
  price: number
  description?: string
  detailedDescription?: string
  imageUrl?: string
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

export interface UserFormData {
  email: string
  name: string
  password: string
  role?: string
}

export interface ConfigurationFormData {
  name: string
  carId: string
  selectedOptions: string[]
}

export interface UserWithStats extends Omit<User, 'password'> {
  configurationsCount?: number
  _count?: {
    configurations: number
  }
}

export interface RequiredGroup {
  id: string
  exclusiveGroup: string
  isRequired: boolean
  displayName: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
}
