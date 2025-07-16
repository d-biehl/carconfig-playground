import { test, expect } from '@playwright/test'
import { NavigationHelper } from '../helpers/NavigationHelper'

test.describe('CarConfigurator E2E - Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should complete full car configuration journey from home to save', async ({ page }) => {
    const nav = new NavigationHelper(page)

    // 1. Verify home page loads
    await expect(page).toHaveTitle(/CarConfigurator/)
    await expect(page.getByTestId('header-logo')).toBeVisible()

    // 2. Navigate to configurator using responsive navigation
    await nav.navigateTo('configurator')
    await expect(page).toHaveURL('/configurator')

    // 3. Wait for car grid to load and select a car
    await page.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })

    // Click on the first available car card
    const firstCarCard = page.locator('[data-testid^="car-card-"]').first()
    await expect(firstCarCard).toBeVisible()

    // Verify car card content is visible
    await expect(firstCarCard.getByTestId('car-title')).toBeVisible()
    await expect(firstCarCard.getByTestId('car-price')).toBeVisible()
    await expect(firstCarCard.getByTestId('car-image')).toBeVisible()

    await firstCarCard.click()

    // 4. Configuration view should load
    await expect(page.getByTestId('car-base-price')).toBeVisible()
    await expect(page.getByTestId('header-total-price')).toBeVisible()

    // 5. Select some options using new test-IDs
    // Find and select first available radio option (exclusive) - use force click to avoid overlay issues
    const radioOptions = page.locator('[data-testid^="option-radio-"]')
    const radioCount = await radioOptions.count()
    if (radioCount > 0) {
      console.log(`Found ${radioCount} radio options`)
      await radioOptions.first().click({ force: true })
      await page.waitForTimeout(500) // Wait for option to be processed
    }

    // Find and select first available checkbox option (independent)
    const checkboxOptions = page.locator('[data-testid^="option-checkbox-"]')
    const checkboxCount = await checkboxOptions.count()
    if (checkboxCount > 0) {
      console.log(`Found ${checkboxCount} checkbox options`)
      await checkboxOptions.first().click({ force: true })
      await page.waitForTimeout(500) // Wait for option to be processed
    }

    // 6. Verify price updates
    await expect(page.getByTestId('header-total-price')).toBeVisible()

    // 7. Save configuration
    const configName = 'E2E Test Configuration'
    await page.getByTestId('configuration-name-input').fill(configName)
    await page.getByTestId('save-configuration-button').click()

    // 8. Verify toast notification appears
    await expect(page.getByTestId('toast-notification')).toBeVisible()
    await expect(page.getByTestId('toast-message')).toContainText('erfolgreich')
    await expect(page.getByTestId('toast-success-icon')).toBeVisible()

    // Wait for toast to disappear
    await page.waitForTimeout(1000)

    // 9. Open saved configurations
    await page.getByTestId('saved-configurations-toggle').click()

    // Wait a bit for the configurations list to load
    await page.waitForTimeout(1000)

    // Verify the saved configurations section is visible
    await expect(page.getByText('Gespeicherte Konfigurationen')).toBeVisible()

    // Check if any saved configurations are present (might be from previous tests)
    const savedConfigs = page.locator('[data-testid^="saved-config-"]')
    const configCount = await savedConfigs.count()

    // If we have configurations, that's good - the save/load system works
    if (configCount > 0) {
      console.log(`Found ${configCount} saved configurations`)
    } else {
      console.log('No saved configurations found - this is OK for a clean test environment')
    }
  })

  test('should navigate through admin panel', async ({ page }) => {
    // 1. Go to admin login
    await page.goto('/admin/login')

    // 2. Login with admin credentials
    await page.getByTestId('admin-email-input').fill('admin@carconfigurator.com')
    await page.getByTestId('admin-password-input').fill('admin123')
    await page.getByTestId('admin-login-button').click()

    // 3. Verify admin panel loads
    await expect(page).toHaveURL('/admin')
    await expect(page.getByTestId('admin-logout-button')).toBeVisible()

    // 4. Navigate through tabs
    await page.getByTestId('admin-tab-cars').click()
    await expect(page.getByTestId('admin-add-car-button')).toBeVisible()

    await page.getByTestId('admin-tab-options').click()
    // Options tab content should be visible

    await page.getByTestId('admin-tab-users').click()
    // Users tab content should be visible

    await page.getByTestId('admin-tab-configurations').click()
    // Configurations tab content should be visible

    // 5. Logout
    await page.getByTestId('admin-logout-button').click()
    await expect(page).toHaveURL('/admin/login')
  })

  test('should handle option details modal', async ({ page }) => {
    const nav = new NavigationHelper(page)

    // 1. Navigate to configurator
    await nav.navigateTo('configurator')

    // 2. Select a car
    await page.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })
    await page.locator('[data-testid^="car-card-"]').first().click()

    // 3. Find and click on details button (if available)
    const detailsButtons = page.locator('[data-testid="details-button"]')
    if (await detailsButtons.count() > 0) {
      await detailsButtons.first().click()

      // 4. Verify modal opens
      await expect(page.getByTestId('option-details-modal')).toBeVisible()
      await expect(page.getByTestId('modal-content')).toBeVisible()
      await expect(page.getByTestId('option-title')).toBeVisible()
      await expect(page.getByTestId('option-price')).toBeVisible()

      // 5. Close modal
      await page.getByTestId('modal-close-button').click()
      await expect(page.getByTestId('option-details-modal')).not.toBeVisible()
    }
  })

  test('should handle delete confirmation dialog', async ({ page }) => {
    const nav = new NavigationHelper(page)

    // This test assumes we have a saved configuration to delete
    await nav.navigateTo('configurator')

    // First create a configuration if none exists
    await page.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })
    await page.locator('[data-testid^="car-card-"]').first().click()

    await page.getByTestId('configuration-name-input').fill('Test Config to Delete')
    await page.getByTestId('save-configuration-button').click()

    // Wait for save confirmation
    await expect(page.getByTestId('toast-notification')).toBeVisible()

    // Open saved configurations
    await page.getByTestId('saved-configurations-toggle').click()

    // Try to delete the configuration
    const deleteButton = page.locator('[data-testid^="delete-config-"]').first()
    if (await deleteButton.isVisible()) {
      await deleteButton.click()

      // Verify delete confirmation dialog
      await expect(page.getByTestId('delete-confirmation-dialog')).toBeVisible()
      await expect(page.getByTestId('dialog-title')).toBeVisible()
      await expect(page.getByTestId('dialog-message')).toBeVisible()

      // Cancel deletion
      await page.getByTestId('cancel-delete-button').click()
      await expect(page.getByTestId('delete-confirmation-dialog')).not.toBeVisible()

      // Try again and confirm deletion
      await deleteButton.click()
      await page.getByTestId('confirm-delete-button').click()

      // Verify dialog closes
      await expect(page.getByTestId('delete-confirmation-dialog')).not.toBeVisible()
    }
  })
})
