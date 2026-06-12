'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { zoom, zoomIdentity, ZoomTransform, D3ZoomEvent } from 'd3-zoom'
import { select } from 'd3-selection'
import { useRouter } from 'next/navigation'
import type { VTuber, Constellation } from '@/lib/types'
import { useNicheMapData, getVTubersByNicheCluster } from '@/hooks/use-niche-map-data'

interface StarPosition { vtuber: VTuber; x: number; y: number }

const ZOOM_THRESHOLD = 1.5
const MIN_ZOOM = 0.4
const MAX_ZOOM = 5

export function NicheMap() {
  const { vtubers, constellations, loading, error } = useNicheMapData()
  const router = useRouter()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const timeRef = useRef(0)

  const transformRef = useRef<ZoomTransform>(zoomIdentity)
  const starPositionsRef = useRef<StarPosition[]>([])
  const hoveredStarRef = useRef<StarPosition | null>(null)
  const hoveredConstRef = useRef<Constellation | null>(null)
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())
  const constellationsRef = useRef<Constellation[]>([])
  const vtubersRef = useRef<VTuber[]>([])
  const zoomBehaviorRef = useRef<ReturnType<typeof zoom<HTMLCanvasElement, unknown>> | null>(null)

  useEffect(() => { constellationsRef.current = constellations }, [constellations])
  useEffect(() => { vtubersRef.current = vtubers }, [vtubers])

  const [dimensions, setDimensions] = useState({ width: 900, height: 600 })
  const [zoomPct, setZoomPct] = useState(100)
  const [tooltip, setTooltip] = useState<{ vtuber: VTuber; sx: number; sy: number } | null>(null)
  const [constHint, setConstHint] = useState<Constellation | null>(null)

  // Preload avatars
  useEffect(() => {
    vtubers.forEach(v => {
      if (!imageCache.current.has(v.id)) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = v.avatarUrl
        imageCache.current.set(v.id, img)
      }
    })
  }, [vtubers])

  // Build star positions
  useEffect(() => {
    if (!vtubers.length || !constellations.length) return
    const positions: StarPosition[] = []
    constellations.forEach(c => {
      const members = getVTubersByNicheCluster(vtubers, c.id)
      members.forEach((vtuber, i) => {
        const angle = (i / Math.max(members.length, 1)) * Math.PI * 2 + i * 0.4
        const radius = 52 + (i % 3) * 30
        positions.push({ vtuber, x: c.position.x + Math.cos(angle) * radius, y: c.position.y + Math.sin(angle) * radius })
      })
    })
    starPositionsRef.current = positions
  }, [vtubers, constellations])

  // Resize observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      if (entry) setDimensions({ width: entry.contentRect.width, height: Math.max(entry.contentRect.height, 500) })
    })
    obs.observe(el)
    setDimensions({ width: el.clientWidth, height: Math.max(el.clientHeight, 500) })
    return () => obs.disconnect()
  }, [])

  // D3 zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const sel = select(canvas)
    const zb = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => {
        transformRef.current = event.transform
        setZoomPct(Math.round(event.transform.k * 100))
        setTooltip(null)
      })
    zoomBehaviorRef.current = zb
    sel.call(zb)
    return () => { sel.on('.zoom', null) }
  }, [dimensions.width, dimensions.height])

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      timeRef.current += 0.016
      const t = timeRef.current
      const tr = transformRef.current
      const k = tr.k
      const { width, height } = dimensions
      const stars = starPositionsRef.current
      const consts = constellationsRef.current
      const vts = vtubersRef.current
      const hovStar = hoveredStarRef.current
      const hovConst = hoveredConstRef.current

      ctx.clearRect(0, 0, width, height)

      // === Screen-space polish (prevents dead black) ===
      const vig = ctx.createRadialGradient(
        width / 2, height / 2, Math.min(width, height) * 0.25,
        width / 2, height / 2, Math.max(width, height) * 0.95
      )
      vig.addColorStop(0, 'rgba(8,12,16,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.6)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, width, height)

      // Faint map grid (screen space)
      ctx.save()
      ctx.strokeStyle = 'rgba(200,232,255,0.028)'
      ctx.lineWidth = 1
      const grid = 52
      for (let x = (tr.x % grid) - grid; x < width + grid; x += grid) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = (tr.y % grid) - grid; y < height + grid; y += grid) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
      ctx.restore()

      ctx.save()
      ctx.translate(tr.x, tr.y)
      ctx.scale(k, k)

      // Dark parchment background
      ctx.fillStyle = '#080c10'
      ctx.fillRect(-1200, -900, 3600, 3000)

      // Ambient stars
      for (let i = 0; i < 220; i++) {
        const bx = ((i * 43 + 7) % 1200) - 80
        const by = ((i * 71 + 13) % 1000) - 80
        const tw = Math.sin(t * 1.35 + i * 0.75) * 0.22 + 0.48
        ctx.globalAlpha = tw * 0.32
        ctx.fillStyle = '#c8e8ff'
        ctx.beginPath()
        ctx.arc(bx, by, (i % 3) * 0.38 + 0.22, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const showStars = k >= ZOOM_THRESHOLD

      if (showStars) {
        // Connection lines
        consts.forEach(c => {
          const members = stars.filter(s => s.vtuber.category === c.id)
          if (members.length < 2) return
          ctx.strokeStyle = `${c.color}28`
          ctx.lineWidth = 1.2 / k
          ctx.setLineDash([5 / k, 7 / k])
          ctx.beginPath()
          members.forEach((s, i) => {
            const fx = s.x + Math.sin(t * 0.7 + s.x * 0.012) * 1.5
            const fy = s.y + Math.cos(t * 1.0 + s.y * 0.012) * 1.5
            if (i === 0) ctx.moveTo(fx, fy)
            else ctx.lineTo(fx, fy)
          })
          ctx.stroke()
          ctx.setLineDash([])
        })

        // Stars / avatars
        stars.forEach(star => {
          const isHov = hovStar?.vtuber.id === star.vtuber.id
          const c = consts.find(x => x.id === star.vtuber.category) ?? null
          const color = c?.color ?? '#64b5f6'
          const fx = star.x + Math.sin(t * 0.7 + star.x * 0.012) * 1.8
          const fy = star.y + Math.cos(t * 1.0 + star.y * 0.012) * 1.8
          const r = isHov ? 15 : 9

          if (isHov) {
            const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 45)
            g.addColorStop(0, `${color}80`)
            g.addColorStop(0.5, `${color}28`)
            g.addColorStop(1, 'transparent')
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.arc(fx, fy, 45, 0, Math.PI * 2)
            ctx.fill()
          }

          if (k >= 2) {
            const img = imageCache.current.get(star.vtuber.id)
            if (img?.complete && img.naturalWidth > 0) {
              ctx.save()
              ctx.beginPath()
              ctx.arc(fx, fy, r, 0, Math.PI * 2)
              ctx.clip()
              ctx.drawImage(img, fx - r, fy - r, r * 2, r * 2)
              ctx.restore()
            } else {
              const core = ctx.createRadialGradient(fx, fy, 0, fx, fy, r)
              core.addColorStop(0, '#fff')
              core.addColorStop(0.4, color)
              core.addColorStop(1, `${color}00`)
              ctx.fillStyle = core
              ctx.beginPath()
              ctx.arc(fx, fy, r, 0, Math.PI * 2)
              ctx.fill()
            }
            ctx.strokeStyle = isHov ? '#d4a574' : `${color}90`
            ctx.lineWidth = (isHov ? 2.5 : 1.5) / k
            ctx.beginPath()
            ctx.arc(fx, fy, r, 0, Math.PI * 2)
            ctx.stroke()
          } else {
            const core = ctx.createRadialGradient(fx, fy, 0, fx, fy, r)
            core.addColorStop(0, '#ffffff')
            core.addColorStop(0.35, color)
            core.addColorStop(1, `${color}00`)
            ctx.fillStyle = core
            ctx.beginPath()
            ctx.arc(fx, fy, r, 0, Math.PI * 2)
            ctx.fill()
          }

          if (isHov || k >= 3.5) {
            const fs = Math.max(10, 12 / k)
            ctx.font = `${isHov ? '600 ' : ''}${fs}px "Space Grotesk", sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            const ly = fy + r + 4 / k
            ctx.fillStyle = 'rgba(0,0,0,0.75)'
            ctx.fillText(star.vtuber.name, fx + 0.5, ly + 0.5)
            ctx.fillStyle = isHov ? '#d4a574' : '#f0e8d0'
            ctx.fillText(star.vtuber.name, fx, ly)
          }
        })
      } else {
        // === Zoomed out: niche cluster orbs (HIGH VISIBILITY VERSION) ===
        consts.forEach(c => {
          const cx = c.position.x
          const cy = c.position.y
          const isHov = hovConst?.id === c.id
          const count = getVTubersByNicheCluster(vts, c.id).length
          const pulse = Math.sin(t * 1.1 + cx * 0.003) * 0.12 + 0.88
          const orbR = (isHov ? 95 : 78) * pulse

          // Outer nebula glow (strong)
          const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 2.1)
          neb.addColorStop(0, `${c.color}99`)
          neb.addColorStop(0.35, `${c.color}44`)
          neb.addColorStop(0.7, `${c.color}1a`)
          neb.addColorStop(1, 'transparent')
          ctx.fillStyle = neb
          ctx.beginPath()
          ctx.arc(cx, cy, orbR * 2.1, 0, Math.PI * 2)
          ctx.fill()

          // Main orb body (bright + high contrast)
          const orb = ctx.createRadialGradient(
            cx - orbR * 0.22, cy - orbR * 0.22, orbR * 0.1,
            cx, cy, orbR
          )
          orb.addColorStop(0, `${c.color}ff`)
          orb.addColorStop(0.25, `${c.color}ee`)
          orb.addColorStop(0.55, `${c.color}bb`)
          orb.addColorStop(1, `${c.color}55`)
          ctx.fillStyle = orb
          ctx.beginPath()
          ctx.arc(cx, cy, orbR, 0, Math.PI * 2)
          ctx.fill()

          // Bright inner core highlight
          const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 0.55)
          core.addColorStop(0, 'rgba(255,255,255,0.9)')
          core.addColorStop(0.3, `${c.color}cc`)
          core.addColorStop(1, 'transparent')
          ctx.fillStyle = core
          ctx.beginPath()
          ctx.arc(cx, cy, orbR * 0.55, 0, Math.PI * 2)
          ctx.fill()

          // Stroke / ring
          ctx.strokeStyle = isHov ? '#fff' : `${c.color}dd`
          ctx.lineWidth = (isHov ? 3.5 : 2.2) / k
          ctx.beginPath()
          ctx.arc(cx, cy, orbR, 0, Math.PI * 2)
          ctx.stroke()

          // Subtle outer ring
          ctx.strokeStyle = `${c.color}40`
          ctx.lineWidth = 1.5 / k
          ctx.beginPath()
          ctx.arc(cx, cy, orbR * 1.15, 0, Math.PI * 2)
          ctx.stroke()

          // Small white dots for creators
          for (let i = 0; i < Math.min(count, 10); i++) {
            const ang = (i / Math.min(count, 10)) * Math.PI * 2 + t * 0.32
            ctx.globalAlpha = 0.85
            ctx.fillStyle = '#fff'
            ctx.beginPath()
            ctx.arc(
              cx + Math.cos(ang) * orbR * 0.68,
              cy + Math.sin(ang) * orbR * 0.68,
              (isHov ? 3.2 : 2.4) / k,
              0,
              Math.PI * 2
            )
            ctx.fill()
          }
          ctx.globalAlpha = 1

          // Labels with shadow
          const fs = 16 / k
          ctx.font = `700 ${fs}px "Space Grotesk", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          ctx.fillStyle = 'rgba(0,0,0,0.7)'
          ctx.fillText(c.name, cx + 1, cy + 1.5)
          ctx.fillStyle = isHov ? '#fff' : '#f4e9d8'
          ctx.fillText(c.name, cx, cy)

          ctx.font = `${11 / k}px "Space Grotesk", sans-serif`
          ctx.fillStyle = isHov ? c.color : '#a8b0c0'
          ctx.fillText(`${count} creators`, cx, cy + fs * 1.15)
        })
      }

      ctx.restore()
      rafRef.current = requestAnimationFrame(render)
    }

    render()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [dimensions])

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const tr = transformRef.current
    const mx = (e.clientX - rect.left - tr.x) / tr.k
    const my = (e.clientY - rect.top - tr.y) / tr.k

    if (tr.k >= ZOOM_THRESHOLD) {
      const hitR2 = (22 / tr.k) ** 2
      const hit = starPositionsRef.current.find(s => (s.x - mx) ** 2 + (s.y - my) ** 2 < hitR2) ?? null
      hoveredStarRef.current = hit
      hoveredConstRef.current = null
      if (hit) {
        setTooltip({ vtuber: hit.vtuber, sx: hit.x * tr.k + tr.x, sy: hit.y * tr.k + tr.y })
        setConstHint(null)
        canvas.style.cursor = 'pointer'
      } else {
        setTooltip(null)
        canvas.style.cursor = 'grab'
      }
    } else {
      hoveredStarRef.current = null
      const hit = constellationsRef.current.find(c => (c.position.x - mx) ** 
