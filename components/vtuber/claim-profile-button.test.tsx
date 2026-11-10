// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { ClaimProfileButton } from './claim-profile-button'
import { DOSSIER } from '@/lib/site-copy'

const auth = { user: null as { username: string; role: string } | null }

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => auth,
}))

let host: HTMLDivElement
let root: Root

async function mount(props: { claimedBy: string | null; approved?: boolean }) {
  await act(async () => {
    root.render(
      <ClaimProfileButton
        vtuberId="vt_pipuru"
        vtuberName="Pipuru"
        claimedBy={props.claimedBy}
        approved={props.approved}
      />,
    )
  })
}

describe('ClaimProfileButton', () => {
  afterEach(async () => {
    if (root) await act(async () => root.unmount())
    host?.remove()
    auth.user = null
  })

  async function setup() {
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  }

  it('shows a request note on an unclaimed approved profile, even when signed out', async () => {
    await setup()
    auth.user = null
    await mount({ claimedBy: null, approved: true })
    expect(host.textContent).toBe(DOSSIER.requestLink)
    expect(host.querySelector('button')).toBeNull()
  })

  it('keeps the owner, claimed-by, and pending states', async () => {
    await setup()
    auth.user = { username: 'Pipuru', role: 'VTuber' }
    await mount({ claimedBy: 'Pipuru', approved: true })
    expect(host.textContent).toContain('You manage this profile')

    await act(async () => root.unmount())
    host.remove()
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    auth.user = { username: 'Nim', role: 'fan' }
    await mount({ claimedBy: 'Pipuru', approved: true })
    expect(host.textContent).toContain('Claimed by @Pipuru')

    await act(async () => root.unmount())
    host.remove()
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    auth.user = { username: 'Nim', role: 'VTuber' }
    await mount({ claimedBy: null, approved: false })
    expect(host.textContent).toContain('Pending admin approval')
    expect(host.textContent).not.toContain(DOSSIER.requestLink)
  })
})
