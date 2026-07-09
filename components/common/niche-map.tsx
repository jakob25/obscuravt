'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { zoom, zoomIdentity, ZoomTransform, D3ZoomEvent } from 'd3-zoom'
import { select } from 'd3-selection'
import { useRouter } from 'next/navigation'
import type { VTuber, Constellation } from '@/lib/types'
import { useNicheMapData, getVTubersByNicheCluster } from '@/hooks/use-niche-map-data'

interface StarPosition {
  vtuber: VTuber
  x: number
  y: number
}

const ZOOM_THRESHOLD = 1.5

const MIN_ZOOM = 0.4
const MAX_ZOOM = 5

export function NicheMap() {
  const { vtubers, constellations, loading } = useNicheMapData()
  const router = useRouter()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const timeRef = useRef(0)

  const transformRef = useRef<ZoomTransform>(zoomIdentity)
  const starPositionsRef = useRef<StarPosition[]>([])
  const hoveredStarRef = useRef<StarPosition | null>(null)
  const hoveredConstRef = useRef<Constellation | null>(null)
  const constellationsRef = useRef<Constellation[]>([])
  const vtubersRef = useRef<VTuber[]>([])
  const zoomBehaviorRef = useRef<ReturnType<typeof zoom<HTMLCanvasElement, unknown>> | null>(null)
  const touchTapTimeoutRef = useRef<number | null>(null)
  const lastTapClusterIdRef = useRef<string | null>(null)
  const lastTapTimeRef = useRef(0)
  const isTouchInteractionRef = useRef(false)

  const [dimensions, setDimensions] = useState({ width: 900, height: 600 })
  const [zoomPct, setZoomPct] = useState(100)
  const [tooltip, setTooltip] = useState<{ vtuber: VTuber; sx: number; sy: number } | null>(null)
  const [clusterHint, setClusterHint] = useState<Constellation | null>(null)

  useEffect(() => { constellationsRef.current = constellations }, [constellations])
  useEffect(() => { vtubersRef.current = vtubers }, [vtubers])
  useEffect(() => () => {
    if (touchTapTimeoutRef.current) {
      window.clearTimeout(touchTapTimeoutRef.current)
    }
  }, [])

  // Build star positions around clusters
  useEffect(() => {
    if (!vtubers.length || !constellations.length) return
    const positions: StarPosition[] = []
    constellations.forEach(c => {
      const members = getVTubersByNicheCluster(vtubers, c.id)
      members.forEach((vtuber, i) => {
        const angle = (i / Math.max(members.length, 1)) * Math.PI * 2 + i * 0.4
        const radius = 70 + (i % 3) * 35
        positions.push({
          vtuber,
          x: c.position.x + Math.cos(angle) * radius,
          y: c.position.y + Math.sin(angle) * radius,
        })
      })
    })
    starPositionsRef.current = positions
  }, [vtubers, constellations])

  // Resize
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

  // Zoom setup
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
        setClusterHint(null)
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
      const consts = constellationsRef.current
      const stars = starPositionsRef.current
      const hovStar = hoveredStarRef.current
      const hovConst = hoveredConstRef.current

      ctx.clearRect(0, 0, width, height)

      // Background
      ctx.fillStyle = '#020408'
      ctx.fillRect(0, 0, width, height)

      // Vignette
      const vig = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.8)
      vig.addColorStop(0, 'rgba(5,10,30,0)')
      vig.addColorStop(1, 'rgba(0,0,8,0.9)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, width, height)

      ctx.save()
      ctx.translate(tr.x, tr.y)
      ctx.scale(k, k)

      const showStars = k >= ZOOM_THRESHOLD

      if (showStars) {
        // Connection lines
        consts.forEach(c => {
          const members = stars.filter(s => s.vtuber.category === c.id)
          if (members.length < 2) return
          ctx.strokeStyle = `${c.color}40`
          ctx.lineWidth = 1.2 / k
          ctx.setLineDash([5 / k, 7 / k])
          ctx.beginPath()
          members.forEach((s, i) => {
            const fx = s.x + Math.sin(t * 0.6 + s.x * 0.01) * 1.5
            const fy = s.y + Math.cos(t * 0.9 + s.y * 0.01) * 1.5
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
          const color = c?.color ?? '#a78bfa'

          const fx = star.x + Math.sin(t * 0.6 + star.x * 0.01) * 1.5
          const fy = star.y + Math.cos(t * 0.9 + star.y * 0.01) * 1.5
          const r = isHov ? 14 : 9

          // Glow
          if (isHov) {
            const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 45)
            g.addColorStop(0, `${color}cc`)
            g.addColorStop(0.4, `${color}50`)
            g.addColorStop(1, 'transparent')
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.arc(fx, fy, 45, 0, Math.PI * 2)
            ctx.fill()
          }

          // Core
          const core = ctx.createRadialGradient(fx, fy, 0, fx, fy, r * 2.2)
          core.addColorStop(0, '#fff')
          core.addColorStop(0.3, color)
          core.addColorStop(1, `${color}00`)
          ctx.fillStyle = core
          ctx.beginPath()
          ctx.arc(fx, fy, r * 2.2, 0, Math.PI * 2)
          ctx.fill()

          // Ring
          ctx.strokeStyle = isHov ? '#fff' : `${color}cc`
          ctx.lineWidth = (isHov ? 2 : 1.2) / k
          ctx.beginPath()
          ctx.arc(fx, fy, r, 0, Math.PI * 2)
          ctx.stroke()

          if (isHov || k >= 3.2) {
            ctx.font = `${isHov ? '600' : '500'} ${Math.max(9, 11 / k)}px "Space Grotesk", sans-serif`
            ctx.textAlign = 'center'
            ctx.fillStyle = isHov ? '#fff' : '#e0e7ff'
            ctx.fillText(star.vtuber.name, fx, fy + r + 12 / k)
          }
        })
      } else {
        // Zoomed out - show cluster orbs
        consts.forEach(c => {
          const isHov = hovConst?.id === c.id
          const count = getVTubersByNicheCluster(vtubersRef.current, c.id).length
          const pulse = Math.sin(t * 1.1 + c.position.x * 0.003) * 0.08 + 0.92
          const orbR = (isHov ? 88 : 68) * pulse

          // Outer glow
          const glow = ctx.createRadialGradient(c.position.x, c.position.y, 0, c.position.x, c.position.y, orbR * 2.4)
          glow.addColorStop(0, `${c.color}70`)
          glow.addColorStop(0.4, `${c.color}25`)
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(c.position.x, c.position.y, orbR * 2.4, 0, Math.PI * 2)
          ctx.fill()

          // Core orb
          const orb = ctx.createRadialGradient(c.position.x, c.position.y, 0, c.position.x, c.position.y, orbR)
          orb.addColorStop(0, '#ffffff')
          orb.addColorStop(0.2, c.color)
          orb.addColorStop(0.7, `${c.color}cc`)
          orb.addColorStop(1, `${c.color}40`)
          ctx.fillStyle = orb
          ctx.beginPath()
          ctx.arc(c.position.x, c.position.y, orbR, 0, Math.PI * 2)
          ctx.fill()

          // Ring
          ctx.strokeStyle = isHov ? '#fff' : `${c.color}dd`
          ctx.lineWidth = (isHov ? 2.5 : 1.5) / k
          ctx.shadowColor = c.color
          ctx.shadowBlur = isHov ? 18 / k : 8 / k
          ctx.beginPath()
          ctx.arc(c.position.x, c.position.y, orbR, 0, Math.PI * 2)
          ctx.stroke()
          ctx.shadowBlur = 0

          // Orbiting dots
          for (let i = 0; i < Math.min(count, 7); i++) {
            const ang = (i / Math.min(count, 7)) * Math.PI * 2 + t * (isHov ? 0.6 : 0.35)
            const sx = c.position.x + Math.cos(ang) * orbR * 0.65
            const sy = c.position.y + Math.sin(ang) * orbR * 0.65
            ctx.fillStyle = '#fff'
            ctx.beginPath()
            ctx.arc(sx, sy, 2.5 / k, 0, Math.PI * 2)
            ctx.fill()
          }

          // Label
          ctx.font = `700 ${14 / k}px "Space Grotesk", sans-serif`
          ctx.textAlign = 'center'
          ctx.fillStyle = '#fff'
          ctx.fillText(c.name, c.position.x, c.position.y - 4)

          ctx.font = `500 ${10 / k}px "Space Grotesk", sans-serif`
          ctx.fillStyle = isHov ? c.color : 'rgba(200,220,255,0.75)'
          ctx.fillText(`${count} creator${count !== 1 ? 's' : ''}`, c.position.x, c.position.y + 14 / k)

          if (isHov) {
            ctx.font = `400 ${9 / k}px "Space Grotesk", sans-serif`
            ctx.fillStyle = 'rgba(200,220,255,0.6)'
            ctx.fillText('click to zoom in', c.position.x, c.position.y + 26 / k)
          }
        })
      }

      ctx.restore()
      rafRef.current = requestAnimationFrame(render)
    }

    render()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [dimensions])

  const getClusterFromPoint = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    const tr = transformRef.current
    const mx = (clientX - rect.left - tr.x) / tr.k
    const my = (clientY - rect.top - tr.y) / tr.k

    return constellationsRef.current.find(c =>
      (c.position.x - mx) ** 2 + (c.position.y - my) ** 2 < 85 ** 2
    ) ?? null
  }, [])

  // Mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const tr = transformRef.current
    const mx = (e.clientX - rect.left - tr.x) / tr.k
    const my = (e.clientY - rect.top - tr.y) / tr.k

    if (tr.k >= ZOOM_THRESHOLD) {
      const hitR2 = (22 / tr.k) ** 2
      const hit = starPositionsRef.current.find(s =>
        (s.x - mx) ** 2 + (s.y - my) ** 2 < hitR2
      ) ?? null

      hoveredStarRef.current = hit
      hoveredConstRef.current = null
      setClusterHint(null)

      if (hit) {
        const sx = hit.x * tr.k + tr.x
        const sy = hit.y * tr.k + tr.y
        setTooltip({ vtuber: hit.vtuber, sx, sy })
      } else {
        setTooltip(null)
      }
    } else {
      hoveredStarRef.current = null
      setTooltip(null)

      const hit = getClusterFromPoint(e.clientX, e.clientY, rect)
      hoveredConstRef.current = hit

      if (hit) {
        setClusterHint(hit)
      } else {
        setClusterHint(null)
      }
    }
  }, [getClusterFromPoint])

  const handleMouseLeave = useCallback(() => {
    hoveredStarRef.current = null
    hoveredConstRef.current = null
    setTooltip(null)
    setClusterHint(null)
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const touch = e.changedTouches[0]
    if (!touch) return

    const rect = canvas.getBoundingClientRect()
    const hit = getClusterFromPoint(touch.clientX, touch.clientY, rect)
    isTouchInteractionRef.current = true

    if (!hit) {
      hoveredConstRef.current = null
      setClusterHint(null)
      lastTapClusterIdRef.current = null
      lastTapTimeRef.current = 0
      return
    }

    const now = Date.now()
    const sameCluster = lastTapClusterIdRef.current === hit.id
    const withinWindow = now - lastTapTimeRef.current < 320

    if (sameCluster && withinWindow) {
      const zb = zoomBehaviorRef.current
      if (zb) {
        const t = zoomIdentity
          .translate(dimensions.width / 2 - hit.position.x * 2.3, dimensions.height / 2 - hit.position.y * 2.3)
          .scale(2.3)
        select(canvas).call(zb.transform, t)
      }
      hoveredConstRef.current = null
      setClusterHint(null)
      lastTapClusterIdRef.current = null
      lastTapTimeRef.current = 0
      return
    }

    hoveredConstRef.current = hit
    setClusterHint(hit)
    lastTapClusterIdRef.current = hit.id
    lastTapTimeRef.current = now

    if (touchTapTimeoutRef.current) {
      window.clearTimeout(touchTapTimeoutRef.current)
    }

    touchTapTimeoutRef.current = window.setTimeout(() => {
      if (lastTapClusterIdRef.current === hit.id) {
        lastTapClusterIdRef.current = null
        lastTapTimeRef.current = 0
      }
    }, 360)
  }, [dimensions.width, dimensions.height, getClusterFromPoint])

  // Click handler
  const handleClick = useCallback(() => {
    if (isTouchInteractionRef.current) {
      isTouchInteractionRef.current = false
      return
    }

    const star = hoveredStarRef.current
    const c = hoveredConstRef.current
    const canvas = canvasRef.current
    const zb = zoomBehaviorRef.current

    if (star) {
      router.push(`/vtuber/${star.vtuber.id}`)
      return
    }

    if (c && canvas && zb) {
      const t = zoomIdentity
        .translate(dimensions.width / 2 - c.position.x * 2.3, dimensions.height / 2 - c.position.y * 2.3)
        .scale(2.3)
      select(canvas).call(zb.transform, t)
    }
  }, [router, dimensions.width, dimensions.height])

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-[#020408] overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 border border-white/10 text-xs select-none">
        <span className="text-white/40">zoom</span>
        <span className="text-white font-medium tabular-nums">{zoomPct}%</span>
      </div>

      {/* VTuber tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: Math.min(tooltip.sx + 18, dimensions.width - 240),
            top: Math.max(tooltip.sy - 12, 8),
          }}
        >
          <div className="w-56 rounded-xl bg-black/95 border border-cyan-400/30 shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="flex items-center gap-3 p-3 border-b border-white/5">
              <img src={tooltip.vtuber.avatarUrl} alt={tooltip.vtuber.name} className="h-10 w-10 rounded-full border border-cyan-400/40" />
              <div className="min-w-0">
                <p className="font-bold text-white text-sm truncate">{tooltip.vtuber.name}</p>
                <p className="text-xs text-cyan-400/70 truncate">
                  {constellationsRef.current.find(c => c.id === tooltip.vtuber.category)?.name ?? ''}
                </p>
              </div>
            </div>
            {tooltip.vtuber.bio && (
              <p className="px-3 py-2 text-xs text-white/50 line-clamp-2">{tooltip.vtuber.bio}</p>
            )}
          </div>
        </div>
      )}

      {/* Cluster description on hover (zoomed out) */}
      {clusterHint && !tooltip && (
        <div
          className="absolute z-20 pointer-events-none max-w-[260px]"
          style={{
            left: Math.min( (clusterHint.position.x * transformRef.current.k + transformRef.current.x) + 35 , dimensions.width - 280),
            top: Math.max( (clusterHint.position.y * transformRef.current.k + transformRef.current.y) - 30 , 20),
          }}
        >
          <div className="rounded-xl bg-black/90 border border-white/10 px-4 py-3 shadow-xl backdrop-blur-sm">
            <div className="font-semibold text-white text-sm mb-1">{clusterHint.name}</div>
            {clusterHint.description && (
              <p className="text-xs text-white/70 leading-relaxed">{clusterHint.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white/30 select-none">
        scroll to zoom · drag to pan · tap or click to explore
      </div>
    </div>
  )
}
