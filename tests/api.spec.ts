import { test, expect } from '@playwright/test'

const BASE = process.env.TEST_URL ?? 'https://vtvault-v2-jakob25s-projects.vercel.app'

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res
}

// ── Public GET endpoints ──────────────────────────────────────────────────────

test('GET /api/vtubers returns array', async () => {
  const res = await api('/api/vtubers')
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(Array.isArray(data)).toBe(true)
  console.log(`  ✓ ${data.length} VTubers in DB`)
})

test('GET /api/bets returns array', async () => {
  const res = await api('/api/bets')
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(Array.isArray(data)).toBe(true)
  console.log(`  ✓ ${data.length} bets in DB`)
})

test('GET /api/clips returns array', async () => {
  const res = await api('/api/clips')
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(Array.isArray(data)).toBe(true)
  console.log(`  ✓ ${data.length} clips in DB`)
})

test('GET /api/shop returns items', async () => {
  const res = await api('/api/shop')
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(Array.isArray(data)).toBe(true)
  expect(data.length).toBeGreaterThan(0)
  console.log(`  ✓ ${data.length} shop items`)
})

test('GET /api/achievements returns achievements', async () => {
  const res = await api('/api/achievements')
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(Array.isArray(data)).toBe(true)
  console.log(`  ✓ ${data.length} achievements`)
})

test('GET /api/leaderboard returns data', async () => {
  const res = await api('/api/leaderboard')
  expect(res.status).toBe(200)
})

test('GET /api/weekly returns digest', async () => {
  const res = await api('/api/weekly')
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data).toHaveProperty('topClips')
})

test('GET /api/tags returns canonical tags', async () => {
  const res = await api('/api/tags')
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(Array.isArray(data)).toBe(true)
  expect(data.length).toBeGreaterThan(50)
  console.log(`  ✓ ${data.length} canonical tags`)
})

test('GET /api/forums returns posts', async () => {
  const res = await api('/api/forums')
  expect(res.status).toBe(200)
})

test('GET /api/auth/me returns null when not logged in', async () => {
  const res = await api('/api/auth/me')
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data).toBeNull()
})

// ── Auth endpoints require fields ─────────────────────────────────────────────

test('POST /api/auth/login rejects missing fields', async () => {
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  expect(res.status).toBe(400)
})

test('POST /api/auth/login rejects wrong password', async () => {
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'fakeuser999', password: 'wrongpass' }),
  })
  expect(res.status).toBe(401)
})

test('POST /api/auth/register rejects short password', async () => {
  const res = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username: 'testuser', password: '123' }),
  })
  expect(res.status).toBe(400)
})

test('POST /api/auth/register rejects bad username chars', async () => {
  const res = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username: 'test user!', password: 'password123' }),
  })
  expect(res.status).toBe(400)
})

// ── Protected endpoints reject unauthenticated requests ───────────────────────

test('POST /api/bets/place rejects without session', async () => {
  const res = await api('/api/bets/place', {
    method: 'POST',
    body: JSON.stringify({ bet_id: 'fake', option: 'yes', amount: 100 }),
  })
  expect(res.status).toBe(401)
})

test('POST /api/clips rejects without session', async () => {
  const res = await api('/api/clips', {
    method: 'POST',
    body: JSON.stringify({ title: 'test', url: 'https://youtube.com/watch?v=test' }),
  })
  expect(res.status).toBe(401)
})

test('POST /api/forums rejects without session', async () => {
  const res = await api('/api/forums', {
    method: 'POST',
    body: JSON.stringify({ constellation_id: 'clust_comfy', content: 'hello' }),
  })
  expect(res.status).toBe(401)
})

test('POST /api/cmdmi/pledge rejects without session', async () => {
  const res = await api('/api/cmdmi/pledge', {
    method: 'POST',
    body: JSON.stringify({ goal_id: 'fake', amount: 100 }),
  })
  expect(res.status).toBe(401)
})

test('PATCH /api/admin/pending rejects non-admin', async () => {
  const res = await api('/api/admin/pending', {
    method: 'PATCH',
    body: JSON.stringify({ id: 'fake', action: 'approve' }),
  })
  expect(res.status).toBe(401)
})

// ── Rate limiting works ───────────────────────────────────────────────────────

test('auth endpoint rate limits after many requests', async () => {
  // Fire 12 rapid login attempts — should hit 429 before the 11th
  let hit429 = false
  for (let i = 0; i < 12; i++) {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: `ratelimituser${i}`, password: 'wrong' }),
    })
    if (res.status === 429) { hit429 = true; break }
  }
  expect(hit429).toBe(true)
})

// ── Input validation blocks bad data ─────────────────────────────────────────

test('XSS payload in username is rejected', async () => {
  const res = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: '<script>alert(1)</script>',
      password: 'password123',
    }),
  })
  expect(res.status).toBe(400)
})

test('SQL injection in username is rejected', async () => {
  const res = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: "admin'; DROP TABLE users; --",
      password: 'password123',
    }),
  })
  expect(res.status).toBe(400)
})
