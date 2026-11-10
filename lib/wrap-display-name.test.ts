import { describe, expect, it } from 'vitest'
import { splitDisplayName } from './wrap-display-name'

describe('splitDisplayName', () => {
  it('splits camelCase names at the capital', () => {
    expect(splitDisplayName('AmekawaAkira')).toEqual(['Amekawa', 'Akira'])
  })

  it('leaves spaced or slashed names as one part so CSS can wrap at the spaces', () => {
    expect(splitDisplayName('Amekawa / Akira')).toEqual(['Amekawa / Akira'])
    expect(splitDisplayName('Hakos Baelz')).toEqual(['Hakos Baelz'])
  })

  it('leaves a single word alone', () => {
    expect(splitDisplayName('Gura')).toEqual(['Gura'])
  })

  it('splits an acronym that runs into a word', () => {
    expect(splitDisplayName('USBDrive')).toEqual(['USB', 'Drive'])
  })

  it('splits more than two camelCase parts', () => {
    expect(splitDisplayName('MoriCalliopeOfficial')).toEqual(['Mori', 'Calliope', 'Official'])
  })
})
