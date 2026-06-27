'use client'

import { AnalogStaticCanvas } from '@/components/vault/analog-static-canvas'

interface SignalGlitchLayersProps {
  active: boolean
  intensity: number
  /** viewport shell: scanlines + canvas only */
  variant?: 'full' | 'minimal'
}

export function SignalGlitchLayers({
  active,
  intensity,
  variant = 'full',
}: SignalGlitchLayersProps) {
  return (
    <>
      <div className="archive-scanlines" aria-hidden />
      <div className="archive-static" aria-hidden />
      {variant === 'full' && (
        <>
          <div className="archive-track" aria-hidden />
          <div className="archive-track archive-track-2" aria-hidden />
          <div className="archive-flash" aria-hidden />
          <div className="archive-slice archive-slice-1" aria-hidden />
          <div className="archive-slice archive-slice-2" aria-hidden />
          <div className="archive-slice archive-slice-3" aria-hidden />
        </>
      )}
      <AnalogStaticCanvas active={active} intensity={active ? intensity : 0} />
    </>
  )
}