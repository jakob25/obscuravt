import { describe, expect, it } from 'vitest'
import { findSharedTags, validateCollabRequestInput } from './collab'

describe('validateCollabRequestInput', () => {
  it('requires a request type, activity, and at least one contact method', () => {
    const result = validateCollabRequestInput({
      request_type: '',
      game_or_activity: '',
      on_stream: true,
      availability: '',
      contact_twitter: '',
      contact_discord: '',
      expires_in_days: 3,
    })

    expect(result.valid).toBe(false)
    expect(result.errors.request_type).toBe('Please choose a request type.')
    expect(result.errors.game_or_activity).toBe('Please describe the game or activity.')
    expect(result.errors.contact).toBe('Please add a Twitter/X handle or Discord username.')
  })

  it('accepts a valid request with either contact field', () => {
    const result = validateCollabRequestInput({
      request_type: 'Collab',
      game_or_activity: 'Lethal Company',
      on_stream: false,
      availability: 'Evenings EST',
      contact_twitter: '@test',
      contact_discord: '',
      expires_in_days: 7,
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })
})

describe('findSharedTags', () => {
  it('returns the overlap between two tag arrays', () => {
    expect(findSharedTags(['vibe_hype', 'cont_gaming', 'vibe_chill'], ['cont_gaming', 'vibe_lore'])).toEqual(['cont_gaming'])
  })
})
