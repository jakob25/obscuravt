'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  /** Site path (made absolute with this site's origin) … */
  path?: string
  /** … or a full outside URL. */
  url?: string
  title?: string
  label: string
  ariaLabel: string
  className?: string
}

/** Share via the device share sheet, or copy the link. No tracking, no outside services. */
export function ShareButton({ path, url, title, label, ariaLabel, className }: ShareButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const link = url || (path ? new URL(path, window.location.origin).toString() : window.location.href)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url: link })
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return // user cancelled
        // fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(link)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={className}>
      <Share2 className="inline h-3 w-3" aria-hidden="true" />{' '}
      <span aria-live="polite">{status === 'copied' ? 'Link copied' : status === 'failed' ? 'Copy failed' : label}</span>
    </button>
  )
}
