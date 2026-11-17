// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-data', () => ({
  useVTubers: () => ({ vtubers: [{ id: 'vt_pipuru_123456', name: 'Pipuru' }], loading: false }),
}))

import { ProducersPanel } from './producers-panel'

let host: HTMLDivElement
let root: Root
const calls: { url: string; method: string; body: unknown }[] = []
let producers: { id: string; name: string }[] = []
let postResponse: { status: number; body: Record<string, unknown> } = { status: 200, body: { ok: true, id: 'pr_neon_abcdef', avatar: false } }

function setValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  calls.length = 0
  producers = []
  postResponse = { status: 200, body: { ok: true, id: 'pr_neon_abcdef', avatar: false } }
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    if (method === 'GET') return new Response(JSON.stringify({ producers }), { status: 200 })
    return new Response(JSON.stringify(postResponse.body), { status: postResponse.status })
  }))
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe('admin ProducersPanel', () => {
  it('offers only the fixed services and the shown link networks (no SoundCloud, no Bluesky)', async () => {
    await act(async () => root.render(<ProducersPanel />))
    const services = [...host.querySelectorAll('fieldset label')].map(l => l.textContent?.trim())
    expect(services).toEqual(['Original songs', 'Stream BGM', 'Covers & instrumentals', 'Mixing & mastering', 'Jingles & alerts'])
    const ids = [...host.querySelectorAll('input[id^="producer-"]')].map(i => i.id)
    expect(ids).toEqual(['producer-name', 'producer-genre_tags', 'producer-commission_url', 'producer-portfolio_url', 'producer-youtube', 'producer-twitch', 'producer-x'])
    expect(host.textContent).not.toMatch(/soundcloud|bluesky/i)
    expect(ids.join(' ')).not.toMatch(/price|status|open|rights/i)
    // No producers yet: the credit form waits.
    expect(host.textContent).toContain('Add a producer first.')
  })

  it('posts the producer and shows the server validation error as-is', async () => {
    postResponse = { status: 400, body: { error: 'commission_url must be an https:// link.' } }
    await act(async () => root.render(<ProducersPanel />))
    await act(async () => {
      setValue(host.querySelector('#producer-name')!, 'Neon')
      setValue(host.querySelector('#producer-commission_url')!, 'http://vgen.co/neon')
      setValue(host.querySelector('#producer-genre_tags')!, 'lo-fi, cozy')
      ;(host.querySelectorAll('fieldset input[type="checkbox"]')[1] as HTMLInputElement).click()
    })
    await act(async () => { host.querySelectorAll('form')[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
    const post = calls.find(c => c.method === 'POST')!
    expect(post.url).toBe('/api/admin/producers')
    expect(post.body).toMatchObject({ name: 'Neon', commission_url: 'http://vgen.co/neon', genre_tags: ['lo-fi', ' cozy'], services: ['stream_bgm'] })
    expect(host.textContent).toContain('commission_url must be an https:// link.')
  })

  it('credit form: fixed roles, required source link, one VTuber', async () => {
    producers = [{ id: 'pr_neon_abcdef', name: 'Neon' }]
    await act(async () => root.render(<ProducersPanel />))
    const roles = [...host.querySelectorAll('#credit-role option')].map(o => (o as HTMLOptionElement).value)
    expect(roles).toEqual(['', 'produced', 'composed', 'mixed', 'lyrics', 'bgm'])
    const url = host.querySelector('#credit-url') as HTMLInputElement
    expect(url.required).toBe(true)
    expect((host.querySelector('#credit-title') as HTMLInputElement).required).toBe(true)
    const submit = [...host.querySelectorAll('button[type="submit"]')].find(b => b.textContent?.includes('Add credit')) as HTMLButtonElement
    expect(submit.disabled).toBe(true) // no VTuber picked yet
  })
})
