'use client'

import Link from 'next/link'
import { Car, Mail, Phone, MapPin } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export function Footer() {
  const t = useTranslations()
  const locale = useLocale()

  return (
    <footer className="mt-16 sm:mt-20 lg:mt-24 bg-muted/30 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Car className="h-8 w-8 text-primary" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {t('home.title')}
              </h3>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md text-sm sm:text-base">
              {locale === 'en'
                ? 'Configure your dream car with our premium vehicle selection. From luxury sedans to powerful SUVs - find your perfect match.'
                : 'Konfigurieren Sie Ihr Traumauto mit unserer Premium-Fahrzeugauswahl. Von Luxus-Limousinen bis zu kraftvollen SUVs - finden Sie Ihr perfektes Fahrzeug.'
              }
            </p>
            <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>contact@carconfigurator.com</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+49 (0) 123 456 789</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
              {locale === 'en' ? 'Quick Links' : 'Schnellzugriff'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/configurator" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-configurator-link">
                  {t('nav.configurator')}
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-login-link">
                  {t('nav.login')}
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-register-link">
                  {t('nav.register')}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-admin-link">
                  {t('nav.admin')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
              {locale === 'en' ? 'Support' : 'Support'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-help-link">
                  {locale === 'en' ? 'Help Center' : 'Hilfe-Center'}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-contact-link">
                  {locale === 'en' ? 'Contact Us' : 'Kontakt'}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-privacy-link">
                  {locale === 'en' ? 'Privacy Policy' : 'Datenschutz'}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-terms-link">
                  {locale === 'en' ? 'Terms of Service' : 'AGB'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
            © 2025 CarConfigurator. {locale === 'en' ? 'All rights reserved.' : 'Alle Rechte vorbehalten.'}
          </p>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {locale === 'en' ? 'Made in Germany' : 'Made in Germany'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
