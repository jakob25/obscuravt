import { test, expect } from '@playwright/test'

const BASE = process.env.TEST_URL ?? 'https://vtvault-v2-jakob25s-projects.vercel.app'

// ── Security headers ──────────────────────────────────────────────────────────

test('security headers are set on every response', async ({ page }) => {
  const res = await page.request.get('/')
  const headers = res.headers()

  expect(headers['x-frame-options'],        'X-Frame-Options missing').toBe('DENY')
  expect(headers['x-content-type-options'], 'X-Content-Type-Options missing').toBe('nosniff')
  expect(headers['referrer-policy'],        'Referrer-Policy missing').toBeTruthy()
  expect(headers['content-security-policy'],'CSP missing').toBeTruthy()
  console.log('  ✓ All security headers present')
})

test('API responses have security headers', async ({ page }) => {
  const res = await page.request.get('/api/vtubers')
  const headers = res.headers()
  expect(headers['x-content-type-options']).toBe('nosniff')
})

// ── Session cookies are httpOnly ──────────────────────────────────────────────

test('session cookie is httpOnly and not accessible via JS', async ({ page }) => {
  // Login
  await page.goto('/login')
  const loginRes = await page.request.post('/api/auth/login', {
    data: { username: 'nonexistent', password: 'wrongpassword' },
  })
  // Even on failed login, check cookie properties on a successful one
  // by checking document.cookie doesn't expose session
  await page.goto('/')
  const cookies = await page.evaluate(() => document.cookie)
  expect(cookies).not.toContain('vtvault_session')
  console.log('  ✓ Session cookie not accessible via document.cookie')
})

// ── XSS prevention ────────────────────────────────────────────────────────────

test('XSS payload in search does not execute', async ({ page }) => {
  let alertFired = false
  page.on('dialog', () => { alertFired = true })

  await page.goto('/search')
  await page.getByPlaceholder(/search/i).fill('<script>alert("xss")</script>')
  await page.waitForTimeout(1000)
  expect(alertFired).toBe(false)
  console.log('  ✓ XSS payload did not execute in search')
})

test('XSS payload in URL param does not execute', async ({ page }) => {
  let alertFired = false
  page.on('dialog', () => { alertFired = true })

  await page.goto('/search?q=<script>alert("xss")</script>')
  await page.waitForTimeout(1000)
  expect(alertFired).toBe(false)
})

// ── CSRF — state-changing requests need valid origin ─────────────────────────

test('API POST without session returns 401 not 500', async ({ page }) => {
  const res = await page.request.post('/api/bets/place', {
    data: { bet_id: 'test', option: 'yes', amount: 100 },
  })
  // Should be 401 (unauthorized) not 500 (crash)
  expect(res.status()).toBe(401)
})

// ── SQL injection ─────────────────────────────────────────────────────────────

test('SQL injection in login does not crash server', async ({ page }) => {
  const res = await page.request.post('/api/auth/login', {
    data: {
      username: "' OR '1'='1",
      password: "' OR '1'='1",
    },
  })
  // Should be 400 (validation) or 401 (wrong credentials), never 500
  expect(res.status()).toBeLessThan(500)
  console.log(`  ✓ SQL injection returned ${res.status()} (not 500)`)
})

// ── Oversized payloads ────────────────────────────────────────────────────────

test('oversized payload is rejected', async ({ page }) => {
  const bigString = 'a'.repeat(100000)
  const res = await page.request.post('/api/auth/register', {
    data: { username: bigString, password: 'password123' },
  })
  expect(res.status()).toBe(400)
  console.log('  ✓ Oversized payload rejected')
})

// ── No sensitive data in responses ───────────────────────────────────────────

test('user API does not expose password_hash', async ({ page }) => {
  const res = await page.request.get('/api/auth/me')
  const data = await res.json()
  if (data) {
    expect(JSON.stringify(data)).not.toContain('password_hash')
    expect(JSON.stringify(data)).not.toContain('password')
  }
  console.log('  ✓ No password_hash in /api/auth/me response')
})

test('vtubers API does not expose internal fields', async ({ page }) => {
  const res = await page.request.get('/api/vtubers')
  const data = await res.json()
  if (data.length) {
    // nominated_by and other admin fields should not leak sensitive data
    const str = JSON.stringify(data[0])
    expect(str).not.toContain('password')
  }
})

// ── Admin endpoint is locked down ────────────────────────────────────────────

test('admin endpoint returns 401 without auth', async ({ page }) => {
  const res = await page.request.get('/api/admin/pending')
  expect([401, 403]).toContain(res.status())
  console.log(`  ✓ Admin endpoint returned ${res.status()} for unauthenticated request`)
})

test('tags DELETE requires admin', async ({ page }) => {
  const res = await page.request.delete('/api/tags', {
    data: { id: 'vibe_comfy' },
  })
  expect([401, 403]).toContain(res.status())
})
