import { chromium, type FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function globalSetup(config: FullConfig) {
  const authDir = path.join(__dirname, 'playwright', '.auth')
  const storagePath = path.join(authDir, 'bypass.json')
  const emptyState = { cookies: [] as unknown[], origins: [] as unknown[] }

  fs.mkdirSync(authDir, { recursive: true })

  const baseURL = (config.projects[0]?.use?.baseURL as string) || process.env.PLAYWRIGHT_BASE_URL
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

  if (!baseURL || !bypass || baseURL.includes('localhost')) {
    fs.writeFileSync(storagePath, JSON.stringify(emptyState, null, 2))
    return
  }

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  const bypassUrl = `${baseURL.replace(/\/$/, '')}/?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${encodeURIComponent(bypass)}`
  await page.goto(bypassUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 })

  await context.storageState({ path: storagePath })
  await browser.close()
}

export default globalSetup