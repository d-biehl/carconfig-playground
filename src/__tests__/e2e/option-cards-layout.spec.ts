import { test, expect } from '@playwright/test'

test.describe('Option Cards Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/configurator')

    // Wait for the page to load
    await page.waitForSelector('[data-testid^="car-card-"]')

    // Select a car to enter the configurator
    await page.click('[data-testid^="car-card-"]:first-child')

    // Wait for options to load
    await page.waitForSelector('.option-card', { timeout: 10000 })
  })

  test('option cards have consistent widths on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 })

    const optionCards = page.locator('.option-card')
    const cardCount = await optionCards.count()

    if (cardCount > 1) {
      // Get the width of all cards
      const cardWidths = []
      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const card = optionCards.nth(i)
        const boundingBox = await card.boundingBox()
        if (boundingBox) {
          cardWidths.push(boundingBox.width)
        }
      }

      // All cards should have the same width (within 5px tolerance)
      const firstWidth = cardWidths[0]
      for (const width of cardWidths) {
        expect(Math.abs(width - firstWidth)).toBeLessThan(5)
      }
    }
  })

  test('option cards fit viewport on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

    const optionCards = page.locator('.option-card')
    const cardCount = await optionCards.count()

    if (cardCount > 0) {
      // Check that cards don't overflow viewport
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = optionCards.nth(i)
        const boundingBox = await card.boundingBox()
        if (boundingBox) {
          // Card should not exceed viewport width (with some padding)
          expect(boundingBox.width).toBeLessThan(375 - 32) // 16px padding on each side
          // Card should have a reasonable minimum width
          expect(boundingBox.width).toBeGreaterThan(240)
        }
      }
    }
  })

  test('option cards fit viewport on iPhone XR', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 }) // iPhone XR

    const optionCards = page.locator('.option-card')
    const cardCount = await optionCards.count()

    if (cardCount > 0) {
      // Check that cards fit well on iPhone XR
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = optionCards.nth(i)
        const boundingBox = await card.boundingBox()
        if (boundingBox) {
          // Card should not exceed iPhone XR width (with padding)
          expect(boundingBox.width).toBeLessThan(414 - 32) // 16px padding on each side
          // Card should have a reasonable minimum width
          expect(boundingBox.width).toBeGreaterThan(260)
        }
      }
    }
  })

  test('option cards fit viewport on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }) // iPhone 5/SE

    const optionCards = page.locator('.option-card')
    const cardCount = await optionCards.count()

    if (cardCount > 0) {
      // Check that cards fit on very small screens
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = optionCards.nth(i)
        const boundingBox = await card.boundingBox()
        if (boundingBox) {
          // Card should not exceed viewport width (with padding)
          expect(boundingBox.width).toBeLessThan(320 - 32) // 16px padding on each side
          // Card should have a reasonable minimum width even on small screens
          expect(boundingBox.width).toBeGreaterThan(220)
        }
      }
    }
  })

  test('option cards have consistent internal layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const optionCards = page.locator('.option-card')
    const cardCount = await optionCards.count()

    if (cardCount > 0) {
      const firstCard = optionCards.first()

      // Check that the option-content exists and has proper layout
      await expect(firstCard.locator('.option-content')).toBeVisible()
      await expect(firstCard.locator('.option-left-content')).toBeVisible()
      await expect(firstCard.locator('.option-right-content')).toBeVisible()

      // Check that text content is properly contained
      const textContent = firstCard.locator('.option-text-content')
      if (await textContent.count() > 0) {
        await expect(textContent).toBeVisible()
      }
    }
  })

  test('option cards maintain minimum height', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const optionCards = page.locator('.option-card')
    const cardCount = await optionCards.count()

    if (cardCount > 0) {
      // Check that cards have a minimum height for consistent appearance
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = optionCards.nth(i)
        const boundingBox = await card.boundingBox()
        if (boundingBox) {
          // Minimum height should be around 120px as defined in CSS
          expect(boundingBox.height).toBeGreaterThan(100)
        }
      }
    }
  })
})
