import { test, expect, devices } from '@playwright/test'

// These tests run on the 'mobile' project (Pixel 7) defined in playwright.config.ts

test('home page is usable on mobile', async ({ page }) => {
  await page.goto('/')
  // No horizontal scroll
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
  const viewportWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5) // 5px tolerance
})

test('mobile navbar hamburger works', async ({ page }) => {
  await page.goto('/')
  // Hamburger menu button should be visible on mobile
  const hamburger = page.getByRole('button').filter({ hasText: '' }).first()
  // Look for menu icon
  const menuBtn = page.locator('button[aria-label*="menu"], button svg').first()
  await expect(menuBtn.or(page.locator('header button').last())).toBeVisible()
})

test('discover page canvas is visible on mobile', async ({ page }) => {
  await page.goto('/discover')
  await page.waitForLoadState('networkidle')
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
})

test('clips page grid adapts to mobile', async ({ page }) => {
  await page.goto('/clips')
  await page.waitForLoadState('networkidle')
  // Should not overflow
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
  const viewportWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
})

test('login page is usable on mobile', async ({ page }) => {
  await page.goto('/login')
  const usernameField = page.getByPlaceholder(/username/i)
  const passwordField = page.getByPlaceholder(/password/i).first()
  await expect(usernameField).toBeVisible()
  await expect(passwordField).toBeVisible()
  // Fields should be usable (not cut off)
  const box = await usernameField.boundingBox()
  expect(box?.width).toBeGreaterThan(100)
})

test('bets page is readable on mobile', async ({ page }) => {
  await page.goto('/bets')
  await page.waitForLoadState('networkidle')
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
  const viewportWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
})
