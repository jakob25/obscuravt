import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'tests/**', '**/*.spec.ts', 'playwright.config.ts', 'global-setup.ts', 'run-tests.sh'],
      thresholds: { lines: 60, functions: 60, branches: 50, statements: 60 }
    },
    alias: { '@': path.resolve(__dirname, '.') },
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'tests/**']
  }
})
