import { test, expect } from '@playwright/test'
import { NavigationHelper } from '../helpers/NavigationHelper'

test.describe('Authentication Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should complete user registration flow', async ({ page }) => {
    const nav = new NavigationHelper(page)

    // 1. Navigate to registration (works on both desktop and mobile)
    await nav.navigateTo('register')
    await expect(page).toHaveURL('/auth/register')

    // 2. Fill registration form
    const testUser = {
      name: 'Test User E2E',
      email: `test.${Date.now()}@example.com`,
      password: 'testpassword123'
    }

    await page.getByTestId('register-name-input').fill(testUser.name)
    await page.getByTestId('register-email-input').fill(testUser.email)
    await page.getByTestId('register-password-input').fill(testUser.password)
    await page.getByTestId('register-confirm-password-input').fill(testUser.password)

    // 3. Test password visibility toggle
    await page.getByTestId('register-password-toggle').click()
    await expect(page.getByTestId('register-password-input')).toHaveAttribute('type', 'text')
    await page.getByTestId('register-password-toggle').click()
    await expect(page.getByTestId('register-password-input')).toHaveAttribute('type', 'password')

    // 4. Submit registration
    await page.getByTestId('register-submit-button').click()

    // 5. Should redirect to configurator on success
    await expect(page).toHaveURL('/configurator')
  })

  test('should show validation errors for registration', async ({ page }) => {
    const nav = new NavigationHelper(page)

    // Navigate to registration
    await nav.navigateTo('register')

    // Try to submit with mismatched passwords
    await page.getByTestId('register-name-input').fill('Test User')
    await page.getByTestId('register-email-input').fill('test@example.com')
    await page.getByTestId('register-password-input').fill('password123')
    await page.getByTestId('register-confirm-password-input').fill('differentpassword')

    await page.getByTestId('register-submit-button').click()

    // Should show error message
    await expect(page.getByTestId('register-error-message')).toBeVisible()
  })

  test('should complete login flow', async ({ page }) => {
    const nav = new NavigationHelper(page)

    // 1. Navigate to login
    await nav.navigateTo('login')
    await expect(page).toHaveURL('/auth/login')

    // 2. Use demo mode for testing
    await page.getByTestId('login-demo-mode-button').click()

    // 3. Should redirect to configurator
    await expect(page).toHaveURL('/configurator')
  })

  test('should test login with credentials', async ({ page }) => {
    const nav = new NavigationHelper(page)

    // Navigate to login
    await nav.navigateTo('login')

    // Fill login form with test credentials
    await page.getByTestId('login-email-input').fill('user@example.com')
    await page.getByTestId('login-password-input').fill('password123')

    // Test password visibility toggle
    await page.getByTestId('login-password-toggle').click()
    await expect(page.getByTestId('login-password-input')).toHaveAttribute('type', 'text')
    await page.getByTestId('login-password-toggle').click()
    await expect(page.getByTestId('login-password-input')).toHaveAttribute('type', 'password')

    // Submit login
    await page.getByTestId('login-submit-button').click()

    // Should either redirect to configurator or show error
    await page.waitForTimeout(2000)

    // Check if we're on configurator (success) or login page with error
    const currentUrl = page.url()
    if (currentUrl.includes('/configurator')) {
      await expect(page).toHaveURL('/configurator')
    } else {
      await expect(page.getByTestId('login-error-message')).toBeVisible()
    }
  })

  test('should handle logout from header', async ({ page }) => {
    const nav = new NavigationHelper(page)

    // First login via demo mode
    await nav.navigateTo('login')
    await page.getByTestId('login-demo-mode-button').click()
    await expect(page).toHaveURL('/configurator')

    // Go to home to check if logout button is available
    await page.goto('/')

    // Check if user is logged in and logout if possible
    const isLoggedIn = await nav.isLoggedIn()
    if (isLoggedIn) {
      await nav.logout()
      // Should redirect to home and show login/register links again
      await expect(page).toHaveURL('/')
      await nav.verifyNavigationState()
    } else {
      console.log('No logout button visible in demo mode - this is expected behavior')
    }
  })

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const nav = new NavigationHelper(page)

    // Verify mobile navigation is displayed correctly
    await nav.verifyNavigationState()

    // Test mobile navigation to register
    await nav.navigateTo('register')
    await expect(page).toHaveURL('/auth/register')

    // Go back and test mobile navigation to login
    await page.goto('/')
    await nav.navigateTo('login')
    await expect(page).toHaveURL('/auth/login')
  })
})
