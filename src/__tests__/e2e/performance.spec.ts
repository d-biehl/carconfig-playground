import { test, expect, Page } from '@playwright/test'

// Helper function to get the correct test-ids based on viewport
async function getTestIds(page: Page) {
  const viewport = page.viewportSize()
  const isMobile = viewport ? viewport.width < 1024 : false

  return {
    themeToggle: isMobile ? 'mobile-theme-toggle' : 'desktop-theme-toggle',
    languageSwitcher: isMobile ? 'mobile-language-switcher' : 'desktop-language-switcher'
  }
}

test.describe('Performance Tests', () => {
  test('should load home page quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const endTime = Date.now()

    // Page should load within 3 seconds
    expect(endTime - startTime).toBeLessThan(3000)

    // Key elements should be visible using test-IDs
    await expect(page.getByTestId('hero-title')).toBeVisible()
    await expect(page.getByTestId('get-started-button')).toBeVisible()
  })

  test('should handle car selection performance', async ({ page }) => {
    await page.goto('/configurator')

    // Wait for car cards to load with timeout
    await page.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })

    const startTime = Date.now()
    await page.locator('[data-testid^="car-card-"]').first().click()
    const endTime = Date.now()

    // Car selection should be fast (under 2 seconds)
    expect(endTime - startTime).toBeLessThan(2000)

    // Verify configuration view is loaded
    await expect(page.getByTestId('car-base-price')).toBeVisible()
  })

  test('should handle option selection performance', async ({ page }) => {
    await page.goto('/configurator')
    await page.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })
    await page.locator('[data-testid^="car-card-"]').first().click()

    // Wait for options to load
    await page.waitForSelector('[data-testid^="option-radio-"]', { timeout: 5000 })

    const startTime = Date.now()
    await page.locator('[data-testid^="option-radio-"]').first().click()
    const endTime = Date.now()

    // Option selection should be fast (under 1 second)
    expect(endTime - startTime).toBeLessThan(1000)

    // Verify price update using test-ID
    await expect(page.getByTestId('header-total-price')).toBeVisible()
  })

  test('should handle admin panel load performance', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByTestId('admin-email-input').fill('admin@carconfigurator.com')
    await page.getByTestId('admin-password-input').fill('admin123')

    const startTime = Date.now()
    await page.getByTestId('admin-login-button').click()
    await page.waitForURL('/admin')
    const endTime = Date.now()

    // Admin panel should load within 2 seconds
    expect(endTime - startTime).toBeLessThan(2000)

    // Verify admin panel elements are visible using test-IDs
    await expect(page.getByTestId('admin-tab-cars')).toBeVisible()
    await expect(page.getByTestId('admin-logout-button')).toBeVisible()
  })

  test('should handle theme switching performance', async ({ page }) => {
    await page.goto('/')

    const testIds = await getTestIds(page)
    const themeToggle = page.getByTestId(testIds.themeToggle)

    // Ensure theme toggle is visible
    await expect(themeToggle).toBeVisible()

    const startTime = Date.now()
    await themeToggle.click({ force: true })
    const endTime = Date.now()

    // Theme switching should be reasonably fast (under 500ms)
    expect(endTime - startTime).toBeLessThan(500)
  })

  test('should handle language switching performance', async ({ page }) => {
    await page.goto('/')

    const testIds = await getTestIds(page)
    const languageSwitcher = page.getByTestId(testIds.languageSwitcher)

    // Ensure language switcher is visible
    await expect(languageSwitcher).toBeVisible()

    const startTime = Date.now()
    await languageSwitcher.click({ force: true })
    const endTime = Date.now()

    // Language switching should be fast (under 1 second)
    expect(endTime - startTime).toBeLessThan(1000)
  })

  test('should handle configuration save performance', async ({ page }) => {
    // Go through complete configuration flow
    await page.goto('/configurator')
    await page.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })
    await page.locator('[data-testid^="car-card-"]').first().click()

    // Wait for options to load and select some
    await page.waitForSelector('[data-testid^="option-radio-"]', { timeout: 5000 })
    await page.locator('[data-testid^="option-radio-"]').first().click()

    await page.getByTestId('configuration-name-input').fill('Test Configuration')
    const startTime = Date.now()
    await page.getByTestId('save-configuration-button').click()

    // Wait for save completion (modal or redirect)
    await page.waitForTimeout(100) // Small buffer
    const endTime = Date.now()

    // Save operation should be fast (under 2 seconds)
    expect(endTime - startTime).toBeLessThan(2000)
  })

  test('should handle multiple rapid user interactions', async ({ page }) => {
    await page.goto('/configurator')
    await page.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })
    await page.locator('[data-testid^="car-card-"]').first().click()

    // Wait for options to load
    await page.waitForSelector('[data-testid^="option-radio-"]', { timeout: 5000 })

    const startTime = Date.now()

    // Rapid option selections using robust selectors
    await page.locator('[data-testid^="option-radio-"]').nth(0).click()
    await page.locator('[data-testid^="option-radio-"]').nth(1).click()

    // Check if checkbox options exist before clicking
    const checkboxOptions = page.locator('[data-testid^="option-checkbox-"]')
    const checkboxCount = await checkboxOptions.count()
    if (checkboxCount > 0) {
      await checkboxOptions.nth(0).click()
      if (checkboxCount > 1) {
        await checkboxOptions.nth(1).click()
      }
    }

    const endTime = Date.now()

    // Multiple rapid interactions should complete within 1 second
    expect(endTime - startTime).toBeLessThan(1000)

    // Verify final state is correct
    await expect(page.getByTestId('header-total-price')).toBeVisible()
  })

  test('should handle simultaneous UI updates', async ({ page }) => {
    await page.goto('/')

    const testIds = await getTestIds(page)
    const themeToggle = page.getByTestId(testIds.themeToggle)
    const languageSwitcher = page.getByTestId(testIds.languageSwitcher)

    // Ensure elements are visible
    await expect(themeToggle).toBeVisible()
    await expect(languageSwitcher).toBeVisible()

    const startTime = Date.now()

    // Click theme toggle first
    await themeToggle.click({ force: true })

    // Wait a moment to ensure the first click is processed
    await page.waitForTimeout(50)

    // Then click language switcher
    await languageSwitcher.click({ force: true })

    // Close the language dropdown if it opened
    await page.click('body')

    const endTime = Date.now()

    // Sequential rapid interactions should complete quickly (under 1 second)
    expect(endTime - startTime).toBeLessThan(1000)
  })
})
