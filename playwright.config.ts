import { defineConfig, devices } from '@playwright/test';

// Testing env support: override with PLAYWRIGHT_BASE_URL=http://localhost:3000 for local dev testing
// (after `pnpm dev`). Global auth bypass is only for the production Vercel preview.
const isLocal = (process.env.PLAYWRIGHT_BASE_URL || '').includes('localhost');
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://vtvault-v2-jakob25s-projects.vercel.app';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  // Only run the Vercel auth globalSetup for remote; local tests don't need the share bypass cookie.
  globalSetup: isLocal ? undefined : require.resolve('./global-setup'),
  use: {
    baseURL,
    trace: 'on-first-retry',
    // For local, no storageState (or you can create a simple one); remote uses the bypass.
    storageState: isLocal ? undefined : 'playwright/.auth/bypass.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
