'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AnalogStaticCanvasProps {
  active: boolean
  className?: string
  /** 0–1, scales pixel density */
  intensity?: number
}

/**
 * Real per-frame analog static — random 1px specks, not a blurred SVG filter.
 * Used as a full-bleed overlay during glitch bursts.
 */
export function AnalogStaticCanvas({
  active,
  className,
  intensity = 1,
}: AnalogStaticCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !active) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const { width, height } = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      const count = Math.floor((w * h * 0.08) * intensity)
      for (let i = 0; i < count; i++) {
        const x = Math.random() * w
        const y = Math.random() * h
        const roll = Math.random()
        if (roll < 0.55) {
          ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.55})`
        } else if (roll < 0.78) {
          ctx.fillStyle = `rgba(0,255,255,${0.2 + Math.random() * 0.5})`
        } else {
          ctx.fillStyle = `rgba(255,0,180,${0.2 + Math.random() * 0.45})`
        }
        const size = Math.random() > 0.92 ? 2 : 1
        ctx.fillRect(x | 0, y | 0, size, size)
      }

      // Occasional hard horizontal tear band
      if (Math.random() < 0.35 * intensity) {
        const bandY = Math.random() * h
        const bandH = 1 + (Math.random() * 6) | 0
        ctx.fillStyle = `rgba(180,220,255,${0.08 + Math.random() * 0.2})`
        ctx.fillRect(0, bandY, w, bandH)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(rafRef.current)
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    }
  }, [active, intensity])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-[33] mix-blend-screen',
        active ? 'opacity-100' : 'opacity-0',
        className,
      )}
    />
  )
}