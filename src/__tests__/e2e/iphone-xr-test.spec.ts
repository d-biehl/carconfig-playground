import { test, expect } from '@playwright/test'

test.describe('iPhone XR Responsive Test', () => {
  test('should display configurator correctly on iPhone XR', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 414, height: 896 }, // iPhone XR dimensions
      deviceScaleFactor: 2,
      hasTouch: true
      // Remove isMobile for Firefox compatibility
    })

    const page = await context.newPage()
    await page.goto('/configurator')

    // Wait for page to load
    await page.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })

    // Select first car
    const firstCard = page.locator('[data-testid^="car-card-"]').first()
    await firstCard.click()

    // Wait for options to load
    await page.waitForTimeout(1000)

    // Check if options are properly sized for iPhone XR
    const optionCards = page.locator('.group.relative.border-2.rounded-xl')
    const firstOption = optionCards.first()

    if (await firstOption.isVisible()) {
      const cardBox = await firstOption.boundingBox()
      console.log('Option card dimensions:', cardBox)

      // Check if the card fits within iPhone XR width (414px - some margin)
      expect(cardBox?.width).toBeLessThanOrEqual(390) // Allow for some padding

      // Check option selector size
      const optionSelector = page.locator('[data-testid^="option-radio-"], [data-testid^="option-checkbox-"]').first()
      if (await optionSelector.isVisible()) {
        const selectorBox = await optionSelector.boundingBox()
        console.log('Option selector dimensions:', selectorBox)

        // Should still be touch-friendly (44px)
        expect(selectorBox?.width).toBeGreaterThanOrEqual(44)
        expect(selectorBox?.height).toBeGreaterThanOrEqual(44)
      }

      // Check text is readable (not too small)
      const optionTitle = page.locator('h5.font-semibold').first()
      if (await optionTitle.isVisible()) {
        const fontSize = await optionTitle.evaluate(el =>
          window.getComputedStyle(el).fontSize
        )
        console.log('Option title font size:', fontSize)

        // Should be at least 14px for readability
        const fontSizeNum = parseFloat(fontSize)
        expect(fontSizeNum).toBeGreaterThanOrEqual(14)
      }

      // Check price display is not cut off
      const priceSpan = page.locator('span.font-bold').first()
      if (await priceSpan.isVisible()) {
        const priceBox = await priceSpan.boundingBox()
        console.log('Price display dimensions:', priceBox)

        // Price should fit within the card
        expect(priceBox?.x).toBeGreaterThan(0)
      }
    }

    await context.close()
  })

  test('should handle mobile navigation on iPhone XR', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 414, height: 896 }, // iPhone XR dimensions
      deviceScaleFactor: 2,
      hasTouch: true
      // Remove isMobile for Firefox compatibility
    })

    const page = await context.newPage()
    await page.goto('/')

    // Mobile menu button should be visible
    const mobileMenuButton = page.getByTestId('mobile-menu-button')
    await expect(mobileMenuButton).toBeVisible()

    // Check touch target size
    const buttonBox = await mobileMenuButton.boundingBox()
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44)
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44)

    // Test navigation
    await mobileMenuButton.click()
    await expect(page.getByTestId('mobile-nav-configurator')).toBeVisible()

    await page.getByTestId('mobile-nav-configurator').click()
    await expect(page).toHaveURL('/configurator')

    await context.close()
  })
})
