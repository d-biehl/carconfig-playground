import { test, expect } from '@playwright/test'

test.describe('Responsive Navigation Tests', () => {
  test.describe('Desktop Navigation', () => {
    test('should navigate using desktop header navigation', async ({ page }) => {
      // Set desktop viewport size to ensure desktop navigation is shown
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('/')

      // Desktop navigation should be visible
      await expect(page.getByTestId('nav-configurator')).toBeVisible()
      await expect(page.getByTestId('nav-login')).toBeVisible()
      await expect(page.getByTestId('nav-register')).toBeVisible()

      // Mobile menu button should be hidden on desktop
      await expect(page.getByTestId('mobile-menu-button')).toBeHidden()

      // Navigate using desktop nav
      await page.getByTestId('nav-configurator').click()
      await expect(page).toHaveURL('/configurator')
    })
  })

  test.describe('Mobile Navigation', () => {
    test('should navigate using mobile hamburger menu', async ({ page }) => {
      // Set mobile viewport size instead of using device presets
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Desktop navigation should be hidden on mobile
      await expect(page.getByTestId('nav-configurator')).toBeHidden()

      // Mobile menu button should be visible
      await expect(page.getByTestId('mobile-menu-button')).toBeVisible()

      // Open mobile menu
      await page.getByTestId('mobile-menu-button').click({ force: true })

      // Wait for mobile menu animation to complete (WebKit needs extra time)
      await page.waitForTimeout(100)

      // Mobile navigation items should be visible
      await expect(page.getByTestId('mobile-nav-configurator')).toBeVisible()
      await expect(page.getByTestId('mobile-nav-login')).toBeVisible()
      await expect(page.getByTestId('mobile-nav-register')).toBeVisible()

      // Navigate using mobile nav with force click for WebKit
      await page.getByTestId('mobile-nav-configurator').click({ force: true })
      await expect(page).toHaveURL('/configurator')
    })

    test('should close mobile menu after navigation', async ({ page }) => {
      // Set mobile viewport size
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Open mobile menu
      await page.getByTestId('mobile-menu-button').click({ force: true })
      await page.waitForTimeout(100) // Wait for menu animation
      await expect(page.getByTestId('mobile-nav-configurator')).toBeVisible()

      // Navigate to configurator
      await page.getByTestId('mobile-nav-configurator').click({ force: true })

      // Menu should close automatically (navigation items hidden)
      await expect(page.getByTestId('mobile-nav-configurator')).toBeHidden()
    })

    test('should handle mobile authentication flow', async ({ page }) => {
      // Set mobile viewport size
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Open mobile menu and navigate to register
      await page.getByTestId('mobile-menu-button').click({ force: true })
      await page.waitForTimeout(100) // Wait for menu animation
      await page.getByTestId('mobile-nav-register').click({ force: true })
      await expect(page).toHaveURL('/auth/register')

      // Go back to home
      await page.goto('/')
    })

    test('should handle mobile login flow', async ({ page }) => {
      // Set mobile viewport size
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Open mobile menu and navigate to login
      await page.getByTestId('mobile-menu-button').click({ force: true })
      await page.waitForTimeout(100) // Wait for menu animation
      await page.getByTestId('mobile-nav-login').click({ force: true })
      await expect(page).toHaveURL('/auth/login')
    })
  })

  test.describe('Tablet Navigation', () => {
    test('should adapt navigation for tablet viewport', async ({ page }) => {
      // Set tablet viewport size (iPad Pro landscape)
      await page.setViewportSize({ width: 1366, height: 1024 })
      await page.goto('/')

      // Check which navigation is visible on tablet
      const mobileMenuButton = page.getByTestId('mobile-menu-button')
      const desktopNav = page.getByTestId('nav-configurator')

      // On tablet (1024px+ breakpoint), mobile menu should be hidden, desktop nav visible
      await expect(mobileMenuButton).toBeHidden()
      await expect(desktopNav).toBeVisible()

      // Test navigation works
      await desktopNav.click()
      await expect(page).toHaveURL('/configurator')
    })
  })

  test.describe('Responsive Breakpoint Tests', () => {
    test('should show correct navigation at different viewport sizes', async ({ page }) => {
      await page.goto('/')

      // Test mobile viewport (375px)
      await page.setViewportSize({ width: 375, height: 667 })
      await expect(page.getByTestId('mobile-menu-button')).toBeVisible()
      await expect(page.getByTestId('nav-configurator')).toBeHidden()

      // Test tablet viewport (768px) - should still show mobile menu at this size
      await page.setViewportSize({ width: 768, height: 1024 })
      await expect(page.getByTestId('mobile-menu-button')).toBeVisible()
      await expect(page.getByTestId('nav-configurator')).toBeHidden()

      // Test desktop viewport (1280px) - desktop navigation kicks in at lg breakpoint (1024px+)
      await page.setViewportSize({ width: 1280, height: 800 })
      await expect(page.getByTestId('mobile-menu-button')).toBeHidden()
      await expect(page.getByTestId('nav-configurator')).toBeVisible()

      // Test large desktop viewport (1920px)
      await page.setViewportSize({ width: 1920, height: 1080 })
      await expect(page.getByTestId('mobile-menu-button')).toBeHidden()
      await expect(page.getByTestId('nav-configurator')).toBeVisible()
    })
  })

  test.describe('Touch Interaction Tests', () => {
    test('should handle touch interactions properly', async ({ page }) => {
      // Set mobile viewport with touch support
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Test touch target size (minimum 44px)
      const mobileMenuButton = page.getByTestId('mobile-menu-button')
      const buttonBox = await mobileMenuButton.boundingBox()

      expect(buttonBox?.width).toBeGreaterThanOrEqual(44)
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44)

      // Test touch interaction
      await mobileMenuButton.click({ force: true })

      // Test mobile nav items touch targets
      const mobileNavItems = [
        page.getByTestId('mobile-nav-configurator'),
        page.getByTestId('mobile-nav-login'),
        page.getByTestId('mobile-nav-register')
      ]

      for (const item of mobileNavItems) {
        const itemBox = await item.boundingBox()
        expect(itemBox?.height).toBeGreaterThanOrEqual(44)
      }
    })
  })
})
