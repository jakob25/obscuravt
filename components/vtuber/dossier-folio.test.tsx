// @vitest-environment happy-dom
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DossierFolio } from './dossier-folio'
import { DossierArtSheet } from './dossier-art-sheet'

let host: HTMLDivElement
let root: Root
let profileMounts: number
let mobile: boolean
let reduced: boolean
let resize: (() => void) | undefined

function Profile() {
  useEffect(() => { profileMounts += 1 }, [])
  // eslint-disable-next-line @next/next/no-html-link-for-pages -- test fixture needs a native anchor for tap/swipe assertions
  return <div>Real profile content <a href="/vtuber/real/fan-corner">Fan corner</a><input aria-label="Existing input" /></div>
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  profileMounts = 0
  mobile = false
  reduced = false
  resize = undefined
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    get matches() { return query.includes('800px') ? mobile : reduced },
    media: query,
    addEventListener: (_: string, listener: () => void) => { if (query.includes('800px')) resize = listener },
    removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => true, onchange: null,
  } as unknown as MediaQueryList))
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { configurable: true, value: vi.fn() })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

async function mount() {
  await act(async () => root.render(
    <DossierFolio name="A long real creator name" caseId="OVT-12345" accessLine="● CLAIMED FILE" avatarUrl={null} handle="@real" platform="Twitch" cluster="Variety" collective="Existing collective" snapshot="Actual creator snapshot."
      profile={<Profile />} world={<p>No world lore on file.</p>} clips={<a href="https://clips.twitch.tv/real">Real clip</a>} art={<p>No art on file.</p>} />
  ))
}
function button(label: string) { return host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)! }
function tab(key: string) { return host.querySelector<HTMLButtonElement>(`[role="tab"][id$="-${key}-tab"]`)! }
function panel(key: string) { return host.querySelector<HTMLElement>(`[data-swipe-page="${key}"]`)! }
async function click(element: HTMLElement) { await act(async () => element.click()) }
async function open() { await mount(); await click(button('Open dossier: A long real creator name')) }
async function finishTurn() {
  const moving = host.querySelector('[data-turn-direction]')
  if (moving) await act(async () => moving.dispatchEvent(new Event('animationend', { bubbles: true })))
}
async function pointer(target: HTMLElement, type: string, x: number, y: number, options: Partial<PointerEventInit> = {}) {
  await act(async () => target.dispatchEvent(new PointerEvent(type, { pointerType: 'touch', pointerId: 1, isPrimary: true, clientX: x, clientY: y, bubbles: true, ...options })))
}
async function swipe(target: HTMLElement, from: [number, number], to: [number, number]) {
  await pointer(target, 'pointerdown', ...from)
  await pointer(target, 'pointermove', ...to)
  await pointer(target, 'pointerup', ...to)
}

describe('refined warm dossier', () => {
  it('places real identity and snapshot directly on the warm cover with a truthful red stamp', async () => {
    await mount()
    const cover = button('Open dossier: A long real creator name')
    expect(cover.textContent).toContain('A long real creator name')
    expect(cover.textContent).toContain('@real')
    expect(cover.textContent).toContain('Variety')
    expect(cover.textContent).toContain('Existing collective')
    expect(cover.textContent).toContain('Actual creator snapshot.')
    expect(cover.textContent).toContain('FILE ON RECORD')
    expect(cover.textContent).not.toContain('FICTIONAL')
    expect(cover.textContent).not.toContain('VERIFIED')
    expect(host.querySelector('a[href="/vtuber/real/fan-corner"]')?.closest('[inert]')).not.toBeNull()
    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(4)
  })

  it('opens to desktop World beside one stationary real profile, and restores focus on closing', async () => {
    await open()
    const opener = button('Open dossier: A long real creator name')
    expect(document.activeElement).toBe(tab('world'))
    expect(panel('profile').getAttribute('role')).toBe('region')
    expect(panel('profile').getAttribute('aria-hidden')).toBe('false')
    await click(tab('clips'))
    expect(tab('clips').getAttribute('aria-selected')).toBe('true')
    expect(panel('world').getAttribute('data-turn-direction')).toBe('forward')
    expect(profileMounts).toBe(1)
    await click(button('Close dossier'))
    expect(document.activeElement).toBe(opener)
    expect(profileMounts).toBe(1)
  })

  it('uses desktop-visible roving tabs and forward/backward turns without duplicated records', async () => {
    await open()
    await act(async () => tab('world').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(document.activeElement).toBe(tab('clips'))
    expect(panel('world').getAttribute('aria-hidden')).toBe('true')
    expect(panel('world').hasAttribute('inert')).toBe(true)
    await finishTurn()
    expect(panel('world').hidden).toBe(true)
    await act(async () => tab('clips').dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })))
    expect(document.activeElement).toBe(tab('art'))
    await finishTurn()
    await act(async () => tab('art').dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })))
    expect(document.activeElement).toBe(tab('world'))
    expect(panel('world').getAttribute('data-turn-direction')).toBe('backward')
    expect(panel('profile').getAttribute('data-turn-direction')).toBeNull()
    expect(profileMounts).toBe(1)
  })

  it('locks navigation until the current turn finishes, as the approved study does', async () => {
    await open()
    await click(tab('clips'))
    await click(tab('art'))
    expect(tab('clips').getAttribute('aria-selected')).toBe('true')
    await finishTurn()
    await click(tab('art'))
    expect(tab('art').getAttribute('aria-selected')).toBe('true')
    expect(profileMounts).toBe(1)
  })

  it('opens mobile to Profile and supports Previous/Next without swiping', async () => {
    mobile = true
    await open()
    expect(document.activeElement).toBe(tab('profile'))
    expect(panel('profile').getAttribute('role')).toBe('tabpanel')
    expect(panel('world').hidden).toBe(true)
    const controls = [...panel('profile').querySelectorAll<HTMLButtonElement>('footer button')]
    expect(controls[0].disabled).toBe(true)
    await click(controls[1])
    expect(tab('world').getAttribute('aria-selected')).toBe('true')
    await finishTurn()
    await click(panel('world').querySelector<HTMLButtonElement>('footer button')!)
    expect(tab('profile').getAttribute('aria-selected')).toBe('true')
    expect(profileMounts).toBe(1)
  })

  it('turns left and right on mobile with the corresponding animation direction', async () => {
    mobile = true
    await open()
    await swipe(panel('profile'), [220, 100], [90, 108])
    expect(tab('world').getAttribute('aria-selected')).toBe('true')
    expect(panel('profile').getAttribute('data-turn-direction')).toBe('forward')
    await finishTurn()
    await swipe(panel('world'), [70, 100], [210, 108])
    expect(tab('profile').getAttribute('aria-selected')).toBe('true')
    expect(panel('profile').getAttribute('data-turn-direction')).toBe('backward')
    expect(profileMounts).toBe(1)
  })

  it('locks vertical intention so a later sideways movement cannot hijack scrolling', async () => {
    mobile = true
    await open()
    const surface = panel('profile')
    await pointer(surface, 'pointerdown', 200, 100)
    await pointer(surface, 'pointermove', 195, 140)
    await pointer(surface, 'pointermove', 70, 145)
    await pointer(surface, 'pointerup', 60, 150)
    expect(tab('profile').getAttribute('aria-selected')).toBe('true')
    expect(HTMLElement.prototype.setPointerCapture).not.toHaveBeenCalled()
  })

  it('does not turn for short, diagonal, mouse, nonprimary, or input gestures', async () => {
    mobile = true
    await open()
    const surface = panel('profile')
    await swipe(surface, [150,100], [120,103])
    await swipe(surface, [200,100], [120,165])
    await pointer(surface, 'pointerdown', 200,100,{pointerType:'mouse'})
    await pointer(surface, 'pointermove', 60,100,{pointerType:'mouse'})
    await pointer(surface, 'pointerup', 60,100,{pointerType:'mouse'})
    await pointer(surface, 'pointerdown', 200,100,{isPrimary:false})
    await pointer(surface, 'pointerup', 60,100,{isPrimary:false})
    await swipe(surface.querySelector('input')!, [200,100], [60,100])
    expect(tab('profile').getAttribute('aria-selected')).toBe('true')
  })

  it('preserves native link taps but suppresses the synthesized click after a deliberate link swipe', async () => {
    mobile = true
    await open()
    const link = panel('profile').querySelector('a')!
    const handler = vi.fn((event: Event) => event.preventDefault())
    link.addEventListener('click', handler)
    await swipe(link, [200,100], [197,102])
    await click(link)
    expect(handler).toHaveBeenCalledTimes(1)
    await swipe(link, [220,100], [80,105])
    expect(tab('world').getAttribute('aria-selected')).toBe('true')
    const synthetic = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })
    await act(async () => link.dispatchEvent(synthetic))
    expect(synthetic.defaultPrevented).toBe(true)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('clears canceled/lost captures, ignores slow gestures, and does not wrap at page boundaries', async () => {
    vi.useFakeTimers()
    mobile = true
    await open()
    const surface = panel('profile')
    await pointer(surface, 'pointerdown', 220,100)
    await pointer(surface, 'pointermove', 90,105)
    await pointer(surface, 'pointercancel', 90,105)
    await pointer(surface, 'pointerup', 90,105)
    await pointer(surface, 'pointerdown', 220,100)
    await pointer(surface, 'pointermove', 90,105)
    await pointer(surface, 'lostpointercapture', 90,105)
    await pointer(surface, 'pointerup', 90,105)
    await pointer(surface, 'pointerdown', 220,100)
    await pointer(surface, 'pointermove', 90,105)
    await act(async () => vi.advanceTimersByTime(1900))
    await pointer(surface, 'pointerup', 90,105)
    await swipe(surface, [50,100], [200,105])
    expect(tab('profile').getAttribute('aria-selected')).toBe('true')
  })

  it('uses an adaptive distance threshold and never wraps past the last sheet', async () => {
    mobile = true
    await open()
    const surface = panel('profile')
    Object.defineProperty(surface, 'clientWidth', { configurable: true, value: 390 })
    await swipe(surface, [220,100], [168,105])
    expect(tab('profile').getAttribute('aria-selected')).toBe('true')
    await swipe(surface, [220,100], [155,105])
    expect(tab('world').getAttribute('aria-selected')).toBe('true')
    await finishTurn()
    await click(tab('art'))
    await finishTurn()
    await swipe(panel('art'), [220,100], [70,105])
    expect(tab('art').getAttribute('aria-selected')).toBe('true')
  })

  it('allows a fresh physical tap immediately after a completed swipe', async () => {
    mobile = true
    await open()
    await swipe(panel('profile'), [220,100], [70,105])
    await finishTurn()
    const artTab = tab('art')
    await pointer(artTab, 'pointerdown', 200,10)
    await pointer(artTab, 'pointerup', 200,10)
    await act(async () => artTab.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })))
    expect(artTab.getAttribute('aria-selected')).toBe('true')
  })

  it('ignores desktop swipes and switches to safe desktop World when resizing from mobile Profile', async () => {
    await open()
    await swipe(panel('world'), [220,100], [70,105])
    expect(tab('world').getAttribute('aria-selected')).toBe('true')
    await click(button('Close dossier'))
    mobile = true
    await act(async () => resize?.())
    await click(button('Open dossier: A long real creator name'))
    expect(tab('profile').getAttribute('aria-selected')).toBe('true')
    mobile = false
    await act(async () => resize?.())
    expect(tab('world').getAttribute('aria-selected')).toBe('true')
    expect(panel('profile').getAttribute('aria-hidden')).toBe('false')
    expect(document.activeElement).toBe(tab('world'))
  })

  it('does not animate or lock pages when reduced motion is preferred', async () => {
    reduced = true
    mobile = true
    await open()
    await swipe(panel('profile'), [220,100], [70,105])
    expect(host.querySelector('[data-turn-direction]')).toBeNull()
    await click(tab('art'))
    expect(tab('art').getAttribute('aria-selected')).toBe('true')
  })
})

describe('real art sheet', () => {
  it('distinguishes empty data from an unavailable feed', async () => {
    await act(async () => root.render(<DossierArtSheet art={[]} unavailable={false} vtuberId="real" />))
    expect(host.textContent).toContain('No art on file.')
    await act(async () => root.render(<DossierArtSheet art={[]} unavailable vtuberId="real" />))
    expect(host.textContent).toContain('Art is temporarily unavailable.')
    expect(host.querySelector('a')?.getAttribute('href')).toBe('/fan-art?vtuber=real')
  })

  it('preserves source-only submissions and labels submitters without inventing artist credit', async () => {
    await act(async () => root.render(<DossierArtSheet art={[{ id: 'source-only', image_url: null, twitter_url: 'https://x.com/example/status/1', submitted_by: 'fan' }]} unavailable={false} vtuberId="real" />))
    expect(host.textContent).toContain('Submitted by fan')
    expect(host.querySelector('a[href="https://x.com/example/status/1"]')?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(host.querySelector('button')).toBeNull()
  })

  it('opens artwork in a labelled, keyboard-dismissable focus-managed dialog', async () => {
    await act(async () => root.render(<DossierArtSheet art={[{ id: 'image', image_url: 'https://example.com/art.jpg', twitter_url: 'https://x.com/example/status/1', submitted_by: null }]} unavailable={false} vtuberId="real" />))
    const trigger = button('Expand artwork 1')
    await click(trigger)
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.getAttribute('aria-labelledby')).toBeTruthy()
    expect(dialog?.querySelector('img')?.getAttribute('src')).toBe('https://example.com/art.jpg')
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })
    expect(document.activeElement).toBe(trigger)
  })

  it('shows only the pages a creator has when there is no niche page', async () => {
    await act(async () => root.render(
      <DossierFolio name="No niche creator" caseId="OVT-00001" accessLine="● CLAIMED FILE" avatarUrl={null} handle="@real" platform="Twitch"
        profile={<Profile />} clips={<p>Real clip</p>} art={<p>No art on file.</p>} />
    ))
    await click(button('Open dossier: No niche creator'))
    expect(host.querySelector('[data-swipe-page="world"]')).toBeNull()
    expect(tab('clips').getAttribute('aria-selected')).toBe('true')
    expect(panel('clips').textContent).toContain('02 / 03 · Clips')
    expect(panel('art').textContent).toContain('03 / 03 · Art')
  })

  it('places a named niche page second, after the profile', async () => {
    await act(async () => root.render(
      <DossierFolio name="Niche creator" caseId="OVT-00002" accessLine="● CLAIMED FILE" avatarUrl={null} handle="@real" platform="Twitch"
        profile={<Profile />} nichePage={{ key: 'pictures', label: 'Pictures', content: <p>Real photo post</p> }} clips={<p>Real clip</p>} art={<p>No art on file.</p>} />
    ))
    await click(button('Open dossier: Niche creator'))
    expect(tab('pictures').textContent).toBe('Pictures')
    expect(tab('pictures').getAttribute('aria-selected')).toBe('true')
    expect(panel('pictures').textContent).toContain('02 / 04 · Pictures')
  })
})
