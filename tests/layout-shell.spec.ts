import { test, expect } from '@playwright/test'

test.describe('layout shell', () => {
  test('home: body backdrop, scroll, and marketing content', async ({ page }) => {
    await page.goto('/')

    const body = page.locator('body')
    await expect(body).toHaveClass(/bg-vault-deep/)
    await expect(body).not.toHaveClass(/isolate/)

    await expect(page.locator('.site-backdrop')).toHaveCount(1)
    await expect(page.locator('.relative.z-10')).toBeVisible()

    // Marketing hero (logged-out) or dashboard header (logged-in)
    const hero = page.getByRole('heading', { level: 1 })
    const dashboard = page.getByText(/back in the vault|dashboard/i)
    await expect(hero.or(dashboard)).toBeVisible({ timeout: 15_000 })

    const metrics = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))

    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2)
  })

  test('discover: full viewport height map container', async ({ page }) => {
    await page.goto('/discover')
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 })

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2)
  })
})