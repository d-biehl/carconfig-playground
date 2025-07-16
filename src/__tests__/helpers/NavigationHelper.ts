import { Page, expect } from '@playwright/test'

export class NavigationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to a page using either desktop or mobile navigation based on viewport
   */
  async navigateTo(target: 'configurator' | 'login' | 'register'): Promise<void> {
    const isMobile = await this.isMobileViewport()

    if (isMobile) {
      await this.navigateViaMobile(target)
    } else {
      await this.navigateViaDesktop(target)
    }
  }

  /**
   * Navigate using desktop navigation
   */
  async navigateViaDesktop(target: 'configurator' | 'login' | 'register'): Promise<void> {
    const testId = `nav-${target}`
    await this.page.getByTestId(testId).click()
  }

  /**
   * Navigate using mobile hamburger menu
   */
  async navigateViaMobile(target: 'configurator' | 'login' | 'register'): Promise<void> {
    // Open mobile menu if not already open
    const mobileMenuButton = this.page.getByTestId('mobile-menu-button')
    await expect(mobileMenuButton).toBeVisible()
    await mobileMenuButton.click()

    // Wait for menu to be visible
    const mobileNavItem = this.page.getByTestId(`mobile-nav-${target}`)
    await expect(mobileNavItem).toBeVisible()
    await mobileNavItem.click()
  }

  /**
   * Check if current viewport is mobile size
   */
  async isMobileViewport(): Promise<boolean> {
    const viewport = this.page.viewportSize()
    return viewport ? viewport.width < 1024 : false
  }

  /**
   * Verify navigation elements are visible/hidden correctly for current viewport
   */
  async verifyNavigationState(): Promise<void> {
    const isMobile = await this.isMobileViewport()

    if (isMobile) {
      // On mobile: hamburger menu visible, desktop nav hidden
      await expect(this.page.getByTestId('mobile-menu-button')).toBeVisible()
      await expect(this.page.getByTestId('nav-configurator')).toBeHidden()
    } else {
      // On desktop: desktop nav visible, hamburger menu hidden
      await expect(this.page.getByTestId('nav-configurator')).toBeVisible()
      await expect(this.page.getByTestId('mobile-menu-button')).toBeHidden()
    }
  }

  /**
   * Check if user is logged in by looking for user info or logout button
   */
  async isLoggedIn(): Promise<boolean> {
    const isMobile = await this.isMobileViewport()

    if (isMobile) {
      // For mobile, need to open menu first to check
      await this.page.getByTestId('mobile-menu-button').click()
      const logoutButton = this.page.getByTestId('mobile-logout-button')
      const isVisible = await logoutButton.isVisible()
      // Close menu again
      await this.page.getByTestId('mobile-menu-button').click()
      return isVisible
    } else {
      // For desktop, check if logout button is visible
      const logoutButton = this.page.getByTestId('logout-button')
      return await logoutButton.isVisible().catch(() => false)
    }
  }

  /**
   * Logout user using appropriate navigation
   */
  async logout(): Promise<void> {
    const isMobile = await this.isMobileViewport()

    if (isMobile) {
      await this.page.getByTestId('mobile-menu-button').click()
      await this.page.getByTestId('mobile-logout-button').click()
    } else {
      await this.page.getByTestId('logout-button').click()
    }
  }
}
