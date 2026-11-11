// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { colorForTheme } from '@/lib/color-contrast'
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

const navState = { pathname: '/nominator' }

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
}))

const themeState = { resolvedTheme: 'dark' as string | undefined }

vi.mock('next-themes', () => ({
  useTheme: () => themeState,
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
  themeState.resolvedTheme = 'dark'
  navState.pathname = '/nominator'
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

function button(label: string) {
  return [...host.querySelectorAll('button')].find(b => b.textContent === label)
}

async function click(label: string) {
  await act(async () => button(label)?.click())
}

async function setInput(el: HTMLInputElement, value: string) {
  await act(async () => {
    const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
    proto?.set?.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function reach(step: 'tags' | 'niche' | 'constellation' | 'review') {
  await click(VTUBER_SUBMIT.skipLink)
  await setInput(host.querySelector<HTMLInputElement>('#name')!, 'Pipuru')
  await click(VTUBER_SUBMIT.next)
  if (step === 'tags') return
  await click(VTUBER_SUBMIT.next)
  if (step === 'niche') return
  await click(VTUBER_SUBMIT.next)
  if (step === 'constellation') return
  await click(VTUBER_SUBMIT.next)
}

describe('VTuberSubmitForm wizard', () => {
  it('starts signed-out users on Sign in, and signed-in users on the profile link step', async () => {
    auth.user = null
    await mount()
    expect(heading()).toBe(VTUBER_SUBMIT.steps.signin.title)
    expect(host.textContent).toContain(VTUBER_SUBMIT.steps.signin.instruction)
    expect(host.textContent).toContain(VTUBER_SUBMIT.stepOf(1, 7))
    expect(host.querySelectorAll('[data-testid="wizard-steps"] li').length).toBe(7)
    const signIn = host.querySelector('a[href="/login?next=%2Fnominator"]')
    expect(signIn?.textContent).toBe(VTUBER_SUBMIT.signIn)

    await act(async () => root.unmount())
    auth.user = { username: 'Nim', coins: 0, role: 'fan', isAdmin: false }
    root = createRoot(host)
    await mount()
    expect(heading()).toBe(VTUBER_SUBMIT.steps.link.title)
    expect(host.textContent).toContain(VTUBER_SUBMIT.stepOf(1, 6))
    expect(host.textContent).not.toContain(VTUBER_SUBMIT.stepOf(1, 7))
    expect(host.querySelectorAll('[data-testid="wizard-steps"] li').length).toBe(6)
    expect(host.querySelector<HTMLInputElement>('#link')?.placeholder).toBe(VTUBER_SUBMIT.linkPlaceholder)
  })

  it('keeps pasted details when going back from tags to details', async () => {
    await mount()
    await click(VTUBER_SUBMIT.skipLink)
    expect(heading()).toBe(VTUBER_SUBMIT.steps.details.title)

    await setInput(host.querySelector<HTMLInputElement>('#name')!, 'Pipuru')
    await click(VTUBER_SUBMIT.next)
    expect(heading()).toBe(VTUBER_SUBMIT.steps.tags.title)

    await click(VTUBER_SUBMIT.back)
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
    expect(button(VTUBER_SUBMIT.next)?.disabled).toBe(true)
  })

  it('lets someone skip the link and requires a name before leaving details', async () => {
    await mount()
    await click(VTUBER_SUBMIT.skipLink)
    expect(heading()).toBe(VTUBER_SUBMIT.steps.details.title)

    await click(VTUBER_SUBMIT.next)
    expect(heading()).toBe(VTUBER_SUBMIT.steps.details.title)
    expect(host.textContent).toContain('Name must be at least 2 characters')
  })

  it('gives vibe tags, niche, and constellation each their own step', async () => {
    await mount()
    await reach('tags')
    expect(heading()).toBe(VTUBER_SUBMIT.steps.tags.title)
    expect(heading()).toBe('Vibe tags')
    expect(host.textContent).toContain(VTUBER_SUBMIT.steps.tags.instruction)
    expect(host.textContent).toContain('Wholesome')
    expect(host.textContent).not.toContain('Photography, film, visual arts, photo editing')
    expect(host.textContent).not.toContain('Chaos')

    await click(VTUBER_SUBMIT.next)
    expect(heading()).toBe(VTUBER_SUBMIT.steps.niche.title)
    expect(heading()).toBe("What's your niche?")
    expect(host.textContent).toContain(VTUBER_SUBMIT.steps.niche.instruction)
    expect(host.textContent).toContain('Photography, film, visual arts, photo editing')
    expect(host.textContent).toContain('The Darkroom')
    expect(host.textContent).toContain('Cursed ASMR')
    expect(host.textContent).not.toContain('Slice of life')
    expect(host.textContent).not.toContain('clust_')
    expect(host.textContent).not.toContain('Chaos')
    expect(host.textContent).not.toContain('Wholesome')

    await click(VTUBER_SUBMIT.next)
    expect(heading()).toBe(VTUBER_SUBMIT.steps.constellation.title)
    expect(host.textContent).toContain(VTUBER_SUBMIT.steps.constellation.instruction)
    expect(host.textContent).toContain('Chaos')
    expect(host.textContent).toContain('Comfy / Lore')
    expect(host.textContent).not.toContain('Photography, film, visual arts, photo editing')
    expect(host.textContent).not.toContain('clust_')
  })

  it('skips each optional step and reviews that no niche or constellation was picked', async () => {
    await mount()
    await reach('tags')
    await click(VTUBER_SUBMIT.skipTags)
    expect(heading()).toBe(VTUBER_SUBMIT.steps.niche.title)
    await click(VTUBER_SUBMIT.skipTags)
    expect(heading()).toBe(VTUBER_SUBMIT.steps.constellation.title)
    await click(VTUBER_SUBMIT.skipTags)
    expect(heading()).toBe(VTUBER_SUBMIT.steps.review.title)
    expect(host.textContent).toContain(VTUBER_SUBMIT.noNiche)
    expect(host.textContent).toContain(VTUBER_SUBMIT.noConstellation)
    expect(host.textContent).toContain(VTUBER_SUBMIT.reviewedBeforeMaps)
  })

  it('keeps a picked niche and constellation on review', async () => {
    await mount()
    await reach('niche')
    const cursed = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Cursed ASMR'))
    await act(async () => cursed?.click())
    await click(VTUBER_SUBMIT.next)
    const chaos = [...host.querySelectorAll('button')].find(b => b.textContent === 'Chaos')
    await act(async () => chaos?.click())
    await click(VTUBER_SUBMIT.next)
    expect(heading()).toBe(VTUBER_SUBMIT.steps.review.title)
    expect(host.textContent).toContain('Cursed ASMR')
    expect(host.textContent).toContain('Chaos')
    expect(host.textContent).not.toContain(VTUBER_SUBMIT.noNiche)
    expect(host.textContent).not.toContain(VTUBER_SUBMIT.noConstellation)
  })

  it('selects an existing niche instead of adding a duplicate custom category, and hints at close matches', async () => {
    await mount()
    await reach('niche')

    await setInput(host.querySelector<HTMLInputElement>('#custom-niche')!, 'the darkroom')
    await click(VTUBER_SUBMIT.addCategoryButton)
    const darkroom = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('The Darkroom'))
    expect(darkroom).toBeTruthy()
    expect(darkroom?.textContent).toContain('Photography, film, visual arts, photo editing')
    expect(darkroom?.style.borderColor.toLowerCase()).toMatch(/#7c5c3a|rgb\(124,\s*92,\s*58\)/)
    for (const span of darkroom!.querySelectorAll('span')) {
      expect(span.style.color).toBe('')
    }

    await setInput(host.querySelector<HTMLInputElement>('#custom-niche')!, 'ASMR')
    await click(VTUBER_SUBMIT.addCategoryButton)
    expect(host.textContent).toContain(VTUBER_SUBMIT.closeMatch('Cursed ASMR'))

    await setInput(host.querySelector<HTMLInputElement>('#custom-niche')!, 'Liminal radio')
    await click(VTUBER_SUBMIT.addCategoryButton)
    expect(host.textContent).toContain('Liminal radio')
    expect(host.textContent).toContain(VTUBER_SUBMIT.categoryNew)

    const cursed = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Cursed ASMR'))
    await act(async () => cursed?.click())
    expect(cursed?.style.borderColor.toLowerCase()).toMatch(/#39ff14|rgb\(57,\s*255,\s*20\)/)
    for (const span of cursed!.querySelectorAll('span')) {
      expect(span.style.color).toBe('')
    }
  })

  it('closes a compose dialog and returns to the same page with the form reopened after Sign in', async () => {
    navState.pathname = '/discover'
    const onCancel = vi.fn()
    auth.user = null
    await act(async () => root.render(<VTuberSubmitForm onCancel={onCancel} />))
    const signIn = host.querySelector('a[href^="/login"]') as HTMLAnchorElement | null
    expect(signIn?.getAttribute('href')).toBe('/login?next=%2Fdiscover%3Fcompose%3Dvtuber')
    await act(async () => signIn?.click())
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not show Sign in until the session check has finished', async () => {

    auth.user = null
    auth.loading = true
    await mount()
    expect(host.querySelector(`a[href^="/login"]`)).toBeNull()
    expect(host.textContent).toContain('Checking your session')
    auth.loading = false
    await act(async () => root.render(<VTuberSubmitForm />))
    expect(host.querySelector(`a[href^="/login"]`)).toBeTruthy()
  })

  it('in light mode, darkens only a too-bright lime room chip and leaves darker rooms as stored', async () => {

    themeState.resolvedTheme = 'light'
    await mount()
    await reach('niche')

    const darkroom = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('The Darkroom'))
    const arcade = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('The Arcade'))
    const cursed = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Cursed ASMR'))
    expect(darkroom?.style.borderColor.toLowerCase()).toMatch(/#7c5c3a|rgb\(124,\s*92,\s*58\)/)
    expect(arcade?.style.borderColor.toLowerCase()).toMatch(/#3b82f6|rgb\(59,\s*130,\s*246\)/)

    const expected = colorForTheme('#39ff14', 'light', 'accent')!
    expect(expected.toLowerCase()).not.toBe('#39ff14')
    const border = cursed?.style.borderColor.toLowerCase() ?? ''
    expect(border).not.toMatch(/#39ff14|rgb\(57,\s*255,\s*20\)/)
    const hex = expected.toLowerCase()
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    expect(border).toMatch(new RegExp(`${hex}|rgb\\(${r},\\s*${g},\\s*${b}\\)`))
  })

  it('keeps the action bar as a sticky footer and pads the step so lists can scroll clear of it', async () => {
    await mount()
    await reach('constellation')
    const body = host.querySelector('[data-testid="wizard-step-body"]')
    const actions = host.querySelector('[data-testid="wizard-actions"]')
    expect(body?.className).toContain('pb-[calc(11rem+env(safe-area-inset-bottom))]')
    expect(body?.className).toContain('sm:pb-0')
    expect(actions?.className).toContain('sticky')
    expect(actions?.className).toContain('bottom-0')
    expect(actions?.className).not.toContain('bottom-20')
    expect(host.textContent).toContain('Chaos')
    expect(host.textContent).toContain('Comfy / Lore')
  })
})
