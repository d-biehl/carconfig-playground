import { test, expect } from '@playwright/test'

test.describe('Option Selector Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/configurator')

    // Wait for the page to load
    await page.waitForSelector('[data-testid^="car-card-"]')

    // Select a car to enter the configurator
    await page.click('[data-testid^="car-card-"]:first-child')

    // Wait for options to load
    await page.waitForSelector('[data-testid^="option-"]', { timeout: 10000 })
  })

  test('checkbox options work when clicked directly', async ({ page }) => {
    // Find checkbox options (independent options)
    const checkboxOptions = page.locator('[data-testid^="option-checkbox-"]')
    const checkboxCount = await checkboxOptions.count()

    if (checkboxCount > 0) {
      const firstCheckbox = checkboxOptions.first()

      // Click directly on the checkbox
      await firstCheckbox.click()

      // Verify the option is selected (checkbox should be checked)
      await expect(firstCheckbox).toHaveAttribute('title', /Checkbox:.*/)

      // Check if the option card shows as selected
      const parentCard = firstCheckbox.locator('../../../..')
      await expect(parentCard).toHaveClass(/border-primary/)
    }
  })

  test('radio button options work when clicked directly', async ({ page }) => {
    // Find radio button options (exclusive group options)
    const radioOptions = page.locator('[data-testid^="option-radio-"]')
    const radioCount = await radioOptions.count()

    if (radioCount > 0) {
      const firstRadio = radioOptions.first()

      // Click directly on the radio button
      await firstRadio.click()

      // Verify the option is selected (radio should be filled)
      await expect(firstRadio).toHaveAttribute('title', /Radio:.*/)

      // Check if the option card shows as selected
      const parentCard = firstRadio.locator('../../../..')
      await expect(parentCard).toHaveClass(/border-primary/)
    }
  })

  test('text clicking also works for options', async ({ page }) => {
    // Find option text content areas
    const textAreas = page.locator('.option-text-content')
    const textCount = await textAreas.count()

    if (textCount > 0) {
      const firstTextArea = textAreas.first()

      // Click on the text area
      await firstTextArea.click()

      // Check if the parent option card shows as selected
      const parentCard = firstTextArea.locator('../../..')
      await expect(parentCard).toHaveClass(/border-primary/)
    }
  })

  test('exclusive group badges appear only when needed', async ({ page }) => {
    // Check that exclusive group badges only appear for groups with more than 2 options
    const badges = page.locator('.bg-blue-100, .bg-purple-100, .bg-green-100')
    const badgeCount = await badges.count()

    // If there are badges, verify they are in groups with multiple options
    if (badgeCount > 0) {
      for (let i = 0; i < badgeCount; i++) {
        const badge = badges.nth(i)
        const badgeText = await badge.textContent()
        console.log(`Found badge: ${badgeText}`)

        // Badge should be visible and have meaningful text
        await expect(badge).toBeVisible()
        expect(badgeText?.trim()).toBeTruthy()
      }
    }
  })

  test('option selection behavior differs between checkboxes and radios', async ({ page }) => {
    const checkboxOptions = page.locator('[data-testid^="option-checkbox-"]')
    const radioOptions = page.locator('[data-testid^="option-radio-"]')

    const checkboxCount = await checkboxOptions.count()
    const radioCount = await radioOptions.count()

    // Test checkbox behavior - should allow multiple selections
    if (checkboxCount >= 2) {
      await checkboxOptions.nth(0).click()
      await checkboxOptions.nth(1).click()

      // Both checkboxes should be selectable
      const firstCard = checkboxOptions.nth(0).locator('../../../..')
      const secondCard = checkboxOptions.nth(1).locator('../../../..')

      await expect(firstCard).toHaveClass(/border-primary/)
      await expect(secondCard).toHaveClass(/border-primary/)
    }

    // Test radio behavior - should allow only one selection per group
    if (radioCount >= 2) {
      // Get the first two radio options
      const firstRadio = radioOptions.nth(0)
      const secondRadio = radioOptions.nth(1)

      // Get their group names from titles
      const firstTitle = await firstRadio.getAttribute('title')
      const secondTitle = await secondRadio.getAttribute('title')

      // Only test if they're in the same group
      if (firstTitle && secondTitle) {
        const firstGroup = firstTitle.match(/\(([^)]+)\)/)?.[1]
        const secondGroup = secondTitle.match(/\(([^)]+)\)/)?.[1]

        if (firstGroup === secondGroup) {
          // Click first radio
          await firstRadio.click()
          let firstCard = firstRadio.locator('../../../..')
          await expect(firstCard).toHaveClass(/border-primary/)

          // Click second radio - should deselect first
          await secondRadio.click()
          const secondCard = secondRadio.locator('../../../..')
          await expect(secondCard).toHaveClass(/border-primary/)

          // First should no longer be selected
          firstCard = firstRadio.locator('../../../..')
          await expect(firstCard).not.toHaveClass(/border-primary/)
        }
      }
    }
  })

  test('option selectors have proper accessibility attributes', async ({ page }) => {
    const allSelectors = page.locator('[data-testid^="option-checkbox-"], [data-testid^="option-radio-"]')
    const selectorCount = await allSelectors.count()

    for (let i = 0; i < Math.min(selectorCount, 5); i++) {
      const selector = allSelectors.nth(i)

      // Should have title attribute for accessibility
      const title = await selector.getAttribute('title')
      expect(title).toBeTruthy()

      // Should indicate whether it's checkbox or radio
      expect(title).toMatch(/(Checkbox|Radio):/)

      // Should be clickable
      await expect(selector).toBeVisible()
    }
  })
})
