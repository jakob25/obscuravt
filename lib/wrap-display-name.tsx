import { createElement, type ReactNode } from 'react'

/**
 * Split a display name so it can wrap at word or camelCase boundaries
 * ("AmekawaAkira" → "Amekawa" + "Akira") instead of in the middle of a word.
 */
export function splitDisplayName(name: string): string[] {
  const parts: string[] = []
  let current = ''
  for (let i = 0; i < name.length; i++) {
    const ch = name[i]
    const prev = name[i - 1]
    const next = name[i + 1]
    const camel = Boolean(prev && /[a-z0-9]/.test(prev) && /[A-Z]/.test(ch))
    const acronym = Boolean(prev && /[A-Z]/.test(prev) && /[A-Z]/.test(ch) && next && /[a-z]/.test(next))
    if (current && (camel || acronym)) {
      parts.push(current)
      current = ch
    } else {
      current += ch
    }
  }
  if (current) parts.push(current)
  return parts.length ? parts : [name]
}

/** Render a name with <wbr> hints at those boundaries. */
export function wrapDisplayName(name: string): ReactNode {
  const parts = splitDisplayName(name)
  if (parts.length <= 1) return name
  const nodes: ReactNode[] = []
  parts.forEach((part, i) => {
    if (i > 0) nodes.push(createElement('wbr', { key: `w${i}` }))
    nodes.push(part)
  })
  return nodes
}
