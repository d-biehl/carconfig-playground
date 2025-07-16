import { execSync } from 'child_process'
import { resolve } from 'path'
import { vi, beforeAll, beforeEach, afterAll } from 'vitest'
import fs from 'fs'

export const setupTestDatabase = () => {
  // Create directory if it doesn't exist
  const dbDir = resolve(__dirname, 'prisma')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Use a consistent test database instead of random
  const testDbPath = resolve(__dirname, '../../../prisma/test.db')
  process.env.DATABASE_URL = `file:${testDbPath}`

  // Get the project root for running commands
  const projectRoot = resolve(__dirname, '../../..')

  try {
    // Only setup if the database doesn't exist or is empty
    if (!fs.existsSync(testDbPath)) {
      console.log('Setting up test database...')

      // Reset the test database
      execSync('npx prisma db push --force-reset --accept-data-loss', {
        stdio: 'pipe',
        cwd: projectRoot,
        env: { ...process.env, DATABASE_URL: `file:${testDbPath}` }
      })

      // Seed the test database
      execSync('npx tsx prisma/seed.ts', {
        stdio: 'pipe',
        cwd: projectRoot,
        env: { ...process.env, DATABASE_URL: `file:${testDbPath}` }
      })

      console.log('Test database setup complete.')
    }

    // Generate Prisma client
    execSync('npx prisma generate', {
      stdio: 'pipe',
      cwd: projectRoot
    })
  } catch (error) {
    console.error('Database setup failed:', error)
    throw error
  }
}

export const cleanupTestDatabase = async () => {
  try {
    const { prisma } = await import('@/lib/prisma')

    // Clean up all tables in the correct order (respecting foreign key constraints)
    await prisma.configurationOption.deleteMany()
    await prisma.configuration.deleteMany()
    await prisma.checkoutSession.deleteMany()
    await prisma.carOption.deleteMany()
    await prisma.optionConflict.deleteMany()
    await prisma.carTranslation.deleteMany()
    await prisma.optionTranslation.deleteMany()
    await prisma.option.deleteMany()
    await prisma.car.deleteMany()
    await prisma.user.deleteMany()

    await prisma.$disconnect()
  } catch (error) {
    // Ignore cleanup errors in tests
    console.warn('Database cleanup warning:', error instanceof Error ? error.message : String(error))
  }
}

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
    getAll: vi.fn(() => []),
    has: vi.fn(() => false),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    toString: vi.fn(() => ''),
    [Symbol.iterator]: vi.fn(),
  }),
  usePathname: () => '',
}))

// Mock fetch globally
global.fetch = vi.fn()

// Setup/cleanup hooks
beforeAll(async () => {
  setupTestDatabase()
})

beforeEach(async () => {
  vi.clearAllMocks()
  // Don't cleanup database for integration tests - they need seeded data
  // Only cleanup for unit tests that create their own test data
})

afterAll(async () => {
  await cleanupTestDatabase()
})
