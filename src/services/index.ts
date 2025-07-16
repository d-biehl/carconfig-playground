/**
 * Services Index - Central export for all business logic services
 *
 * This module provides a centralized access point for all business logic services.
 * Each service handles specific domain operations and maintains separation of concerns.
 */

export { CarService } from './CarService'
export type {
  CarCreateInput,
  CarUpdateInput,
  CarQueryOptions
} from './CarService'

export { OptionService } from './OptionService'
export type {
  OptionCreateInput,
  OptionUpdateInput,
  OptionQueryOptions
} from './OptionService'

export { ConfigurationService } from './ConfigurationService'
export type {
  ConfigurationCreateInput,
  ConfigurationUpdateInput,
  ConfigurationQueryOptions,
  PriceCalculationResult
} from './ConfigurationService'

export { UserService } from './UserService'
export type {
  UserCreateInput,
  UserUpdateInput,
  UserWithStats,
  DemoUserCreateResult
} from './UserService'

/**
 * Service Layer Architecture Overview:
 *
 * 1. CarService - Handles car management, localization, and image processing
 * 2. OptionService - Manages options, conflicts, validation, and categorization
 * 3. ConfigurationService - Handles configurations, pricing, and validation
 * 4. UserService - Manages users, authentication, and statistics
 *
 * Each service:
 * - Uses structured logging for debugging and monitoring
 * - Implements proper error handling with descriptive messages
 * - Validates input data and business rules
 * - Maintains database transaction integrity
 * - Provides type-safe interfaces for all operations
 */
