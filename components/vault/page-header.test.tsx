// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PageHeader } from '@/components/vault/page-header'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}))

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
})

describe('PageHeader', () => {
  it('stacks the back link above the title instead of sitting them on one row', async () => {
    await act(async () => {
      root.render(
        <PageHeader title="Creator Dashboard" description="Manage claimed profiles and fan tools." fallbackHref="/" />,
      )
    })
    const header = host.querySelector('header')
    const back = header?.querySelector('a')
    const title = header?.querySelector('h1')
    expect(header).toBeTruthy()
    expect(back?.textContent).toContain('Back')
    expect(title?.textContent).toBe('Creator Dashboard')
    expect(back?.className.split(/\s+/)).toContain('flex')
    expect(back?.className.split(/\s+/)).not.toContain('inline-flex')
    expect(title?.className.split(/\s+/)).toContain('block')
    expect(host.textContent).toContain('Manage claimed profiles and fan tools.')
    // Back is the first element in the header; the title follows it.
    expect(header?.firstElementChild).toBe(back)
    expect(back).toBeTruthy()
    expect(title).toBeTruthy()
    expect(back && title && (back.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy()
  })
})
