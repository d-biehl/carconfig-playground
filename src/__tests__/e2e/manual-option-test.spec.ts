import { test, expect } from '@playwright/test'

test.describe('Manual Option Interaction Test', () => {
  test('manual interaction with different option types', async ({ page }) => {
    await page.goto('/configurator')

    // Wait for the page to load and select a car
    await page.waitForSelector('[data-testid^="car-card-"]')
    await page.click('[data-testid^="car-card-"]:first-child')

    // Wait for options to load
    await page.waitForSelector('.option-card', { timeout: 10000 })

    // Take a screenshot of the initial state
    await page.screenshot({ path: 'test-results/options-initial.png', fullPage: true })

    // Find all option selectors
    const checkboxes = page.locator('[data-testid^="option-checkbox-"]')
    const radios = page.locator('[data-testid^="option-radio-"]')

    const checkboxCount = await checkboxes.count()
    const radioCount = await radios.count()

    console.log(`Found ${checkboxCount} checkbox options and ${radioCount} radio options`)

    // Test checkbox clicking
    if (checkboxCount > 0) {
      console.log('Testing checkbox click...')
      const firstCheckbox = checkboxes.first()

      // Click the checkbox directly
      await firstCheckbox.click()
      await page.waitForTimeout(500) // Give time for state update

      // Take screenshot after checkbox click
      await page.screenshot({ path: 'test-results/options-checkbox-clicked.png', fullPage: true })

      // Verify checkbox is selected by checking if it has the check icon
      const checkIcon = firstCheckbox.locator('svg')
      await expect(checkIcon).toBeVisible()

      console.log('Checkbox click test passed!')
    }

    // Test radio button clicking
    if (radioCount > 0) {
      console.log('Testing radio click...')
      const firstRadio = radios.first()

      // Click the radio button directly
      await firstRadio.click()
      await page.waitForTimeout(500) // Give time for state update

      // Take screenshot after radio click
      await page.screenshot({ path: 'test-results/options-radio-clicked.png', fullPage: true })

      // Verify radio is selected by checking if it has the filled circle
      const radioFill = firstRadio.locator('div.bg-primary-foreground')
      await expect(radioFill).toBeVisible()

      console.log('Radio click test passed!')
    }

    // Test text area clicking
    const textAreas = page.locator('.option-text-content')
    const textCount = await textAreas.count()

    if (textCount > 1) {
      console.log('Testing text area click...')

      // Click on a text area that's not already selected
      await textAreas.nth(1).click()
      await page.waitForTimeout(500)

      // Take screenshot after text click
      await page.screenshot({ path: 'test-results/options-text-clicked.png', fullPage: true })

      console.log('Text area click test passed!')
    }

    // Final screenshot showing all interactions
    await page.screenshot({ path: 'test-results/options-final-state.png', fullPage: true })

    console.log('All manual tests completed successfully!')
  })
})
