import { describe, expect, it } from 'vitest'
import { DOSSIER, SITE_CONTACT, TESTING_BANNER } from './site-copy'
import { HELP_SECTIONS } from './help-content'

describe('SITE_CONTACT', () => {
  it('builds the public X URL and @handle from one handle', () => {
    expect(SITE_CONTACT.handle).toBe('blujayrx')
    expect(SITE_CONTACT.atHandle).toBe('@blujayrx')
    expect(SITE_CONTACT.url).toBe(`https://x.com/${SITE_CONTACT.handle}`)
  })

  it('uses that handle in the banner, the unclaimed-profile note, and help', () => {
    expect(TESTING_BANNER.feedback).toBe(`Report feedback to ${SITE_CONTACT.atHandle} on X`)
    expect(DOSSIER.requestLink).toContain(`Message ${SITE_CONTACT.atHandle} on X`)
    const item = HELP_SECTIONS.flatMap(section => section.items).find(
      entry => entry.q === 'How do I get my VTuber profile linked?',
    )
    expect(item?.a).toContain(`${SITE_CONTACT.atHandle} on X`)
  })
})
