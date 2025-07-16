import { z } from 'zod'

// Base schemas
export const CarSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name ist erforderlich'),
  category: z.string().min(1, 'Kategorie ist erforderlich'),
  basePrice: z.number().positive('Grundpreis muss positiv sein'),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  imageUrl: z.string().nullable().optional(),
  imageData: z.string().nullable().optional(),
  imageMimeType: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const OptionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name ist erforderlich'),
  category: z.string().min(1, 'Kategorie ist erforderlich'),
  price: z.number().min(0, 'Preis muss nicht-negativ sein'),
  description: z.string().nullable().optional(),
  detailedDescription: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  imageData: z.string().nullable().optional(),
  imageMimeType: z.string().nullable().optional(),
  exclusiveGroup: z.string().nullable().optional(),
  isRequired: z.boolean().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const UserSchema = z.object({
  id: z.string(),
  email: z.string()
    .email('Ungültige E-Mail-Adresse')
    .refine(email => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email),
      'E-Mail-Format ist ungültig'),
  name: z.string().min(1, 'Name ist erforderlich'),
  role: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const ConfigurationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name ist erforderlich'),
  totalPrice: z.number().positive('Gesamtpreis muss positiv sein'),
  userId: z.string(),
  carId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Request schemas - OpenAPI compliant (lenient for schema validation)
export const CreateCarRequestSchema = z.object({
  name: z.string(),
  category: z.string(),
  basePrice: z.number(),
  description: z.string(),
  imageUrl: z.string().optional(),
  imageData: z.string().optional(),
  imageMimeType: z.string().optional(),
  translations: z.array(z.object({
    locale: z.enum(['de', 'en'], { message: 'Locale muss "de" oder "en" sein' }),
    name: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional()
  })).optional()
})

// Business logic schemas (strict validation)
export const CreateCarBusinessSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  category: z.string().min(1, 'Kategorie ist erforderlich'),
  basePrice: z.number().positive('Grundpreis muss positiv sein'),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  imageUrl: z.string().refine((val) => {
    if (!val) return true // Empty is allowed
    // Allow relative paths starting with / or full URLs
    return val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://')
  }, 'Bild-URL muss ein relativer Pfad (/images/...) oder eine vollständige URL (https://...) sein').optional(),
  imageData: z.string().optional(),
  imageMimeType: z.string().optional(),
  translations: z.array(z.object({
    locale: z.enum(['de', 'en'], { message: 'Locale muss "de" oder "en" sein' }),
    name: z.string().min(1, 'Übersetzter Name ist erforderlich'),
    category: z.string().min(1, 'Übersetzte Kategorie ist erforderlich'),
    description: z.string().min(1, 'Übersetzte Beschreibung ist erforderlich')
  })).min(1, 'Mindestens eine Übersetzung ist erforderlich').optional()
})

export const UpdateCarRequestSchema = CreateCarRequestSchema.partial()
export const UpdateCarBusinessSchema = CreateCarBusinessSchema.partial()

export const CreateOptionRequestSchema = z.object({
  name: z.string(),
  category: z.string(),
  price: z.number(),
  description: z.string().optional(),
  detailedDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  imageData: z.string().optional(),
  imageMimeType: z.string().optional(),
  exclusiveGroup: z.string().optional(),
  isRequired: z.boolean().optional(),
  translations: z.array(z.object({
    locale: z.enum(['de', 'en'], { message: 'Locale muss "de" oder "en" sein' }),
    name: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    detailedDescription: z.string().optional()
  })).optional()
})

export const CreateOptionBusinessSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  category: z.string().min(1, 'Kategorie ist erforderlich'),
  price: z.number().min(0, 'Preis muss nicht-negativ sein'),
  description: z.string().optional(),
  detailedDescription: z.string().optional(),
  imageUrl: z.string().refine((val) => {
    if (!val) return true // Empty is allowed
    // Allow relative paths starting with / or full URLs
    return val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://')
  }, 'Bild-URL muss ein relativer Pfad (/images/...) oder eine vollständige URL (https://...) sein').optional(),
  imageData: z.string().optional(),
  imageMimeType: z.string().optional(),
  exclusiveGroup: z.string().optional(),
  isRequired: z.boolean().optional(),
  translations: z.array(z.object({
    locale: z.enum(['de', 'en'], { message: 'Locale muss "de" oder "en" sein' }),
    name: z.string().min(1, 'Übersetzter Name ist erforderlich'),
    category: z.string().min(1, 'Übersetzte Kategorie ist erforderlich'),
    description: z.string().min(1, 'Übersetzte Beschreibung ist erforderlich'),
    detailedDescription: z.string().optional()
  })).min(1, 'Mindestens eine Übersetzung ist erforderlich')
  .refine(translations => {
    // If translations array is provided, each translation must have required fields
    return translations.every(t => t.name && t.name.length > 0 && t.category && t.category.length > 0 && t.description && t.description.length > 0)
  }, 'Alle Übersetzungen müssen Name, Kategorie und Beschreibung enthalten')
  .optional()
})

export const UpdateOptionRequestSchema = CreateOptionRequestSchema.partial()
export const UpdateOptionBusinessSchema = CreateOptionBusinessSchema.partial()

export const CreateConfigurationRequestSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  carId: z.string().min(1, 'Auto-ID ist erforderlich'),
  userId: z.string().min(1, 'Benutzer-ID ist erforderlich'),
  selectedOptions: z.array(z.string()).min(0, 'Optionen-Array ist erforderlich')
})

export const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Benutzername ist erforderlich'),
  password: z.string().min(1, 'Passwort ist erforderlich')
})

export const RegisterRequestSchema = z.object({
  email: z.string()
    .email('Ungültige E-Mail-Adresse')
    .refine(email => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email),
      'E-Mail-Format ist ungültig'),
  name: z.string().min(1, 'Name ist erforderlich'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
})

export const ValidateOptionsRequestSchema = z.object({
  optionIds: z.array(z.string()),
  carId: z.string().optional()
})

export const UserLoginRequestSchema = z.object({
  email: z.string()
    .email('Ungültige E-Mail-Adresse')
    .refine(email => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email),
      'E-Mail-Format ist ungültig'),
  password: z.string().min(1, 'Passwort ist erforderlich')
})

export const UpdateConfigurationRequestSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').optional(),
  selectedOptions: z.array(z.string()).optional()
})

export const LocaleRequestSchema = z.object({
  locale: z.string().regex(/^(de|en)$/, 'Ungültige Sprache')
})

export const CarIdParamSchema = z.object({
  id: z.string().min(1, 'Auto-ID ist erforderlich')
})

export const OptionIdParamSchema = z.object({
  id: z.string().min(1, 'Options-ID ist erforderlich')
})

export const ConfigurationIdParamSchema = z.object({
  id: z.string().min(1, 'Konfigurations-ID ist erforderlich')
})

export const AdminUsersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
})

export const SessionResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.string()
  }),
  sessionId: z.string()
})

export const ConflictsResponseSchema = z.object({
  conflicts: z.array(z.object({
    optionId: z.string(),
    conflictingOptions: z.array(z.string()),
    reason: z.string()
  }))
})

export const RequiredGroupsResponseSchema = z.object({
  groups: z.array(z.object({
    name: z.string(),
    options: z.array(OptionSchema),
    isRequired: z.boolean()
  }))
})

// Required Groups schemas
export const RequiredGroupSchema = z.object({
  id: z.number(),
  exclusiveGroup: z.string(),
  isRequired: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const RequiredGroupUpdateSchema = z.object({
  exclusiveGroup: z.string().min(1, 'Exclusive group is required'),
  isRequired: z.boolean()
})

// Response schemas
export const ApiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.string().optional()
})

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.record(z.string(), z.any()).optional()
})

// Query parameter schemas
export const CarsQuerySchema = z.object({
  locale: z.string().min(1, 'Locale darf nicht leer sein').refine(
    (val) => val === 'de' || val === 'en',
    { message: 'Locale muss "de" oder "en" sein' }
  ).optional()
})

export const OptionsQuerySchema = z.object({
  locale: z.string().min(1, 'Locale darf nicht leer sein').refine(
    (val) => val === 'de' || val === 'en',
    { message: 'Locale muss "de" oder "en" sein' }
  ).optional()
})

export const ConfigurationsQuerySchema = z.object({
  userId: z.string().optional(),
  adminView: z.string().optional()
})

// Locale schemas
export const LocaleUpdateSchema = z.object({
  locale: z.enum(['de', 'en'], {
    message: 'Locale must be either "de" or "en"'
  })
})

// Export types
export type CarInput = z.infer<typeof CreateCarRequestSchema>
export type CarUpdateInput = z.infer<typeof UpdateCarRequestSchema>
export type OptionInput = z.infer<typeof CreateOptionRequestSchema>
export type OptionUpdateInput = z.infer<typeof UpdateOptionRequestSchema>
export type ConfigurationInput = z.infer<typeof CreateConfigurationRequestSchema>
export type ConfigurationUpdateInput = z.infer<typeof UpdateConfigurationRequestSchema>
export type LoginInput = z.infer<typeof LoginRequestSchema>
export type UserLoginInput = z.infer<typeof UserLoginRequestSchema>
export type RegisterInput = z.infer<typeof RegisterRequestSchema>
export type ValidateOptionsInput = z.infer<typeof ValidateOptionsRequestSchema>
export type LocaleInput = z.infer<typeof LocaleRequestSchema>
export type CarIdParam = z.infer<typeof CarIdParamSchema>
export type OptionIdParam = z.infer<typeof OptionIdParamSchema>
export type ConfigurationIdParam = z.infer<typeof ConfigurationIdParamSchema>
export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>
export type LocaleUpdate = z.infer<typeof LocaleUpdateSchema>
export type RequiredGroup = z.infer<typeof RequiredGroupSchema>
export type RequiredGroupUpdate = z.infer<typeof RequiredGroupUpdateSchema>

// Admin schemas
export const AdminUserDeleteSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
})

export type AdminUserDelete = z.infer<typeof AdminUserDeleteSchema>

// User Session schemas
export const UserSessionSchema = z.object({
  sessionId: z.string().optional(),
  userId: z.string().optional()
}).optional().default({})

export type UserSession = z.infer<typeof UserSessionSchema>
