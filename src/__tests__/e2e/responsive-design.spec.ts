import { test, expect, devices } from '@playwright/test'

test.describe('Responsive Design Tests', () => {

  test.describe('Homepage Responsive Layout', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Check hero section responsive layout
      const heroTitle = page.getByTestId('hero-title')
      await expect(heroTitle).toBeVisible()

      // Check that feature cards stack vertically on mobile
      const featureCards = page.locator('[data-testid^="feature-card-"]')
      if (await featureCards.count() > 0) {
        // Verify cards are stacked (each on its own row)
        const firstCard = featureCards.first()
        const secondCard = featureCards.nth(1)

        if (await secondCard.isVisible()) {
          const firstCardBox = await firstCard.boundingBox()
          const secondCardBox = await secondCard.boundingBox()

          // Second card should be below the first (higher y position)
          expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y || 0)
        }
      }

      // Check mobile-friendly button sizes
      const ctaButtons = page.locator('[data-testid="cta-configure"], [data-testid="cta-explore"]')
      for (let i = 0; i < await ctaButtons.count(); i++) {
        const button = ctaButtons.nth(i)
        const buttonBox = await button.boundingBox()
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44) // iOS minimum touch target
      }
    })

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/')

      // Check that layout adapts to tablet size
      const heroTitle = page.getByTestId('hero-title')
      await expect(heroTitle).toBeVisible()

      // Check car cards grid on tablet
      const carCards = page.locator('[data-testid^="car-card-"]')
      if (await carCards.count() >= 2) {
        const firstCard = carCards.first()
        const secondCard = carCards.nth(1)

        const firstCardBox = await firstCard.boundingBox()
        const secondCardBox = await secondCard.boundingBox()

        // On tablet, cards should be side by side (similar y position)
        const yDifference = Math.abs((secondCardBox?.y || 0) - (firstCardBox?.y || 0))
        expect(yDifference).toBeLessThan(50) // Allow some margin for alignment
      }
    })

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('/')

      // Check desktop layout
      const heroTitle = page.getByTestId('hero-title')
      await expect(heroTitle).toBeVisible()

      // Desktop should show full navigation
      await expect(page.getByTestId('nav-configurator')).toBeVisible()
      await expect(page.getByTestId('mobile-menu-button')).toBeHidden()
    })
  })

  test.describe('Configurator Responsive Layout', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/configurator')

      // Should be able to select cars on mobile
      await page.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })
      const carCards = page.locator('[data-testid^="car-card-"]')

      if (await carCards.count() > 0) {
        // Verify car cards are touch-friendly
        const firstCard = carCards.first()
        const cardBox = await firstCard.boundingBox()
        expect(cardBox?.height).toBeGreaterThanOrEqual(200) // Reasonable touch target for cards

        // Test car selection
        await firstCard.click()

        // Should load configuration view
        await expect(page.getByTestId('car-base-price')).toBeVisible()
      }
    })

    test('should adapt option layout on different screen sizes', async ({ page }) => {
      await page.goto('/configurator')

      // Wait for car cards to load
      await page.waitForSelector('[data-testid^="car-card-"]', { timeout: 10000 })

      // Select first car
      const firstCard = page.locator('[data-testid^="car-card-"]').first()
      await firstCard.click()

      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(500) // Allow layout to adjust

      // Options should be visible and scrollable
      const optionSelectors = page.locator('[data-testid^="option-radio-"], [data-testid^="option-checkbox-"]')
      if (await optionSelectors.count() > 0) {
        const firstOption = optionSelectors.first()
        await expect(firstOption).toBeVisible()

        // Option should be touch-friendly (44px minimum for mobile touch targets)
        const optionBox = await firstOption.boundingBox()
        expect(optionBox?.height).toBeGreaterThanOrEqual(44)
        expect(optionBox?.width).toBeGreaterThanOrEqual(44)
      }

      // Test tablet layout
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.waitForTimeout(500)

      // Should still be usable on tablet
      if (await optionSelectors.count() > 0) {
        await expect(optionSelectors.first()).toBeVisible()
      }

      // Test desktop layout
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.waitForTimeout(500)

      // Should show optimal layout on desktop
      if (await optionSelectors.count() > 0) {
        await expect(optionSelectors.first()).toBeVisible()
      }
    })
  })

  test.describe('Touch and Interaction Tests', () => {
    test('should handle touch interactions correctly', async ({ browser, browserName }) => {
      // Skip device emulation for Firefox as it doesn't support isMobile
      const contextOptions = browserName === 'firefox'
        ? { viewport: { width: 375, height: 667 }, hasTouch: true }
        : { ...devices['iPhone 12'] }

      const context = await browser.newContext(contextOptions)
      const mobilePage = await context.newPage()
      await mobilePage.goto('/')

      // Test mobile navigation touch
      const mobileMenuButton = mobilePage.getByTestId('mobile-menu-button')
      await expect(mobileMenuButton).toBeVisible()

      // Test touch target size
      const buttonBox = await mobileMenuButton.boundingBox()
      expect(buttonBox?.width).toBeGreaterThanOrEqual(44)
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44)

      // Test touch interaction - use click for Firefox as tap needs special setup
      if (browserName === 'firefox') {
        await mobileMenuButton.click()
      } else {
        await mobileMenuButton.tap()
      }

      // Menu should open
      await expect(mobilePage.getByTestId('mobile-nav-configurator')).toBeVisible()

      // Test touch navigation
      if (browserName === 'firefox') {
        await mobilePage.getByTestId('mobile-nav-configurator').click()
      } else {
        await mobilePage.getByTestId('mobile-nav-configurator').tap()
      }
      await expect(mobilePage).toHaveURL('/configurator')

      await context.close()
    })

    test('should handle swipe and scroll gestures', async ({ browser, browserName }) => {
      // Skip device emulation for Firefox as it doesn't support isMobile
      const contextOptions = browserName === 'firefox'
        ? { viewport: { width: 375, height: 667 }, hasTouch: true }
        : { ...devices['iPhone 12'] }

      const context = await browser.newContext(contextOptions)
      const mobilePage = await context.newPage()
      await mobilePage.goto('/')

      // Test scrolling through page content
      await mobilePage.evaluate(() => window.scrollTo(0, 200))
      await mobilePage.waitForTimeout(500)

      // Should still be able to interact with elements after scrolling
      const mobileMenuButton = mobilePage.getByTestId('mobile-menu-button')
      await expect(mobileMenuButton).toBeVisible()

      await context.close()

      // Test footer visibility after scrolling to bottom - create new context for this test
      const contextOptions2 = browserName === 'firefox'
        ? { viewport: { width: 375, height: 667 }, hasTouch: true }
        : { ...devices['iPhone 12'] }

      const context2 = await browser.newContext(contextOptions2)
      const scrollPage = await context2.newPage()
      await scrollPage.goto('/')
      await scrollPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await scrollPage.waitForTimeout(500)

      // Footer should be visible
      const footerElements = scrollPage.locator('footer')
      await expect(footerElements.first()).toBeVisible()

      await context2.close()
    })
  })

  test.describe('Text and Content Scaling', () => {
    test('should scale text appropriately on different screen sizes', async ({ page }) => {
      await page.goto('/')

      // Test mobile text scaling
      await page.setViewportSize({ width: 375, height: 667 })
      const heroTitle = page.getByTestId('hero-title')
      await expect(heroTitle).toBeVisible()

      // Get computed font size on mobile
      const mobileFontSize = await heroTitle.evaluate(el =>
        window.getComputedStyle(el).fontSize
      )

      // Test desktop text scaling
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.waitForTimeout(200) // Allow layout to adjust

      const desktopFontSize = await heroTitle.evaluate(el =>
        window.getComputedStyle(el).fontSize
      )

      // Desktop font should be larger than mobile
      const mobileSize = parseInt(mobileFontSize)
      const desktopSize = parseInt(desktopFontSize)
      expect(desktopSize).toBeGreaterThan(mobileSize)
    })
  })
})
