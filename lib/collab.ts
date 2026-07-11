export interface CollabRequestInput {
  request_type: string
  game_or_activity: string
  on_stream: boolean
  availability: string
  contact_twitter: string
  contact_discord: string
  expires_in_days: number
}

export function validateCollabRequestInput(input: Partial<CollabRequestInput>) {
  const errors: Record<string, string> = {}

  if (!input.request_type?.trim()) {
    errors.request_type = 'Please choose a request type.'
  }

  if (!input.game_or_activity?.trim()) {
    errors.game_or_activity = 'Please describe the game or activity.'
  }

  const hasContact = Boolean(input.contact_twitter?.trim() || input.contact_discord?.trim())
  if (!hasContact) {
    errors.contact = 'Please add a Twitter/X handle or Discord username.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function findSharedTags(tagsA: string[] = [], tagsB: string[] = []) {
  const setB = new Set(tagsB)
  return tagsA.filter(tag => setB.has(tag))
}
