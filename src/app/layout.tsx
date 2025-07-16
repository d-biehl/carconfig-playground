import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LocalStorageCleanup } from "@/components/LocalStorageCleanup";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AuthProvider } from '@/contexts/AuthContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarConfigurator - Konfigurieren Sie Ihr Traumauto",
  description: "Entdecken Sie unsere Premium-Fahrzeuge und personalisieren Sie sie nach Ihren Wünschen. Von der Lackierung bis zur Ausstattung - gestalten Sie Ihr perfektes Auto.",
  keywords: "Auto, Konfigurator, BMW, Audi, Mercedes, Fahrzeug, Konfiguration",
  authors: [{ name: "CarConfigurator Team" }],
  openGraph: {
    title: "CarConfigurator - Konfigurieren Sie Ihr Traumauto",
    description: "Entdecken Sie unsere Premium-Fahrzeuge und personalisieren Sie sie nach Ihren Wünschen.",
    type: "website",
    locale: "de_DE",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <LocalStorageCleanup />
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="min-h-screen bg-background flex flex-col relative">
                <Header />
                <main className="flex-1 relative">
                  {children}
                </main>
                <Footer />
              </div>
            </ThemeProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
