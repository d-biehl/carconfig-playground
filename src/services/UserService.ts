/**
 * UserService - Business logic for user management
 * Handles user operations, authentication, and statistics
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { NotFoundError, DatabaseError, ValidationError, ConflictError, withDatabaseError } from '@/lib/errorHandling'
import type { UserWithStats } from '@/types'
import bcrypt from 'bcryptjs'

export interface UserCreateInput {
  email: string
  name: string
  password: string
  role?: 'user' | 'admin'
  isRegistered?: boolean
}

export interface UserUpdateInput extends Partial<Omit<UserCreateInput, 'password'>> {
  id: string
  password?: string
}

export interface DemoUserCreateResult {
  id: string
  name: string
  sessionId?: string
}

export class UserService {
  /**
   * Get all users with configuration counts
   */
  static async getUsers(): Promise<UserWithStats[]> {
    try {
      logger.debug('Fetching all users')

      const users = await withDatabaseError(async () => {
        return await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isRegistered: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                configurations: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      }, 'UserService.getUsers')

      const usersWithStats: UserWithStats[] = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isRegistered: user.isRegistered,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        configurationsCount: user._count.configurations
      }))

      logger.info('Users retrieved successfully', { count: users.length })
      return usersWithStats
    } catch (error) {
      logger.error('Error fetching users', { error })
      throw new Error('Failed to fetch users')
    }
  }

  /**
   * Get a single user by ID
   */
  static async getUserById(id: string) {
    try {
      logger.debug('Fetching user by ID', { id })

      const user = await withDatabaseError(async () => {
        return await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isRegistered: true,
            createdAt: true,
            updatedAt: true
          }
        })
      }, 'UserService.getUserById')

      if (!user) {
        logger.warn('User not found', { id })
        throw new NotFoundError('User', id)
      }

      logger.info('User retrieved successfully', { id })
      return user
    } catch (error) {
      logger.error('Error fetching user by ID', { error, id })
      throw new Error('Failed to fetch user')
    }
  }

  /**
   * Get a user by email
   */
  static async getUserByEmail(email: string) {
    try {
      // Validate email format
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new ValidationError('Valid email is required')
      }

      logger.debug('Fetching user by email', { email: email.substring(0, 3) + '***' })

      const user = await withDatabaseError(async () => {
        return await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            isRegistered: true,
            createdAt: true,
            updatedAt: true
          }
        })
      }, 'UserService.getUserByEmail')

      if (!user) {
        logger.warn('User not found by email')
        throw new NotFoundError('User', email)
      }

      logger.info('User retrieved by email successfully', { id: user.id })
      return user
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error
      }
      logger.error('Error fetching user by email', { error })
      throw new DatabaseError('Failed to fetch user by email', error as Error)
    }
  }

  /**
   * Create a new user
   */
  static async createUser(input: UserCreateInput) {
    try {
      logger.debug('Creating new user', { email: input.email, name: input.name, role: input.role })

      // Validate input data
      if (!input.email?.trim()) {
        throw new ValidationError('Email is required')
      }
      if (!input.name?.trim()) {
        throw new ValidationError('Name is required')
      }
      if (!input.password?.trim()) {
        throw new ValidationError('Password is required')
      }
      if (input.password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long')
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(input.email)) {
        throw new ValidationError('Invalid email format')
      }

      const result = await withDatabaseError(async () => {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: input.email }
        })

        if (existingUser) {
          throw new ConflictError('User with this email already exists')
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 12)

        return await prisma.user.create({
          data: {
            email: input.email,
            name: input.name,
            password: hashedPassword,
            role: input.role || 'user',
            isRegistered: input.isRegistered ?? true
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isRegistered: true,
            createdAt: true,
            updatedAt: true
          }
        })
      }, 'UserService.createUser')

      logger.info('User created successfully', { id: result.id, email: result.email })
      return result
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error
      }
      logger.error('Error creating user', { error, email: input.email })
      throw new DatabaseError('Failed to create user')
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(input: UserUpdateInput) {
    try {
      // Input validation
      if (!input?.id || typeof input.id !== 'string') {
        throw new ValidationError('Valid user ID is required')
      }

      if (input.email !== undefined && (!input.email || typeof input.email !== 'string' || !input.email.includes('@'))) {
        throw new ValidationError('Valid email format is required')
      }

      if (input.name !== undefined && (!input.name || typeof input.name !== 'string' || input.name.trim().length < 2)) {
        throw new ValidationError('Name must be at least 2 characters long')
      }

      if (input.password !== undefined && (!input.password || typeof input.password !== 'string' || input.password.length < 8)) {
        throw new ValidationError('Password must be at least 8 characters long')
      }

      logger.debug('Updating user', { id: input.id })

      // Check if user exists
      const existingUser = await withDatabaseError(async () => {
        return await prisma.user.findUnique({
          where: { id: input.id }
        })
      }, 'UserService.updateUser.findUser')

      if (!existingUser) {
        logger.warn('User not found for update', { id: input.id })
        throw new NotFoundError('User', input.id)
      }

      // Check if email is being changed and if it's already taken
      if (input.email && input.email !== existingUser.email) {
        const emailTaken = await withDatabaseError(async () => {
          return await prisma.user.findUnique({
            where: { email: input.email }
          })
        }, 'UserService.updateUser.checkEmail')

        if (emailTaken) {
          throw new ConflictError('Email already taken by another user')
        }
      }

      // Build update data
      const updateData: Record<string, unknown> = {}
      if (input.email !== undefined) updateData.email = input.email
      if (input.name !== undefined) updateData.name = input.name
      if (input.role !== undefined) updateData.role = input.role
      if (input.isRegistered !== undefined) updateData.isRegistered = input.isRegistered

      // Hash password if provided
      if (input.password) {
        updateData.password = await bcrypt.hash(input.password, 12)
      }

      const user = await withDatabaseError(async () => {
        return await prisma.user.update({
          where: { id: input.id },
          data: updateData,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isRegistered: true,
            createdAt: true,
            updatedAt: true
          }
        })
      }, 'UserService.updateUser')

      logger.info('User updated successfully', { id: input.id })
      return user
    } catch (error) {
      logger.error('Error updating user', { error, id: input.id })
      throw error instanceof Error ? error : new Error('Failed to update user')
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: string) {
    try {
      // Input validation
      if (!id || typeof id !== 'string') {
        throw new ValidationError('Valid user ID is required')
      }

      logger.debug('Deleting user', { id })

      // Check if user exists
      const existingUser = await withDatabaseError(async () => {
        return await prisma.user.findUnique({
          where: { id }
        })
      }, 'UserService.deleteUser.findUser')

      if (!existingUser) {
        logger.warn('User not found for deletion', { id })
        throw new NotFoundError('User', id)
      }

      // Prevent deletion of admin users
      if (existingUser.role === 'admin') {
        throw new ValidationError('Cannot delete admin users')
      }

      // Delete user and related data in transaction
      await withDatabaseError(async () => {
        return await prisma.$transaction(async (tx) => {
          // Delete user configurations and their options
          const userConfigurations = await tx.configuration.findMany({
            where: { userId: id },
            select: { id: true }
          })

          if (userConfigurations.length > 0) {
            const configIds = userConfigurations.map(config => config.id)

            // Delete configuration options
            await tx.configurationOption.deleteMany({
              where: { configurationId: { in: configIds } }
            })

            // Delete configurations
            await tx.configuration.deleteMany({
              where: { userId: id }
            })
          }

          // Delete the user
          await tx.user.delete({
            where: { id }
          })
        })
      }, 'UserService.deleteUser')

      logger.info('User deleted successfully', { id })
      return true
    } catch (error) {
      logger.error('Error deleting user', { error, id })
      throw error instanceof Error ? error : new Error('Failed to delete user')
    }
  }

  /**
   * Verify user password
   */
  static async verifyPassword(email: string, password: string) {
    try {
      logger.debug('Verifying user password', { email: email.substring(0, 3) + '***' })

      // Validate input
      if (!email?.trim()) {
        throw new ValidationError('Email is required')
      }
      if (!password?.trim()) {
        throw new ValidationError('Password is required')
      }

      const user = await withDatabaseError(async () => {
        return await this.getUserByEmail(email)
      }, 'UserService.verifyPassword')

      if (!user) {
        logger.warn('User not found during password verification', { email: email.substring(0, 3) + '***' })
        return null
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        logger.warn('Invalid password attempt', { email: email.substring(0, 3) + '***' })
        return null
      }

      logger.info('Password verified successfully', { id: user.id })
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isRegistered: user.isRegistered
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      logger.error('Error verifying password', { error })
      throw new DatabaseError('Failed to verify password')
    }
  }

  /**
   * Create or get demo user
   */
  static async createDemoUser(): Promise<DemoUserCreateResult> {
    try {
      logger.debug('Creating demo user')

      const timestamp = Date.now()
      const demoName = `Demo User ${timestamp}`
      const demoEmail = `demo_${timestamp}@carconfig.local`
      const sessionId = `session_${timestamp}`

      const user = await withDatabaseError(async () => {
        return await prisma.user.create({
          data: {
            email: demoEmail,
            name: demoName,
            password: await bcrypt.hash('demo', 8), // Weak password for demo
            role: 'user',
            isRegistered: false
          },
          select: {
            id: true,
            name: true
          }
        })
      }, 'UserService.createDemoUser')

      logger.info('Demo user created successfully', { id: user.id, name: user.name })
      return {
        id: user.id,
        name: user.name,
        sessionId
      }
    } catch (error) {
      logger.error('Error creating demo user', { error })
      throw new Error('Failed to create demo user')
    }
  }

  /**
   * Delete all demo users and their configurations
   */
  static async cleanupDemoUsers() {
    try {
      logger.debug('Cleaning up demo users')

      // Find all demo users
      const demoUsers = await prisma.user.findMany({
        where: { isRegistered: false },
        select: { id: true }
      })

      if (demoUsers.length === 0) {
        logger.info('No demo users found for cleanup')
        return {
          deletedUsers: 0,
          deletedConfigurations: 0,
          message: 'No demo users found'
        }
      }

      const userIds = demoUsers.map(user => user.id)

      // Get configurations to delete
      const configurationsToDelete = await prisma.configuration.findMany({
        where: { userId: { in: userIds } },
        select: { id: true }
      })

      const configurationIds = configurationsToDelete.map(config => config.id)

      // Delete in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Delete configuration options first
        if (configurationIds.length > 0) {
          await tx.configurationOption.deleteMany({
            where: { configurationId: { in: configurationIds } }
          })
        }

        // Delete configurations
        const deletedConfigurations = await tx.configuration.deleteMany({
          where: { userId: { in: userIds } }
        })

        // Delete demo users
        const deletedUsers = await tx.user.deleteMany({
          where: { isRegistered: false }
        })

        return {
          deletedUsers: deletedUsers.count,
          deletedConfigurations: deletedConfigurations.count
        }
      })

      logger.info('Demo users cleanup completed', result)
      return {
        ...result,
        message: `Deleted ${result.deletedUsers} demo users and ${result.deletedConfigurations} configurations`
      }
    } catch (error) {
      logger.error('Error cleaning up demo users', { error })
      throw new Error('Failed to cleanup demo users')
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics() {
    try {
      logger.debug('Fetching user statistics')

      const stats = await prisma.user.aggregate({
        _count: {
          id: true
        }
      })

      const registeredUsers = await prisma.user.count({
        where: { isRegistered: true }
      })

      const demoUsers = await prisma.user.count({
        where: { isRegistered: false }
      })

      const adminUsers = await prisma.user.count({
        where: { role: 'admin' }
      })

      const result = {
        totalUsers: stats._count.id,
        registeredUsers,
        demoUsers,
        adminUsers
      }

      logger.info('User statistics retrieved', result)
      return result
    } catch (error) {
      logger.error('Error fetching user statistics', { error })
      throw new Error('Failed to fetch user statistics')
    }
  }

  /**
   * Delete multiple users (bulk operation)
   */
  static async deleteUsers(userIds: string[]) {
    try {
      logger.debug('Bulk deleting users', { count: userIds.length })

      if (userIds.length === 0) {
        return { deletedCount: 0, errors: [] }
      }

      // Check for admin users in the list
      const adminUsers = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          role: 'admin'
        },
        select: { id: true, email: true }
      })

      if (adminUsers.length > 0) {
        const adminEmails = adminUsers.map(user => user.email).join(', ')
        throw new Error(`Cannot delete admin users: ${adminEmails}`)
      }

      const errors: string[] = []
      let deletedCount = 0

      // Delete users one by one to handle individual errors
      for (const userId of userIds) {
        try {
          await this.deleteUser(userId)
          deletedCount++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`User ${userId}: ${errorMessage}`)
          logger.warn('Failed to delete user in bulk operation', { userId, error: errorMessage })
        }
      }

      logger.info('Bulk user deletion completed', { deletedCount, errorCount: errors.length })
      return { deletedCount, errors }
    } catch (error) {
      logger.error('Error in bulk user deletion', { error, userIds })
      throw error instanceof Error ? error : new Error('Failed to delete users')
    }
  }
}
