'use client'

import { useState, useEffect, useRef, useCallback, type RefObject } from 'react'

export interface NavBgFlash {
  id: string
  left: number
  width: number
  intensity: number
  micro: boolean
}

interface Zone {
  start: number
  end: number
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1))
}

function zonesOverlap(a: Zone, b: Zone, pad = 0.02) {
  return a.start - pad < b.end + pad && b.start - pad < a.end + pad
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

type GlitchMode = 'bg' | 'buttons' | 'both'

export function useNavGlitch(headerRef: RefObject<HTMLElement | null>) {
  const [bgFlashes, setBgFlashes] = useState<NavBgFlash[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const paused = useRef(false)
  const flashId = useRef(0)
  const activeBgZones = useRef<Zone[]>([])

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }, [])

  const measureElementZone = useCallback((el: HTMLElement, header: HTMLElement): Zone => {
    const hr = header.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    if (hr.width <= 0) return { start: 0, end: 0 }
    return {
      start: (er.left - hr.left) / hr.width,
      end: (er.right - hr.left) / hr.width,
    }
  }, [])

  const getTargets = useCallback(() => {
    const header = headerRef.current
    if (!header) return []
    return Array.from(header.querySelectorAll<HTMLElement>('[data-nav-glitch]')).filter(el => {
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })
  }, [headerRef])

  const pickBgSection = useCallback((blocked: Zone[]): { left: number; width: number } | null => {
    for (let i = 0; i < 14; i++) {
      const width = rand(14, 40)
      const left = rand(0, 100 - width)
      const zone: Zone = { start: left / 100, end: (left + width) / 100 }
      if (!blocked.some(b => zonesOverlap(zone, b))) {
        return { left, width }
      }
    }
    return null
  }, [])

  const startBgFlash = useCallback(
    (blocked: Zone[]) => {
      const section = pickBgSection(blocked)
      if (!section) return null

      const micro = Math.random() < 0.62
      const intensity = micro ? rand(0.28, 0.48) : rand(0.5, 0.72)
      const id = `bg-${flashId.current++}`
      const zone: Zone = { start: section.left / 100, end: (section.left + section.width) / 100 }

      activeBgZones.current.push(zone)
      setBgFlashes(prev => [...prev, { id, left: section.left, width: section.width, intensity, micro }])

      const duration = micro ? rand(260, 420) : rand(380, 620)
      schedule(() => {
        activeBgZones.current = activeBgZones.current.filter(z => z !== zone)
        setBgFlashes(prev => prev.filter(f => f.id !== id))
      }, duration)

      return zone
    },
    [pickBgSection, schedule],
  )

  const startButtonGlitch = useCallback(
    (blocked: Zone[]) => {
      const header = headerRef.current
      if (!header) return

      const targets = getTargets()
      const eligible = targets.filter(el => {
        const zone = measureElementZone(el, header)
        return !blocked.some(b => zonesOverlap(zone, b))
      })
      if (eligible.length === 0) return

      const maxCount = Math.min(eligible.length, randInt(1, 3))
      const picked = shuffle(eligible).slice(0, maxCount)

      for (const el of picked) {
        const micro = Math.random() < 0.55
        const intensity = micro ? rand(0.3, 0.5) : rand(0.55, 0.8)
        el.style.setProperty('--nav-glitch-intensity', String(intensity))
        el.classList.add('nav-btn-glitching')
        if (micro) el.classList.add('nav-btn-glitching-micro')
        else el.classList.remove('nav-btn-glitching-micro')

        const duration = micro ? rand(220, 400) : rand(320, 520)
        schedule(() => {
          el.classList.remove('nav-btn-glitching', 'nav-btn-glitching-micro')
          el.style.removeProperty('--nav-glitch-intensity')
        }, duration)
      }
    },
    [getTargets, headerRef, measureElementZone, schedule],
  )

  const pickMode = useCallback((): GlitchMode => {
    const r = Math.random()
    if (r < 0.36) return 'bg'
    if (r < 0.72) return 'buttons'
    return 'both'
  }, [])

  const fireEvent = useCallback(() => {
    if (paused.current) return

    const mode = pickMode()

    if (mode === 'bg') {
      startBgFlash([])
      return
    }

    if (mode === 'buttons') {
      startButtonGlitch([])
      return
    }

    const bgZone = startBgFlash([])
    const blocked = bgZone ? [bgZone] : []
    startButtonGlitch(blocked)
  }, [pickMode, startBgFlash, startButtonGlitch])

  const arm = useCallback(() => {
    if (paused.current) return

    const longPause = Math.random() < 0.14
    const delay = longPause ? rand(24_000, 36_000) : rand(9_500, 21_000)

    schedule(() => {
      fireEvent()
      arm()
    }, delay)
  }, [fireEvent, schedule])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const onVisibility = () => {
      if (document.hidden) {
        paused.current = true
        clearAll()
        activeBgZones.current = []
        setBgFlashes([])
        headerRef.current?.querySelectorAll('[data-nav-glitch].nav-btn-glitching').forEach(el => {
          el.classList.remove('nav-btn-glitching', 'nav-btn-glitching-micro')
          ;(el as HTMLElement).style.removeProperty('--nav-glitch-intensity')
        })
      } else {
        paused.current = false
        schedule(arm, rand(4_000, 8_000))
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    schedule(arm, rand(4_000, 8_000))

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearAll()
      headerRef.current?.querySelectorAll('[data-nav-glitch].nav-btn-glitching').forEach(el => {
        el.classList.remove('nav-btn-glitching', 'nav-btn-glitching-micro')
        ;(el as HTMLElement).style.removeProperty('--nav-glitch-intensity')
      })
    }
  }, [arm, clearAll, headerRef, schedule])

  return { bgFlashes }
}