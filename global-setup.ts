import { FullConfig } from '@playwright/test';
import { chromium } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const shareUrl = 'https://vtvault-v2-jakob25s-projects.vercel.app/?_vercel_share=E73TNHPAKw0kD0XGmtV47eC4ezsEj9QV';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  // Visit the share URL to set the Vercel bypass auth cookie
  await page.goto(shareUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  // Prime the cookie for the target domain by visiting a page
  await page.goto('https://vtvault-v2-jakob25s-projects.vercel.app/discover', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  // Save the storage state (cookies) for use in tests
  await context.storageState({ path: 'playwright/.auth/bypass.json' });
  await browser.close();
}

export default globalSetup;
