'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export interface CardRgbTear {
  id: number
  top: number
  height: number
  shift: number
  delay: number
  duration: number
  iterations: number
}

export function buildCardRgbTears(intensity: number, micro: boolean): CardRgbTear[] {
  const count = micro ? Math.floor(rand(2, 5)) : Math.floor(rand(3, 7))
  return Array.from({ length: count }, (_, id) => ({
    id,
    top: rand(6, 90),
    height: micro ? rand(1, 3) : rand(2, 7),
    shift: rand(3, 12) * intensity,
    delay: rand(0, 0.16),
    duration: rand(0.07, 0.13),
    iterations: micro ? Math.floor(rand(3, 6)) : Math.floor(rand(5, 10)),
  }))
}

interface Options {
  staggerMs?: number
  enabled?: boolean
}

export function useCardRgbGlitch({ staggerMs = 0, enabled = true }: Options = {}) {
  const [active, setActive] = useState(false)
  const [intensity, setIntensity] = useState(0.5)
  const [micro, setMicro] = useState(false)
  const [tears, setTears] = useState<CardRgbTear[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const paused = useRef(false)

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
  }, [])

  const arm = useCallback(() => {
    if (paused.current || !enabled) return

    const longPause = Math.random() < 0.12
    const delay = longPause ? rand(28_000, 42_000) : rand(14_000, 30_000)

    schedule(() => {
      if (paused.current || !enabled) return

      const isMicro = Math.random() < 0.65
      const nextIntensity = isMicro ? rand(0.25, 0.42) : rand(0.45, 0.68)
      setMicro(isMicro)
      setIntensity(nextIntensity)
      setTears(buildCardRgbTears(nextIntensity, isMicro))
      setActive(true)

      const burstMs = isMicro ? rand(220, 420) : rand(380, 680)
      schedule(() => {
        setActive(false)
        setTears([])
        arm()
      }, burstMs)
    }, delay)
  }, [enabled, schedule])

  useEffect(() => {
    if (!enabled) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const onVisibility = () => {
      if (document.hidden) {
        paused.current = true
        clearAll()
        setActive(false)
        setTears([])
      } else {
        paused.current = false
        schedule(arm, rand(5_000, 12_000) + staggerMs)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    schedule(arm, rand(4_000, 10_000) + staggerMs)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearAll()
    }
  }, [arm, clearAll, enabled, schedule, staggerMs])

  return { active, intensity, micro, tears }
}