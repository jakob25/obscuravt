import { test, expect } from '@playwright/test'

// ── Every public page loads without crashing ──────────────────────────────────

const PUBLIC_PAGES = [
  { path: '/',              title: /obscura|vtvault|vault/i },
  { path: '/discover',      title: /discover|star map|vibe/i },
  { path: '/clips',         title: /clips/i },
  { path: '/bets',          title: /bets/i },
  { path: '/find-my-oshi',  title: /oshi/i },
  { path: '/search',        title: /search/i },
  { path: '/leaderboard',   title: /leaderboard/i },
  { path: '/achievements',  title: /achievement/i },
  { path: '/shop',          title: /shop/i },
  { path: '/weekly',        title: /weekly/i },
  { path: '/forums',        title: /forum/i },
  { path: '/tag-validator', title: /tag/i },
  { path: '/nominator',     title: /nominator|nominate/i },
  { path: '/corpo',         title: /corpo|collective/i },
  { path: '/resources',     title: /resources|stream/i },
  { path: '/fan-art',       title: /fan art|gallery/i },
  { path: '/silhouette',    title: /vtuber|silhouette|who/i },
  { path: '/login',         title: /login|sign/i },
]

for (const { path, title } of PUBLIC_PAGES) {
  test(`page loads: ${path}`, async ({ page }) => {
    const res = await page.goto(path)
    expect(res?.status()).toBeLessThan(400)
    await expect(page).not.toHaveTitle(/error|500|404/i)
    await expect(page.locator('body')).not.toContainText('Application error')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })
}

// ── Navigation works ──────────────────────────────────────────────────────────

test('navbar renders and links work', async ({ page }) => {
  await page.goto('/')
  // Navbar should be present
  await expect(page.locator('header')).toBeVisible()
  // Logo/brand name visible
  await expect(page.locator('header a').first()).toBeVisible()
  // Search icon navigates
  await page.locator('a[href="/search"]').first().click()
  await expect(page).toHaveURL(/search/)
})

test('discover page shows map toggle', async ({ page }) => {
  await page.goto('/discover')
  await expect(page.getByText(/vibe map/i).or(page.getByText(/niche map/i))).toBeVisible()
  // Canvas renders
  await expect(page.locator('canvas')).toBeVisible()
})

test('home page loads landing or dashboard', async ({ page }) => {
  await page.goto('/')
  const landing = page.getByText(/algorithm forgot|sign in to enter/i)
  const dashboard = page.getByText(/customise|customize|your vault dashboard/i)
  await expect(landing.or(dashboard)).toBeVisible()
})

test('clips page shows filter tabs', async ({ page }) => {
  await page.goto('/clips')
  await expect(page.getByText(/raw/i)).toBeVisible()
  await expect(page.getByText(/edited/i)).toBeVisible()
})

test('find my oshi quiz starts', async ({ page }) => {
  await page.goto('/find-my-oshi')
  await expect(page.getByText(/start quiz|take the quiz|find/i)).toBeVisible()
  await page.getByRole('button', { name: /start/i }).click()
  // First question appears
  await expect(page.locator('button').nth(0)).toBeVisible()
})

test('search page accepts input', async ({ page }) => {
  await page.goto('/search')
  const input = page.getByPlaceholder(/search/i)
  await expect(input).toBeVisible()
  await input.fill('test')
  await expect(input).toHaveValue('test')
})

test('leaderboard has tabs', async ({ page }) => {
  await page.goto('/leaderboard')
  // At least one tab-like element
  await expect(page.getByText(/richest|accurate|loss/i).first()).toBeVisible()
})

test('shop shows items', async ({ page }) => {
  await page.goto('/shop')
  await page.waitForLoadState('networkidle')
  // Should have at least one item or a sign-in prompt
  const hasItems = await page.locator('.vault-card').count() > 0
  expect(hasItems).toBe(true)
})

test('bets page loads', async ({ page }) => {
  await page.goto('/bets')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).not.toContainText('Application error')
})

test('forums page shows constellation tabs', async ({ page }) => {
  await page.goto('/forums')
  await page.waitForLoadState('networkidle')
  // Should show at least one constellation button
  await expect(page.locator('button').first()).toBeVisible()
})

test('silhouette game loads', async ({ page }) => {
  await page.goto('/silhouette')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).not.toContainText('Application error')
})

test('tag validator page loads', async ({ page }) => {
  await page.goto('/tag-validator')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).not.toContainText('Application error')
})

test('resources page has extra tabs', async ({ page }) => {
  await page.goto('/resources')
  await expect(page.getByRole('tab', { name: /stream setup/i })).toBeVisible()
  await expect(page.getByRole('tab', { name: /debut checklist/i })).toBeVisible()
})

test('meme share page handles missing slug gracefully', async ({ page }) => {
  await page.goto('/meme/meme_not_real_slug_abc123')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).not.toContainText('Application error')
})

// ── 404 handling ──────────────────────────────────────────────────────────────

test('unknown page returns 404 not crash', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist-abc123')
  expect(res?.status()).toBe(404)
  await expect(page.locator('body')).not.toContainText('Application error')
})
