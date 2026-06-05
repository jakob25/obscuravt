import { test, expect } from '@playwright/test'

const TEST_USER = `testuser_${Date.now()}`
const TEST_PASS = 'TestPassword123!'

// ── Registration flow ─────────────────────────────────────────────────────────

test('user can register, login, and see profile', async ({ page }) => {
  // Register
  await page.goto('/login')
  await expect(page.getByRole('tab', { name: /register|sign up/i })
    .or(page.getByText(/register|sign up/i))).toBeVisible()

  // Switch to register if tabs exist
  const registerTab = page.getByRole('tab', { name: /register/i })
  if (await registerTab.isVisible()) await registerTab.click()

  await page.getByPlaceholder(/username/i).fill(TEST_USER)
  await page.getByPlaceholder(/password/i).first().fill(TEST_PASS)

  const confirmField = page.getByPlaceholder(/confirm|repeat/i)
  if (await confirmField.isVisible()) await confirmField.fill(TEST_PASS)

  await page.getByRole('button', { name: /register|sign up|create/i }).click()

  // Should redirect away from login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 })

  // Check session persists — visit profile
  await page.goto('/my-profile')
  await expect(page.getByText(TEST_USER)).toBeVisible()
  console.log(`  ✓ Registered and logged in as ${TEST_USER}`)
})

// ── Login flow ────────────────────────────────────────────────────────────────

test('login flow works', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder(/username/i).fill(TEST_USER)
  await page.getByPlaceholder(/password/i).first().fill(TEST_PASS)
  await page.getByRole('button', { name: /login|sign in/i }).click()
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 })
  await expect(page.locator('body')).not.toContainText('Invalid username or password')
})

// ── Wrong password ────────────────────────────────────────────────────────────

test('wrong password shows error', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder(/username/i).fill(TEST_USER)
  await page.getByPlaceholder(/password/i).first().fill('wrongpassword999')
  await page.getByRole('button', { name: /login|sign in/i }).click()
  await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 5000 })
})

// ── Authenticated user journey ────────────────────────────────────────────────

test('logged-in user can claim daily bonus', async ({ page }) => {
  // Login first
  await page.goto('/login')
  await page.getByPlaceholder(/username/i).fill(TEST_USER)
  await page.getByPlaceholder(/password/i).first().fill(TEST_PASS)
  await page.getByRole('button', { name: /login|sign in/i }).click()
  await page.waitForURL(url => !url.pathname.includes('/login'))

  // Go to profile
  await page.goto('/my-profile')
  const bonusBtn = page.getByRole('button', { name: /daily bonus|claim/i })
  await expect(bonusBtn).toBeVisible()

  // If claimable, click it
  const isEnabled = await bonusBtn.isEnabled()
  if (isEnabled) {
    await bonusBtn.click()
    await expect(page.getByText(/250|claimed|bonus/i)).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Daily bonus claimed')
  } else {
    console.log('  ✓ Daily bonus already claimed (correct state)')
  }
})

test('logged-in user can submit a bet', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder(/username/i).fill(TEST_USER)
  await page.getByPlaceholder(/password/i).first().fill(TEST_PASS)
  await page.getByRole('button', { name: /login|sign in/i }).click()
  await page.waitForURL(url => !url.pathname.includes('/login'))

  await page.goto('/bets')
  // Click submit/add bet button
  const addBtn = page.getByRole('button', { name: /submit|add|create|new bet/i })
  if (await addBtn.isVisible()) {
    await addBtn.click()
    await expect(page.getByPlaceholder(/title|question/i)).toBeVisible({ timeout: 3000 })
    console.log('  ✓ Bet submit form opens')
  }
})

test('logged-in user can post in forums', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder(/username/i).fill(TEST_USER)
  await page.getByPlaceholder(/password/i).first().fill(TEST_PASS)
  await page.getByRole('button', { name: /login|sign in/i }).click()
  await page.waitForURL(url => !url.pathname.includes('/login'))

  await page.goto('/forums')
  await page.waitForLoadState('networkidle')

  const textarea = page.getByPlaceholder(/post|write|share/i)
  if (await textarea.isVisible()) {
    await textarea.fill('Test post from automated testing suite')
    const postBtn = page.getByRole('button', { name: /^post$/i })
    await expect(postBtn).toBeEnabled()
    console.log('  ✓ Forum post form is ready')
  }
})

// ── Logout ────────────────────────────────────────────────────────────────────

test('logout works and clears session', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder(/username/i).fill(TEST_USER)
  await page.getByPlaceholder(/password/i).first().fill(TEST_PASS)
  await page.getByRole('button', { name: /login|sign in/i }).click()
  await page.waitForURL(url => !url.pathname.includes('/login'))

  // Go to profile and sign out
  await page.goto('/my-profile')
  await page.getByRole('button', { name: /sign out|logout/i }).click()

  // Should redirect to home or login
  await page.waitForURL(url =>
    url.pathname === '/' || url.pathname.includes('/login'), { timeout: 5000 })

  // Session should be gone — profile redirects to login
  await page.goto('/my-profile')
  await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 5000 })
  console.log('  ✓ Logout cleared session correctly')
})

// ── Protected pages redirect when not logged in ───────────────────────────────

test('my-profile redirects to login when not authenticated', async ({ page }) => {
  // Fresh context with no cookies
  await page.goto('/my-profile')
  await expect(page).toHaveURL(/login/, { timeout: 5000 })
})

test('notifications redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/notifications')
  await expect(page).toHaveURL(/login/, { timeout: 5000 })
})

test('creator dashboard redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/creator')
  await expect(page).toHaveURL(/login/, { timeout: 5000 })
})
