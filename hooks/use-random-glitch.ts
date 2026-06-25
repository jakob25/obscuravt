'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type GlitchPreset = 'viewport' | 'surface' | 'hero' | 'dossier'

interface PresetConfig {
  microChance: number
  initialDelay: [number, number]
  interval: [number, number]
  microBurst: [number, number]
  fullBurst: [number, number]
  microIntensity: [number, number]
  fullIntensity: [number, number]
}

const PRESETS: Record<GlitchPreset, PresetConfig> = {
  viewport: {
    microChance: 1,
    initialDelay: [5000, 10000],
    interval: [8000, 15000],
    microBurst: [200, 380],
    fullBurst: [280, 420],
    microIntensity: [0.2, 0.35],
    fullIntensity: [0.25, 0.4],
  },
  surface: {
    microChance: 0.42,
    initialDelay: [2000, 5000],
    interval: [3000, 9000],
    microBurst: [280, 550],
    fullBurst: [650, 1200],
    microIntensity: [0.32, 0.52],
    fullIntensity: [0.6, 0.9],
  },
  hero: {
    microChance: 0.32,
    initialDelay: [1200, 3200],
    interval: [2000, 7000],
    microBurst: [300, 580],
    fullBurst: [750, 1400],
    microIntensity: [0.35, 0.55],
    fullIntensity: [0.7, 1],
  },
  dossier: {
    microChance: 0.55,
    initialDelay: [4000, 8000],
    interval: [6000, 14000],
    microBurst: [220, 450],
    fullBurst: [500, 900],
    microIntensity: [0.25, 0.45],
    fullIntensity: [0.45, 0.7],
  },
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function randRange([min, max]: [number, number]) {
  return rand(min, max)
}

interface Options {
  preset?: GlitchPreset
  enabled?: boolean
}

export function useRandomGlitch({ preset = 'surface', enabled = true }: Options = {}) {
  const [active, setActive] = useState(false)
  const [intensity, setIntensity] = useState(1)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const paused = useRef(false)
  const config = PRESETS[preset]

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const arm = useCallback(
    (delayMs: number) => {
      const id = setTimeout(() => {
        if (paused.current || !enabled) return

        const micro = Math.random() < config.microChance
        setIntensity(
          micro
            ? randRange(config.microIntensity)
            : randRange(config.fullIntensity),
        )
        setActive(true)

        const burstMs = micro
          ? randRange(config.microBurst)
          : randRange(config.fullBurst)

        const offId = setTimeout(() => {
          setActive(false)
          if (!paused.current && enabled) {
            arm(randRange(config.interval))
          }
        }, burstMs)
        timers.current.push(offId)
      }, delayMs)
      timers.current.push(id)
    },
    [config, enabled],
  )

  useEffect(() => {
    if (!enabled) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const onVisibility = () => {
      if (document.hidden) {
        paused.current = true
        clearAll()
        setActive(false)
      } else {
        paused.current = false
        arm(randRange(config.initialDelay))
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    arm(randRange(config.initialDelay))

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearAll()
    }
  }, [enabled, config, arm, clearAll])

  return { active, intensity, isMicro: active && intensity < 0.55 }
}