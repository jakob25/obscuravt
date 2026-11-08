// @vitest-environment happy-dom
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DossierFolio } from './dossier-folio'
import { DossierArtSheet } from './dossier-art-sheet'

let host: HTMLDivElement
let root: Root
let profileMounts: number

function Profile() {
  useEffect(() => { profileMounts += 1 }, [])
  return <div>Real profile content <a href="/vtuber/real/fan-corner">Fan corner</a></div>
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  profileMounts = 0
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
})

async function mount() {
  await act(async () => root.render(
    <DossierFolio name="A long real creator name" caseId="OVT-12345" accessLine="● CLAIMED FILE" avatarUrl={null} handle="@real" platform="Twitch"
      profile={<Profile />} world={<p>No world lore on file.</p>} clips={<a href="https://clips.twitch.tv/real">Real clip</a>} art={<p>No art on file.</p>} />
  ))
}
function button(label: string) {
  return host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
}
async function click(element: HTMLElement) {
  await act(async () => element.click())
}

describe('dossier folder', () => {
  it('starts closed with a real native open control and inaccessible inner actions', async () => {
    await mount()
    expect(host.querySelector('[data-dossier-state]')?.getAttribute('data-dossier-state')).toBe('closed')
    expect(button('Open dossier: A long real creator name').getAttribute('aria-expanded')).toBe('false')
    expect(host.querySelector('a[href="/vtuber/real/fan-corner"]')?.closest('[inert]')).not.toBeNull()
    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(3)
    expect(host.textContent).not.toContain('VERIFIED SUBJECT')
  })

  it('opens, preserves the real profile instance while switching pages, and restores focus on close', async () => {
    await mount()
    const opener = button('Open dossier: A long real creator name')
    await click(opener)
    expect(host.querySelector('[data-dossier-state]')?.getAttribute('data-dossier-state')).toBe('open')
    expect(document.activeElement).toBe(button('Close dossier'))
    expect(host.querySelector('a[href="/vtuber/real/fan-corner"]')?.closest('[inert]')).toBeNull()
    const clips = host.querySelector<HTMLButtonElement>('[role="tab"][id$="-clips-tab"]')!
    await click(clips)
    expect(clips.getAttribute('aria-selected')).toBe('true')
    expect(profileMounts).toBe(1)
    await click(button('Close dossier'))
    expect(document.activeElement).toBe(opener)
    expect(profileMounts).toBe(1)
  })

  it('supports roving arrow/Home/End tab navigation and inert outgoing sheets', async () => {
    await mount()
    await click(button('Open dossier: A long real creator name'))
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
    await act(async () => tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(document.activeElement).toBe(tabs[1])
    expect(tabs.map(tab => tab.tabIndex)).toEqual([-1, 0, -1])
    const outgoing = host.querySelector<HTMLElement>('[role="tabpanel"][id$="-world-panel"]')!
    expect(outgoing.hasAttribute('inert')).toBe(true)
    expect(outgoing.getAttribute('aria-hidden')).toBe('true')
    await act(async () => outgoing.dispatchEvent(new Event('animationend', { bubbles: true })))
    expect(outgoing.hidden).toBe(true)
    await act(async () => tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })))
    expect(document.activeElement).toBe(tabs[2])
    await act(async () => tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })))
    expect(document.activeElement).toBe(tabs[0])
  })

  it('keeps only the latest outgoing sheet when tabs are changed rapidly', async () => {
    await mount()
    await click(button('Open dossier: A long real creator name'))
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
    await click(tabs[1])
    await click(tabs[2])
    const panels = [...host.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
    expect(panels[0].hidden).toBe(true)
    expect(panels[1].getAttribute('aria-hidden')).toBe('true')
    expect(panels[2].getAttribute('aria-hidden')).toBe('false')
    expect(profileMounts).toBe(1)
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
})
