// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { TestingBanner } from './testing-banner'
import { SITE_CONTACT, TESTING_BANNER } from '@/lib/site-copy'

describe('TestingBanner', () => {
  let host: HTMLDivElement
  let root: Root

  beforeEach(() => {
    window.localStorage.clear()
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    host.remove()
    window.localStorage.clear()
  })

  it('links feedback to the shared site contact on X', async () => {
    await act(async () => {
      root.render(<TestingBanner />)
    })
    const link = host.querySelector('a')
    expect(link?.textContent).toBe(TESTING_BANNER.feedback)
    expect(link?.getAttribute('href')).toBe(SITE_CONTACT.url)
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
  })
})
