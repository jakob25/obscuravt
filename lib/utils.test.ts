import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn (class name utility)', () => {
  it('combines and dedupes classes', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary')
  })
  it('resolves Tailwind conflicts via twMerge', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })
})
