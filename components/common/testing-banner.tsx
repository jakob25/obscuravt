'use client'

import { useState, useEffect } from 'react'
import { SignalSurface } from '@/components/vault/signal-surface'

export function TestingBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('obscuravt_testing_dismissed')
    if (!dismissed) {
      setShow(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('obscuravt_testing_dismissed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <SignalSurface preset="surface" variant="minimal" className="fixed top-0 left-0 right-0 z-[100] bg-[#0a0a14] border-b border-[var(--archive-border)] text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3 text-[#d4a843]">
          <span className="font-medium font-mono tracking-wider">◈ EARLY TESTING</span>
          <span className="text-[#d4a843]/80">
            ObscuraVT is currently in early testing. Things may break.
          </span>
          <a
            href="https://twitter.com/blujayrx"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors font-medium"
          >
            Report feedback to @blujayrx on X
          </a>
        </div>

        <button
          onClick={dismiss}
          className="text-[#d4a843]/60 hover:text-[#d4a843] transition-colors text-xs px-2 py-1"
        >
          Dismiss
        </button>
      </div>
    </SignalSurface>
  )
}
