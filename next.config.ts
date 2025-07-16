import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // TypeScript configuration
  typescript: {
    // Skip type checking during build in Docker (already done in CI)
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ESLint configuration
  eslint: {
    // Skip ESLint during build in Docker (already done in CI)
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // Configure image domains if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Experimental features for better Docker performance
  experimental: {
    // Optimize bundle size
    optimizePackageImports: ['lucide-react'],
  },
};

export default withNextIntl(nextConfig);
