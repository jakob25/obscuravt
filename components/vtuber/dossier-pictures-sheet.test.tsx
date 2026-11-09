// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DossierPicturesSheet } from './dossier-pictures-sheet'

const WIDGETS_SRC = 'https://platform.twitter.com/widgets.js'

let host: HTMLDivElement
let root: Root
let observerCallback: IntersectionObserverCallback | undefined

const posts = [
  { id: 'newer', post_url: 'https://x.com/someone/status/222' },
  { id: 'older', post_url: 'https://x.com/someone/status/111' },
]

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  observerCallback = undefined
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { observerCallback = callback }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
    root = null
    rootMargin = ''
    thresholds = []
  })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  document.querySelectorAll(`script[src="${WIDGETS_SRC}"]`).forEach(node => node.remove())
  vi.unstubAllGlobals()
})

describe('dossier pictures sheet', () => {
  it('renders post links in the given (newest-first) order and does not load widgets until opened', async () => {
    await act(async () => root.render(<DossierPicturesSheet posts={posts} />))
    const hrefs = [...host.querySelectorAll('a')].map(link => link.getAttribute('href'))
    expect(hrefs).toEqual(['https://x.com/someone/status/222', 'https://x.com/someone/status/111'])
    expect(host.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(host.querySelector('blockquote.twitter-tweet')).not.toBeNull()
    expect(document.querySelector(`script[src="${WIDGETS_SRC}"]`)).toBeNull()

    await act(async () => {
      observerCallback?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
    })
    expect(document.querySelector(`script[src="${WIDGETS_SRC}"]`)).toBeNull()

    await act(async () => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    })
    expect(document.querySelectorAll(`script[src="${WIDGETS_SRC}"]`)).toHaveLength(1)

    await act(async () => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    })
    expect(document.querySelectorAll(`script[src="${WIDGETS_SRC}"]`)).toHaveLength(1)
  })
})
