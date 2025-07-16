import { test, expect } from '@playwright/test'

test.describe('Details Button Text Test', () => {
  test('should show correct button text on different screen sizes', async ({ browser }) => {
    // Test mobile (iPhone XR size)
    const mobileContext = await browser.newContext({
      viewport: { width: 414, height: 896 },
      deviceScaleFactor: 2,
      hasTouch: true
      // Remove isMobile for Firefox compatibility
    })

    const mobilePage = await mobileContext.newPage()
    await mobilePage.goto('/configurator')

    // Wait for page to load and select a car
    await mobilePage.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })
    const firstCard = mobilePage.locator('[data-testid^="car-card-"]').first()
    await firstCard.click()

    // Wait for options to load
    await mobilePage.waitForTimeout(1000)

    // Check for detail buttons
    const detailButton = mobilePage.locator('[data-testid="details-button"]').first()
    if (await detailButton.isVisible()) {
      const buttonText = await detailButton.textContent()
      console.log('Mobile button text:', buttonText?.trim())

      // On mobile (< 640px), should show "Details" not "Info"
      expect(buttonText?.trim()).toBe('Details')
    }

    await mobileContext.close()

    // Test desktop
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    })

    const desktopPage = await desktopContext.newPage()
    await desktopPage.goto('/configurator')

    // Wait for page to load and select a car
    await desktopPage.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })
    const firstDesktopCard = desktopPage.locator('[data-testid^="car-card-"]').first()
    await firstDesktopCard.click()

    // Wait for options to load
    await desktopPage.waitForTimeout(1000)

    // Check for detail buttons
    const desktopDetailButton = desktopPage.locator('[data-testid="details-button"]').first()
    if (await desktopDetailButton.isVisible()) {
      const desktopButtonText = await desktopDetailButton.textContent()
      console.log('Desktop button text:', desktopButtonText?.trim())

      // On desktop (>= 640px), should show full "Details" text
      expect(desktopButtonText?.trim()).toBe('Details')
    }

    await desktopContext.close()
  })
})
