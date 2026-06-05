import { FullConfig } from '@playwright/test';
import { chromium } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const shareUrl = 'https://vtvault-v2-jakob25s-projects.vercel.app/?_vercel_share=E73TNHPAKw0kD0XGmtV47eC4ezsEj9QV';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // Visit the share URL to set the Vercel bypass auth cookie
  await page.goto(shareUrl, { waitUntil: 'networkidle' });
  // Save the storage state (cookies) for use in tests
  await page.context().storageState({ path: 'playwright/.auth/bypass.json' });
  await browser.close();
}

export default globalSetup;
