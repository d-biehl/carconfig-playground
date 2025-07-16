import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Home from '@/app/page'

// Mock fetch
global.fetch = vi.fn()

vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => {
      return <a href={href} {...props}>{children}</a>
    }
  }
})

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ) as unknown as typeof fetch
  })

  it('should render main heading and hero section', async () => {
    await act(async () => {
      render(<Home />)
    })

    // Check for main heading parts that appear in the component
    expect(screen.getByText('Konfigurieren Sie Ihr')).toBeInTheDocument()
    expect(screen.getByText('wartet auf Sie')).toBeInTheDocument()

    // Check for main description
    expect(screen.getByText(/Entdecken Sie unsere Premium-Fahrzeuge/)).toBeInTheDocument()
  })

  it('should render navigation links', async () => {
    await act(async () => {
      render(<Home />)
    })

    // Check for navigation links - use getAllByRole for multiple elements
    const configuratorLinks = screen.getAllByRole('link', { name: /Konfigurator starten/i })
    expect(configuratorLinks.length).toBeGreaterThan(0)
    expect(configuratorLinks[0]).toHaveAttribute('href', '/configurator')

    const learnMoreLinks = screen.getAllByRole('link', { name: /Mehr erfahren/i })
    expect(learnMoreLinks.length).toBeGreaterThan(0)
    expect(learnMoreLinks[0]).toHaveAttribute('href', '#cars')
  })

  it('should render feature section', async () => {
    await act(async () => {
      render(<Home />)
    })

    // Check for feature section title - use getAllByText for multiple elements
    const featureTitles = screen.getAllByText('Warum CarConfigurator?')
    expect(featureTitles.length).toBeGreaterThan(0)
    const featureSubtitles = screen.getAllByText('Entdecken Sie die Vorteile unserer Plattform')
    expect(featureSubtitles.length).toBeGreaterThan(0)

    // Check for feature cards
    expect(screen.getAllByText('Premium Fahrzeuge')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Individuelle Konfiguration')[0]).toBeInTheDocument()
    expect(screen.getByText('Transparente Preise')).toBeInTheDocument()
  })

  it('should render cars section', async () => {
    await act(async () => {
      render(<Home />)
    })

    // Check for cars section - use getAllByText for multiple elements
    const carsSectionTitles = screen.getAllByText('Unsere Fahrzeuge')
    expect(carsSectionTitles.length).toBeGreaterThan(0)
    const carsSubtitles = screen.getAllByText('Entdecken Sie unsere exklusive Fahrzeugauswahl')
    expect(carsSubtitles.length).toBeGreaterThan(0)

    // Should have some kind of loading state or content
    expect(carsSectionTitles[0]).toBeInTheDocument()
  })

  it('should have accessible structure', async () => {
    await act(async () => {
      render(<Home />)
    })

    // Check for headings
    const headings = screen.getAllByRole('heading')
    expect(headings.length).toBeGreaterThan(0)

    // Check for links
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })
})
