import { describe, it, expect } from 'vitest'
import { worldInput, type WorldInput } from './schema'
const base = (): WorldInput => ({ slug: 'test-world', name: 'Example world', bio: 'Example lore', member_vtuber_ids: ['one'], world_details: { sources: ['https://example.com/lore'], membership_sources: {one: ['https://example.com/cast']}, cast: [] } })
describe('world evidence and account-independent casts', () => {
  it('allows one dossier with multiple characters and no claim or platform fields', () => {
    const world = base(); world.world_details.cast = ['First', 'Second'].map(name => ({name, description: '', sources: ['https://example.com/cast']}))
    expect(worldInput.safeParse(world).success).toBe(true)
  })
  it('allows multiple dossiers in editorial order', () => {
    const world = base(); world.member_vtuber_ids.push('two'); world.world_details.membership_sources.two = ['https://example.com/two']
    expect(worldInput.parse(world).member_vtuber_ids).toEqual(['one','two'])
  })
  it('allows cast-only worlds without forcing profiles', () => { const world = base(); world.member_vtuber_ids = []; world.world_details.membership_sources = {}; expect(worldInput.safeParse(world).success).toBe(true) })
  it('requires a public source for every membership', () => { const world = base(); world.world_details.membership_sources = {}; expect(worldInput.safeParse(world).success).toBe(false) })
  it('rejects sources for unselected dossiers', () => { const world = base(); world.world_details.membership_sources.extra = ['https://example.com']; expect(worldInput.safeParse(world).success).toBe(false) })
  it('requires evidence for lore and characters', () => { const world = base(); world.world_details.sources = []; expect(worldInput.safeParse(world).success).toBe(false); world.world_details.sources = ['https://example.com']; world.world_details.cast = [{name:'Test',description:'',sources:[]}]; expect(worldInput.safeParse(world).success).toBe(false) })
  it.each(['javascript:alert(1)', 'data:text/html,test', 'http://example.com', 'https://user:password@example.com'])('rejects unsafe source %s', source => { const world=base(); world.world_details.sources=[source]; expect(worldInput.safeParse(world).success).toBe(false) })
  it('rejects forced ownership and discriminator fields', () => { expect(worldInput.safeParse({...base(),kind:'corpo',created_by:'owner'}).success).toBe(false) })
  it('rejects duplicate dossiers', () => { const world=base();world.member_vtuber_ids.push('one');expect(worldInput.safeParse(world).success).toBe(false) })
  it('rejects unsafe URL slugs', () => { expect(worldInput.safeParse({...base(),slug:'../admin'}).success).toBe(false) })
})
