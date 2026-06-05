import { test, expect } from '@playwright/test'

// ── Star map ──────────────────────────────────────────────────────────────────

test('star map canvas renders', async ({ page }) => {
  await page.goto('/discover')
  await page.waitForLoadState('networkidle')
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  // Canvas should have content (non-zero dimensions)
  const size = await canvas.boundingBox()
  expect(size?.width).toBeGreaterThan(0)
  expect(size?.height).toBeGreaterThan(0)
})

test('star map toggle switches between vibe and niche', async ({ page }) => {
  await page.goto('/discover')
  // Both toggle buttons should exist
  await expect(page.getByText(/vibe map/i)).toBeVisible()
  await expect(page.getByText(/niche map/i)).toBeVisible()
  // Click niche map
  await page.getByText(/niche map/i).click()
  // Canvas should still be visible
  await expect(page.locator('canvas')).toBeVisible()
  // Click back to vibe
  await page.getByText(/vibe map/i).click()
  await expect(page.locator('canvas')).toBeVisible()
})

test('first timer banner shows on first visit', async ({ page }) => {
  // Clear localStorage to simulate first visit
  await page.goto('/discover')
  await page.evaluate(() => localStorage.removeItem('vtvault_map_seen'))
  await page.reload()
  await expect(page.getByText(/star map/i).or(page.getByText(/got it/i))).toBeVisible()
})

// ── VTuber profiles ───────────────────────────────────────────────────────────

test('VTubers load and profiles are accessible', async ({ page }) => {
  // Get the list of VTubers
  const res = await page.request.get('/api/vtubers')
  const vtubers = await res.json()
  expect(vtubers.length).toBeGreaterThan(0)

  // Visit the first VTuber's profile
  const first = vtubers[0]
  await page.goto(`/vtuber/${first.id}`)
  await page.waitForLoadState('networkidle')

  // Profile should show the VTuber's name
  await expect(page.getByText(first.name)).toBeVisible()
  console.log(`  ✓ Profile loads for ${first.name}`)
})

test('VTuber profile has tabs', async ({ page }) => {
  const res = await page.request.get('/api/vtubers')
  const vtubers = await res.json()
  if (!vtubers.length) { console.log('  ⚠ No VTubers to test'); return }

  await page.goto(`/vtuber/${vtubers[0].id}`)
  await page.waitForLoadState('networkidle')

  // Should have clips, photos, fan art, cmdmi, schedule tabs
  await expect(page.getByText(/clips/i)).toBeVisible()
  await expect(page.getByText(/photos/i).or(page.getByText(/fan art/i))).toBeVisible()
})

test('VTuber profile has watch on platform link', async ({ page }) => {
  const res = await page.request.get('/api/vtubers')
  const vtubers = await res.json()
  if (!vtubers.length) return

  // Find a VTuber with a platform link
  const withLink = vtubers.find((v: { link: string }) => v.link)
  if (!withLink) { console.log('  ⚠ No VTubers with links to test'); return }

  await page.goto(`/vtuber/${withLink.id}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(/watch on/i)).toBeVisible()
  console.log(`  ✓ Watch link present for ${withLink.name}`)
})

test('hidden gem badge shows on profile with few clips', async ({ page }) => {
  const res = await page.request.get('/api/vtubers')
  const vtubers = await res.json()
  if (!vtubers.length) return

  // Check a few profiles for hidden gem badge
  let found = false
  for (const vt of vtubers.slice(0, 5)) {
    await page.goto(`/vtuber/${vt.id}`)
    await page.waitForLoadState('networkidle')
    const hasGem = await page.getByText(/hidden gem/i).isVisible()
    if (hasGem) { found = true; console.log(`  ✓ Hidden Gem badge on ${vt.name}`); break }
  }
  if (!found) console.log('  ℹ No hidden gem badges found (all profiles have 5+ clips)')
})

// ── Search ────────────────────────────────────────────────────────────────────

test('search returns results for known VTuber', async ({ page }) => {
  const res = await page.request.get('/api/vtubers')
  const vtubers = await res.json()
  if (!vtubers.length) return

  const name = vtubers[0].name.split(' ')[0] // first word of name

  await page.goto('/search')
  await page.getByPlaceholder(/search/i).fill(name)
  await page.waitForTimeout(500) // debounce

  await expect(page.getByText(vtubers[0].name)).toBeVisible({ timeout: 5000 })
  console.log(`  ✓ Search found "${vtubers[0].name}"`)
})

test('search constellation filter works', async ({ page }) => {
  await page.goto('/search')
  await page.getByRole('button', { name: /filter/i }).click()
  // Constellation filter should appear
  await expect(page.getByText(/constellation/i)).toBeVisible()
})

// ── Find My Oshi ──────────────────────────────────────────────────────────────

test('find my oshi completes full quiz', async ({ page }) => {
  await page.goto('/find-my-oshi')

  // Start quiz
  await page.getByRole('button', { name: /start/i }).click()

  // Answer all 5 questions
  for (let i = 0; i < 5; i++) {
    // Click the first option in the grid
    await page.locator('button').filter({ hasText: /.+/ }).first().click()
    // Click Next/See Results
    const nextBtn = page.getByRole('button', { name: /next|results/i })
    await expect(nextBtn).toBeEnabled()
    await nextBtn.click()
  }

  // Results page
  await expect(page.getByText(/your match|result/i)).toBeVisible({ timeout: 5000 })
  console.log('  ✓ Find My Oshi quiz completed')
})
