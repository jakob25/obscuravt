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


const TAG_ROWS = [
  { id: 'nclust_darkroom', tag: 'The Darkroom', category: 'niche_cluster', sort_order: 1, description: 'Photography, film, visual arts, photo editing', color: '#7c5c3a' },
  { id: 'nclust_arcade', tag: 'The Arcade', category: 'niche_cluster', sort_order: 7, description: 'Arcade games, retro cabinets, rhythm games', color: '#3b82f6' },
  { id: 'nclust_cursed_asmr', tag: 'Cursed ASMR', category: 'niche_cluster', sort_order: 11, description: 'Glitchy, unsettling, liminal-space ASMR — whispers from somewhere wrong', color: '#39ff14' },
  { id: 'clust_chaos', tag: 'Chaos', category: 'cluster', sort_order: 2, description: 'Unhinged gremlin energy', color: '#f97316' },
  { id: 'clust_comfy', tag: 'Comfy / Lore', category: 'cluster', sort_order: 3 },
]

function tagsFetchMock() {
  return vi.fn(async (input: RequestInfo) => {
    const url = String(input)
    if (url.includes('/api/tags')) {
      return { ok: true, json: async () => TAG_ROWS }
    }
    return { ok: true, json: async () => ({}) }
  })
}



let host: HTMLDivElement
let root: Root

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  auth.user = { username: 'Nim', coins: 0, role: 'fan', isAdmin: false }
  auth.loading = false
  vi.stubGlobal('fetch', tagsFetchMock())
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
    expect(host.querySelector<HTMLInputElement>('#link')?.placeholder).toBe(VTUBER_SUBMIT.linkPlaceholder)
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

  it('lists live niches by their real names, not the old hardcoded constellations', async () => {
    await mount()
    const skip = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.skipLink)
    await act(async () => skip?.click())
    await setInput(host.querySelector<HTMLInputElement>('#name')!, 'Pipuru')
    const next = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.next)
    await act(async () => next?.click())
    expect(heading()).toBe(VTUBER_SUBMIT.steps.tags.title)
    expect(heading()).toBe("What's your niche?")
    expect(host.textContent).toContain('Photography, film, visual arts, photo editing')
    expect(host.textContent).toContain('The Darkroom')
    expect(host.textContent).toContain('Cursed ASMR')
    expect(host.textContent).toContain('Chaos')
    expect(host.textContent).toContain('Comfy / Lore')
    expect(host.textContent).not.toContain('Slice of life')
    expect(host.textContent).not.toContain('clust_')
    expect(host.textContent).toContain('Wholesome')
  })

  it('skips the niche step and reviews that no niche was picked', async () => {
    await mount()
    const skipLink = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.skipLink)
    await act(async () => skipLink?.click())
    await setInput(host.querySelector<HTMLInputElement>('#name')!, 'Pipuru')
    const next = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.next)
    await act(async () => next?.click())
    const skip = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.skipTags)
    await act(async () => skip?.click())
    expect(heading()).toBe(VTUBER_SUBMIT.steps.review.title)
    expect(host.textContent).toContain(VTUBER_SUBMIT.noNiche)
  })

  it('selects an existing niche instead of adding a duplicate custom category, and hints at close matches', async () => {
    await mount()
    const skipLink = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.skipLink)
    await act(async () => skipLink?.click())
    await setInput(host.querySelector<HTMLInputElement>('#name')!, 'Pipuru')
    const next = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.next)
    await act(async () => next?.click())

    await setInput(host.querySelector<HTMLInputElement>('#custom-niche')!, 'the darkroom')
    const add = [...host.querySelectorAll('button')].find(b => b.textContent === VTUBER_SUBMIT.addCategoryButton)
    await act(async () => add?.click())
    const darkroom = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('The Darkroom'))
    expect(darkroom).toBeTruthy()
    expect(darkroom?.textContent).toContain('Photography, film, visual arts, photo editing')
    expect(darkroom?.style.borderColor.toLowerCase()).toMatch(/#7c5c3a|rgb\(124,\s*92,\s*58\)/)
    for (const span of darkroom!.querySelectorAll('span')) {
      expect(span.style.color).toBe('')
    }

    await setInput(host.querySelector<HTMLInputElement>('#custom-niche')!, 'ASMR')
    await act(async () => add?.click())
    expect(host.textContent).toContain(VTUBER_SUBMIT.closeMatch('Cursed ASMR'))

    await setInput(host.querySelector<HTMLInputElement>('#custom-niche')!, 'Liminal radio')
    await act(async () => add?.click())
    expect(host.textContent).toContain('Liminal radio')
    expect(host.textContent).toContain(VTUBER_SUBMIT.categoryNew)

    const cursed = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Cursed ASMR'))
    await act(async () => cursed?.click())
    expect(cursed?.style.borderColor.toLowerCase()).toMatch(/#39ff14|rgb\(57,\s*255,\s*20\)/)
    for (const span of cursed!.querySelectorAll('span')) {
      expect(span.style.color).toBe('')
    }
  })
})
