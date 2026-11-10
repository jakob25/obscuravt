// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VTUBER_SUBMIT } from '@/lib/site-copy'
import { VTuberSubmitForm } from './vtuber-submit-form'

const auth = {
  user: null as null | { username: string; coins: number; role: string | null; isAdmin: boolean },
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
}

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => auth,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/nominator',
}))


let host: HTMLDivElement
let root: Root

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  auth.user = { username: 'Nim', coins: 0, role: 'fan', isAdmin: false }
  auth.loading = false
  vi.stubGlobal('fetch', vi.fn())
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function mount() {
  await act(async () => root.render(<VTuberSubmitForm />))
}

function heading() {
  return host.querySelector('h2')?.textContent || ''
}

describe('VTuberSubmitForm wizard', () => {
  it('starts signed-out users on Sign in, and signed-in users on the profile link step', async () => {
    auth.user = null
    await mount()
    expect(heading()).toBe(VTUBER_SUBMIT.steps.signin.title)
    expect(host.textContent).toContain(VTUBER_SUBMIT.steps.signin.instruction)
    expect(host.textContent).toContain(VTUBER_SUBMIT.stepOf(1, 5))
    expect(host.querySelectorAll('[data-testid="wizard-steps"] li').length).toBe(5)
    const signIn = host.querySelector('a[href="/login?next=%2Fnominator"]')
    expect(signIn?.textContent).toBe(VTUBER_SUBMIT.signIn)

    await act(async () => root.unmount())
    auth.user = { username: 'Nim', coins: 0, role: 'fan', isAdmin: false }
    root = createRoot(host)
    await mount()
    expect(heading()).toBe(VTUBER_SUBMIT.steps.link.title)
    expect(host.textContent).toContain(VTUBER_SUBMIT.stepOf(1, 4))
    expect(host.textContent).not.toContain(VTUBER_SUBMIT.stepOf(1, 5))
    expect(host.querySelectorAll('[data-testid="wizard-steps"] li').length).toBe(4)
  })

  async function setInput(el: HTMLInputElement, value: string) {
    await act(async () => {
      const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
      proto?.set?.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  it('keeps pasted details when going back from tags to details', async () => {
    await mount()
    const skip = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.skipLink)
    await act(async () => skip?.click())
    expect(heading()).toBe(VTUBER_SUBMIT.steps.details.title)

    await setInput(host.querySelector<HTMLInputElement>('#name')!, 'Pipuru')
    const next = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.next)
    await act(async () => next?.click())
    expect(heading()).toBe(VTUBER_SUBMIT.steps.tags.title)

    const back = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.back)
    await act(async () => back?.click())
    expect(heading()).toBe(VTUBER_SUBMIT.steps.details.title)
    expect(host.querySelector<HTMLInputElement>('#name')?.value).toBe('Pipuru')
  })

  it('blocks Next on a duplicate and surfaces the warning on the link step', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        platform: 'Twitch',
        link: 'https://www.twitch.tv/pipuru',
        name: 'Pipuru',
        handle: 'pipuru',
        bio: 'Hello',
        avatarUrl: null,
        partial: false,
        message: null,
        duplicate: { status: 'pending', id: 'vt_pipuru', name: 'Pipuru' },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await mount()

    const input = host.querySelector<HTMLInputElement>('#link')!
    await act(async () => {
      const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
      proto?.set?.call(input, 'https://www.twitch.tv/pipuru')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 450))
    })
    expect(host.textContent).toContain(VTUBER_SUBMIT.alreadyNominated('Pipuru'))
    const next = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.next)
    expect(next?.disabled).toBe(true)
  })

  it('lets someone skip the link and requires a name before leaving details', async () => {
    await mount()
    const skip = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.skipLink)
    await act(async () => skip?.click())
    expect(heading()).toBe(VTUBER_SUBMIT.steps.details.title)

    const next = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.next)
    await act(async () => next?.click())
    expect(heading()).toBe(VTUBER_SUBMIT.steps.details.title)
    expect(host.textContent).toContain('Name must be at least 2 characters')
  })

  it('shows constellation labels in readable words, not stored ids', async () => {
    await mount()
    const skip = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.skipLink)
    await act(async () => skip?.click())
    await setInput(host.querySelector<HTMLInputElement>('#name')!, 'Pipuru')
    const next = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.next)
    await act(async () => next?.click())
    expect(heading()).toBe(VTUBER_SUBMIT.steps.tags.title)
    expect(host.textContent).toContain('Slice of life')
    expect(host.textContent).not.toContain('slice_of_life')
    expect(host.textContent).toContain('Wholesome')
  })
})
