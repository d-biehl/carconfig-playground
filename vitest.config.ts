import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/e2e/**',
      '**/*.spec.ts',
      '**/dist/**',
      '**/coverage/**'
    ],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    testTimeout: 15000,
    hookTimeout: 15000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
