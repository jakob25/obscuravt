'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { zoom, zoomIdentity, ZoomTransform, D3ZoomEvent } from 'd3-zoom'
import { select } from 'd3-selection'
import { useRouter } from 'next/navigation'
import type { VTuber, Constellation } from '@/lib/types'
import { useStarMapData, getVTubersByConstellationLive } from '@/hooks/use-star-map-data'

interface StarMapProps {
  initialConstellation?: string
}

interface StarPosition {
  vtuber: VTuber
  x: number
  y: number
}

const ZOOM_THRESHOLD = 1.5
const MIN_ZOOM = 0.4
const MAX_ZOOM = 5

export function StarMap({ initialConstellation }: StarMapProps) {
  const { vtubers, constellations, loading, error } = useStarMapData()
  const router = useRouter()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const timeRef = useRef(0)

  // All hot-path state in refs — prevents RAF restarts on every zoom
  const transformRef = useRef<ZoomTransform>(zoomIdentity)
  const starPositionsRef = useRef<StarPosition[]>([])
  const hoveredStarRef = useRef<StarPosition | null>(null)
  const hoveredConstRef = useRef<Constellation | null>(null)
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())
  const constellationsRef = useRef<Constellation[]>([])
  const vtubersRef = useRef<VTuber[]>([])

  // Mirror data into refs
  useEffect(() => { constellationsRef.current = constellations }, [constellations])
  useEffect(() => { vtubersRef.current = vtubers }, [vtubers])

  // React state only for overlay UI
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 })
  const [zoomPct, setZoomPct] = useState(100)
  const [tooltip, setTooltip] = useState<{ vtuber: VTuber; sx: number; sy: number } | null>(null)
  const [constHint, setConstHint] = useState<Constellation | null>(null)

  // Pre-load avatar images
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
      const members = getVTubersByConstellationLive(vtubers, c.id)
      members.forEach((vtuber, i) => {
        const angle = (i / Math.max(members.length, 1)) * Math.PI * 2 + i * 0.4
        const radius = 52 + (i % 3) * 30
        positions.push({
          vtuber,
          x: c.position.x + Math.cos(angle) * radius,
          y: c.position.y + Math.sin(angle) * radius,
        })
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
  const zoomBehaviorRef = useRef<ReturnType<typeof zoom<HTMLCanvasElement, unknown>> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const sel = select(canvas)

    const zb = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => {
        transformRef.current = event.transform
        setZoomPct(Math.round(event.transform.k * 100))
      })

    zoomBehaviorRef.current = zb
    sel.call(zb)

    if (initialConstellation && constellations.length) {
      const c = constellations.find(x => x.id === initialConstellation)
      if (c) {
        const t = zoomIdentity
          .translate(dimensions.width / 2 - c.position.x * 2, dimensions.height / 2 - c.position.y * 2)
          .scale(2)
        sel.call(zb.transform, t)
      }
    }

    return () => { sel.on('.zoom', null) }
  }, [dimensions.width, dimensions.height, initialConstellation, constellations])

  // Render loop — reads only refs, never React state
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
      ctx.save()
      ctx.translate(tr.x, tr.y)
      ctx.scale(k, k)

      // Background
      ctx.fillStyle = '#090910'
      ctx.fillRect(-1000, -800, 3000, 2600)

      // Background ambient stars
      for (let i = 0; i < 220; i++) {
        const bx = ((i * 43 + 7) % 1100) - 50
        const by = ((i * 71 + 13) % 900) - 50
        const sz = (i % 3) * 0.35 + 0.25
        const tw = Math.sin(t * 1.4 + i * 0.8) * 0.22 + 0.55
        ctx.globalAlpha = tw * 0.45
        ctx.fillStyle = i % 9 === 0 ? '#d4a574' : '#e8e0d0'
        ctx.beginPath()
        ctx.arc(bx, by, sz, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const showStars = k >= ZOOM_THRESHOLD

      if (showStars) {
        // Connector lines
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

        // Stars
        stars.forEach(star => {
          const isHov = hovStar?.vtuber.id === star.vtuber.id
          const c = consts.find(x => x.id === star.vtuber.category)
          const color = c?.color ?? '#d4a574'
          const fx = star.x + Math.sin(t * 0.7 + star.x * 0.012) * 1.8
          const fy = star.y + Math.cos(t * 1.0 + star.y * 0.012) * 1.8
          const r = isHov ? 15 : 9

          // Hover glow
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

          // Avatar or star dot
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

          // Name
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
        // Zoomed out: constellation orbs
        consts.forEach(c => {
          const cx = c.position.x
          const cy = c.position.y
          const isHov = hovConst?.id === c.id
          const count = getVTubersByConstellationLive(vts, c.id).length
          const pulse = Math.sin(t * 1.1 + cx * 0.003) * 0.12 + 0.88
          const orbR = (isHov ? 90 : 72) * pulse

          // Nebula
          const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 1.8)
          neb.addColorStop(0, `${c.color}55`)
          neb.addColorStop(0.45, `${c.color}1a`)
          neb.addColorStop(1, 'transparent')
          ctx.fillStyle = neb
          ctx.beginPath()
          ctx.arc(cx, cy, orbR * 1.8, 0, Math.PI * 2)
          ctx.fill()

          // Orb
          const orb = ctx.createRadialGradient(cx - orbR * 0.25, cy - orbR * 0.25, 0, cx, cy, orbR)
          orb.addColorStop(0, `${c.color}cc`)
          orb.addColorStop(0.55, `${c.color}55`)
          orb.addColorStop(1, `${c.color}0a`)
          ctx.fillStyle = orb
          ctx.beginPath()
          ctx.arc(cx, cy, orbR, 0, Math.PI * 2)
          ctx.fill()

          ctx.strokeStyle = isHov ? c.color : `${c.color}70`
          ctx.lineWidth = (isHov ? 2 : 1) / k
          ctx.beginPath()
          ctx.arc(cx, cy, orbR, 0, Math.PI * 2)
          ctx.stroke()

          // Orbiting mini stars
          for (let i = 0; i < Math.min(count, 8); i++) {
            const ang = (i / Math.min(count, 8)) * Math.PI * 2 + t * 0.28
            const mr = orbR * 0.62
            ctx.globalAlpha = 0.65
            ctx.fillStyle = '#fff'
            ctx.beginPath()
            ctx.arc(cx + Math.cos(ang) * mr, cy + Math.sin(ang) * mr, 2.8 / k, 0, Math.PI * 2)
            ctx.fill()
            ctx.globalAlpha = 1
          }

          // Label
          const fs = 15 / k
          ctx.font = `600 ${fs}px "Space Grotesk", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = 'rgba(0,0,0,0.55)'
          ctx.fillText(c.name, cx + 1, cy + 1)
          ctx.fillStyle = isHov ? '#ffffff' : '#f0e8d0'
          ctx.fillText(c.name, cx, cy)
          ctx.font = `${10 / k}px "Space Grotesk", sans-serif`
          ctx.fillStyle = isHov ? c.color : '#888'
          ctx.fillText(`${count} creators`, cx, cy + fs * 1.25)
        })
      }

      ctx.restore()
      rafRef.current = requestAnimationFrame(render)
    }

    render()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [dimensions]) // intentionally minimal deps — refs handle the rest

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
      const hit = constellationsRef.current.find(c => (c.position.x - mx) ** 2 + (c.position.y - my) ** 2 < 80 ** 2) ?? null
      hoveredConstRef.current = hit
      setConstHint(hit)
      setTooltip(null)
      canvas.style.cursor = hit ? 'pointer' : 'grab'
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    hoveredStarRef.current = null
    hoveredConstRef.current = null
    setTooltip(null)
    setConstHint(null)
  }, [])

  const handleClick = useCallback(() => {
    if (hoveredStarRef.current) {
      router.push(`/vtuber/${hoveredStarRef.current.vtuber.id}`)
      return
    }
    const hc = hoveredConstRef.current
    const canvas = canvasRef.current
    const zb = zoomBehaviorRef.current
    if (hc && canvas && zb) {
      const t = zoomIdentity
        .translate(dimensions.width / 2 - hc.position.x * 2.5, dimensions.height / 2 - hc.position.y * 2.5)
        .scale(2.5)
      select(canvas).call(zb.transform, t)
    }
  }, [router, dimensions.width, dimensions.height])

  if (loading) {
    return (
      <div className="w-full min-h-[500px] flex flex-col items-center justify-center gap-4 bg-[#090910]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border border-vault-gold/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border border-vault-gold/40 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-vault-gold animate-pulse" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse tracking-widest uppercase">Mapping the stars…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center bg-[#090910]">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-[#090910] overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs select-none">
        <span className="text-white/40">zoom</span>
        <span className="text-vault-cream font-medium tabular-nums">{zoomPct}%</span>
        {zoomPct < ZOOM_THRESHOLD * 100 && (
          <span className="text-vault-gold/60">· scroll in to see creators</span>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white/35 select-none">
        scroll to zoom · drag to pan · click to explore
      </div>

      {/* Star tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: Math.min(tooltip.sx + 20, dimensions.width - 250),
            top: Math.max(tooltip.sy - 12, 8),
          }}
        >
          <div className="w-52 rounded-xl bg-[#0e0e1c]/96 border border-vault-gold/30 shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-3 p-3 border-b border-white/5">
              <img
                src={tooltip.vtuber.avatarUrl}
                alt={tooltip.vtuber.name}
                className="h-9 w-9 rounded-full border border-vault-gold/40 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="font-semibold text-vault-cream text-sm truncate">{tooltip.vtuber.name}</div>
                <div className="text-[10px] text-vault-gold/70 truncate">
                  {constellations.find(c => c.id === tooltip.vtuber.category)?.name ?? ''}
                </div>
              </div>
            </div>
            {tooltip.vtuber.bio && (
              <p className="px-3 py-2 text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                {tooltip.vtuber.bio}
              </p>
            )}
            <div className="px-3 pb-2.5 pt-0.5 text-[10px] text-vault-gold/80 flex items-center gap-1">
              ↗ Click to view profile
            </div>
          </div>
        </div>
      )}

      {/* Constellation hint */}
      {constHint && !tooltip && (
        <div
          className="absolute bottom-14 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 border text-xs select-none"
          style={{ borderColor: `${constHint.color}50` }}
        >
          <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: constHint.color }} />
          <span className="text-vault-cream font-medium">{constHint.name}</span>
          <span className="text-white/35">· click to zoom in</span>
        </div>
      )}
    </div>
  )
}
