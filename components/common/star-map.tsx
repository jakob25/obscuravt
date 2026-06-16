'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { zoom, zoomIdentity, ZoomTransform, D3ZoomEvent } from 'd3-zoom'
import { select } from 'd3-selection'
import { useRouter } from 'next/navigation'
import { useStarMapData, getVTubersByConstellationLive } from '@/hooks/use-star-map-data'
import type { VTuber, Constellation } from '@/lib/types'

interface StarPosition {
  vtuber: VTuber
  x: number
  y: number
}

const ZOOM_THRESHOLD = 1.5
const MIN_ZOOM = 0.4
const MAX_ZOOM = 5

export function StarMap() {
  const { vtubers, constellations, loading } = useStarMapData()
  const router = useRouter()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const timeRef = useRef(0)

  // All hot-path state in refs — avoids stale closures in canvas loop
  const transformRef = useRef<ZoomTransform>(zoomIdentity)
  const starPositionsRef = useRef<StarPosition[]>([])
  const hoveredStarRef = useRef<StarPosition | null>(null)
  const hoveredConstRef = useRef<Constellation | null>(null)
  const constellationsRef = useRef<Constellation[]>([])
  const vtubersRef = useRef<VTuber[]>([])
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())
  const zoomBehaviorRef = useRef<ReturnType<typeof zoom<HTMLCanvasElement, unknown>> | null>(null)

  // Only use React state for things that affect overlay UI
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 })
  const [zoomPct, setZoomPct] = useState(100)
  const [tooltip, setTooltip] = useState<{ vtuber: VTuber; sx: number; sy: number } | null>(null)

  // Keep refs in sync
  useEffect(() => { constellationsRef.current = constellations }, [constellations])
  useEffect(() => { vtubersRef.current = vtubers }, [vtubers])

  // Preload avatar images
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
        const angle = (i / Math.max(members.length, 1)) * Math.PI * 2 + i * 0.42
        const radius = 55 + (i % 3) * 32
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

  // D3 zoom setup
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const sel = select(canvas)
    const zb = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => {
        transformRef.current = event.transform
        setZoomPct(Math.round(event.transform.k * 100))
        // Clear tooltip on pan/zoom
        setTooltip(null)
      })
    zoomBehaviorRef.current = zb
    sel.call(zb)
    return () => { sel.on('.zoom', null) }
  }, [dimensions.width, dimensions.height])

  // ── Main render loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Analog static state
    let staticSeed = Math.random() * 1000
    let waveTimer = 0
    let waveActive = false
    let waveY = 0
    let waveNextAt = 3 + Math.random() * 5

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

      // ── Background ───────────────────────────────────────────────────────────
      ctx.fillStyle = '#020408'
      ctx.fillRect(0, 0, width, height)

      // Deep space vignette
      const vig = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.75)
      vig.addColorStop(0, 'rgba(5,10,30,0)')
      vig.addColorStop(1, 'rgba(0,0,8,0.85)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, width, height)

      // ── Analog static ────────────────────────────────────────────────────────
      staticSeed += 0.8

      // Fine grain static — fills whole canvas every frame
      ctx.save()
      const imageData = ctx.createImageData(width, height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255
        data[i]     = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = Math.random() * 28 // max ~11% opacity — visible but subtle
      }
      ctx.putImageData(imageData, 0, 0)
      ctx.restore()

      // Scanlines
      ctx.save()
      for (let y = 0; y < height; y += 2) {
        ctx.globalAlpha = 0.10
        ctx.fillStyle = '#000'
        ctx.fillRect(0, y, width, 1)
      }
      ctx.globalAlpha = 1
      ctx.restore()

      // Analog color wave — drifts slowly down the screen
      waveTimer += 0.016
      if (!waveActive && waveTimer > waveNextAt) {
        waveActive = true
        waveY = -120
        waveTimer = 0
        waveNextAt = 4 + Math.random() * 6
      }
      if (waveActive) {
        waveY += 1.8
        ctx.save()
        const bandCount = 3
        for (let b = 0; b < bandCount; b++) {
          const by = waveY + b * 38
          const bh = 18 + b * 6
          const grad = ctx.createLinearGradient(0, by, width, by + bh)
          grad.addColorStop(0,   `hsla(${290 + b * 40}, 100%, 65%, 0)`)
          grad.addColorStop(0.2, `hsla(${290 + b * 40}, 100%, 65%, 0.22)`)
          grad.addColorStop(0.5, `hsla(${170 + b * 50}, 100%, 60%, 0.30)`)
          grad.addColorStop(0.8, `hsla(${60  + b * 30}, 100%, 65%, 0.22)`)
          grad.addColorStop(1,   `hsla(${60  + b * 30}, 100%, 65%, 0)`)
          ctx.fillStyle = grad
          ctx.fillRect(0, by, width, bh)
        }
        ctx.globalAlpha = 1
        ctx.restore()
        if (waveY > height + 120) waveActive = false
      }

      // ── Apply map transform ───────────────────────────────────────────────────
      ctx.save()
      ctx.translate(tr.x, tr.y)
      ctx.scale(k, k)

      // Ambient background stars
      for (let i = 0; i < 220; i++) {
        const bx = ((i * 43 + 7) % 1100) - 50
        const by = ((i * 71 + 13) % 900) - 50
        const tw = Math.sin(t * 1.6 + i * 0.9) * 0.3 + 0.7
        ctx.globalAlpha = tw * 0.5
        const hue = (i * 37) % 360
        ctx.fillStyle = `hsl(${hue}, 60%, 80%)`
        ctx.beginPath()
        ctx.arc(bx, by, (i % 3) * 0.4 + 0.3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const showStars = k >= ZOOM_THRESHOLD

      if (showStars) {
        // ── Connection lines between stars ──────────────────────────────────
        consts.forEach(c => {
          const members = stars.filter(s => s.vtuber.category === c.id)
          if (members.length < 2) return
          ctx.strokeStyle = `${c.color}35`
          ctx.lineWidth = 1.5 / k
          ctx.setLineDash([6 / k, 8 / k])
          ctx.beginPath()
          members.forEach((s, i) => {
            const fx = s.x + Math.sin(t * 0.7 + s.x * 0.012) * 2
            const fy = s.y + Math.cos(t * 1.0 + s.y * 0.012) * 2
            if (i === 0) ctx.moveTo(fx, fy)
            else ctx.lineTo(fx, fy)
          })
          ctx.stroke()
          ctx.setLineDash([])
        })

        // ── Individual stars ────────────────────────────────────────────────
        stars.forEach(star => {
          const isHov = hovStar?.vtuber.id === star.vtuber.id
          const c = consts.find(x => x.id === star.vtuber.category)
          const color = c?.color ?? '#64b5f6'

          const fx = star.x + Math.sin(t * 0.7 + star.x * 0.012) * 2
          const fy = star.y + Math.cos(t * 1.0 + star.y * 0.012) * 2
          const r = isHov ? 16 : 10

          // Glow — vibrant and large
          if (isHov) {
            const g1 = ctx.createRadialGradient(fx, fy, 0, fx, fy, 55)
            g1.addColorStop(0, `${color}cc`)
            g1.addColorStop(0.3, `${color}55`)
            g1.addColorStop(1, 'transparent')
            ctx.fillStyle = g1
            ctx.beginPath()
            ctx.arc(fx, fy, 55, 0, Math.PI * 2)
            ctx.fill()
          }

          // Ambient pulse glow
          const pulse = Math.sin(t * 2.5 + star.x * 0.05) * 0.4 + 0.6
          const g2 = ctx.createRadialGradient(fx, fy, 0, fx, fy, r * 2.5)
          g2.addColorStop(0, `${color}${isHov ? 'ff' : 'aa'}`)
          g2.addColorStop(0.5, `${color}${isHov ? '88' : '44'}`)
          g2.addColorStop(1, 'transparent')
          ctx.globalAlpha = pulse * (isHov ? 1 : 0.8)
          ctx.fillStyle = g2
          ctx.beginPath()
          ctx.arc(fx, fy, r * 2.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1

          // Avatar or colored core
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
            // Ring
            ctx.strokeStyle = isHov ? '#ffffff' : `${color}cc`
            ctx.lineWidth = (isHov ? 2.5 : 1.5) / k
            ctx.beginPath()
            ctx.arc(fx, fy, r, 0, Math.PI * 2)
            ctx.stroke()
          } else {
            // Point star
            const core = ctx.createRadialGradient(fx, fy, 0, fx, fy, r)
            core.addColorStop(0, '#ffffff')
            core.addColorStop(0.25, color)
            core.addColorStop(1, `${color}00`)
            ctx.fillStyle = core
            ctx.beginPath()
            ctx.arc(fx, fy, r, 0, Math.PI * 2)
            ctx.fill()
          }

          // Label
          if (isHov || k >= 3.5) {
            const fs = Math.max(10, 13 / k)
            ctx.font = `${isHov ? '700' : '500'} ${fs}px "Space Grotesk", sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            const ly = fy + r + 5 / k
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.8)'
            ctx.fillText(star.vtuber.name, fx + 0.8, ly + 0.8)
            ctx.fillStyle = isHov ? '#ffffff' : '#e8f4ff'
            ctx.fillText(star.vtuber.name, fx, ly)
          }
        })

      } else {
        // ── Constellation orbs (zoomed out) ─────────────────────────────────
        consts.forEach(c => {
          const cx = c.position.x
          const cy = c.position.y
          const isHov = hovConst?.id === c.id
          const count = getVTubersByConstellationLive(vtubersRef.current, c.id).length
          const pulse = Math.sin(t * 1.2 + cx * 0.004) * 0.1 + 0.9
          const orbR = (isHov ? 95 : 75) * pulse

          // Outer nebula — VIBRANT
          const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 2.2)
          neb.addColorStop(0, `${c.color}88`)
          neb.addColorStop(0.35, `${c.color}33`)
          neb.addColorStop(0.7, `${c.color}11`)
          neb.addColorStop(1, 'transparent')
          ctx.fillStyle = neb
          ctx.beginPath()
          ctx.arc(cx, cy, orbR * 2.2, 0, Math.PI * 2)
          ctx.fill()

          // Core orb — bright and saturated
          const orb = ctx.createRadialGradient(cx - orbR * 0.2, cy - orbR * 0.2, 0, cx, cy, orbR)
          orb.addColorStop(0, '#ffffff')
          orb.addColorStop(0.15, `${c.color}ff`)
          orb.addColorStop(0.55, `${c.color}99`)
          orb.addColorStop(1, `${c.color}22`)
          ctx.fillStyle = orb
          ctx.beginPath()
          ctx.arc(cx, cy, orbR, 0, Math.PI * 2)
          ctx.fill()

          // Bright ring
          ctx.strokeStyle = isHov ? '#ffffff' : `${c.color}dd`
          ctx.lineWidth = (isHov ? 2.5 : 1.5) / k
          ctx.shadowColor = c.color
          ctx.shadowBlur = isHov ? 20 / k : 10 / k
          ctx.beginPath()
          ctx.arc(cx, cy, orbR, 0, Math.PI * 2)
          ctx.stroke()
          ctx.shadowBlur = 0

          // Orbiting mini-stars
          for (let i = 0; i < Math.min(count, 8); i++) {
            const ang = (i / Math.min(count, 8)) * Math.PI * 2 + t * (isHov ? 0.5 : 0.3)
            const sx = cx + Math.cos(ang) * orbR * 0.7
            const sy = cy + Math.sin(ang) * orbR * 0.7
            ctx.globalAlpha = 0.9
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.arc(sx, sy, 3 / k, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.globalAlpha = 1

          // Label
          const fs = 16 / k
          ctx.font = `700 ${fs}px "Space Grotesk", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          // Glow text effect
          ctx.shadowColor = c.color
          ctx.shadowBlur = isHov ? 18 / k : 8 / k
          ctx.fillStyle = '#ffffff'
          ctx.fillText(c.name, cx, cy)
          ctx.shadowBlur = 0

          ctx.font = `500 ${11 / k}px "Space Grotesk", sans-serif`
          ctx.fillStyle = isHov ? c.color : 'rgba(200,220,255,0.7)'
          ctx.fillText(`${count} creator${count !== 1 ? 's' : ''}`, cx, cy + fs * 1.3)

          if (isHov) {
            ctx.font = `400 ${9 / k}px "Space Grotesk", sans-serif`
            ctx.fillStyle = 'rgba(200,220,255,0.5)'
            ctx.fillText('click to zoom in', cx, cy + fs * 2.5)
          }
        })
      }

      ctx.restore()

      rafRef.current = requestAnimationFrame(render)
    }

    render()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [dimensions])

  // ── Mouse move — uses refs, no stale closures ─────────────────────────────
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

      if (hit) {
        const sx = hit.x * tr.k + tr.x
        const sy = hit.y * tr.k + tr.y
        setTooltip({ vtuber: hit.vtuber, sx, sy })
        canvas.style.cursor = 'pointer'
      } else {
        setTooltip(null)
        canvas.style.cursor = 'grab'
      }
    } else {
      hoveredStarRef.current = null
      const hit = constellationsRef.current.find(c =>
        (c.position.x - mx) ** 2 + (c.position.y - my) ** 2 < 85 ** 2
      ) ?? null
      hoveredConstRef.current = hit
      setTooltip(null)
      canvas.style.cursor = hit ? 'pointer' : 'grab'
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    hoveredStarRef.current = null
    hoveredConstRef.current = null
    setTooltip(null)
  }, [])

  // ── Click — reads from refs, always fresh ─────────────────────────────────
  const handleClick = useCallback(() => {
    const star = hoveredStarRef.current
    const c = hoveredConstRef.current
    const canvas = canvasRef.current
    const zb = zoomBehaviorRef.current

    if (star) {
      // Navigate to VTuber profile
      router.push(`/vtuber/${star.vtuber.id}`)
      return
    }

    if (c && canvas && zb) {
      // Zoom into constellation
      const t = zoomIdentity
        .translate(dimensions.width / 2 - c.position.x * 2.5, dimensions.height / 2 - c.position.y * 2.5)
        .scale(2.5)
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
        style={{ touchAction: 'none', cursor: loading ? 'default' : 'grab' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />

      {/* Loading overlay — rendered on top of canvas so refs are always attached */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#020408]">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-cyan-400/60 animate-pulse tracking-widest uppercase text-xs">
            Mapping constellations…
          </p>
        </div>
      )}

      {/* Zoom indicator */}
      {!loading && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 border border-white/10 text-xs select-none">
          <span className="text-white/40">zoom</span>
          <span className="text-white font-medium tabular-nums">{zoomPct}%</span>
          {zoomPct < ZOOM_THRESHOLD * 100 && (
            <span className="text-cyan-400/60">· scroll in to see creators</span>
          )}
        </div>
      )}

      {/* Instructions */}
      {!loading && (
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white/30 select-none">
          scroll to zoom · drag to pan · click to explore
        </div>
      )}

      {/* VTuber tooltip — click target */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: Math.min(tooltip.sx + 20, dimensions.width - 260),
            top: Math.max(tooltip.sy - 16, 8),
          }}
        >
          <div className="w-56 rounded-xl bg-black/95 border border-cyan-400/30 shadow-2xl shadow-cyan-900/40 overflow-hidden backdrop-blur-sm">
            <div className="flex items-center gap-3 p-3 border-b border-white/5">
              <img
                src={tooltip.vtuber.avatarUrl}
                alt={tooltip.vtuber.name}
                className="h-10 w-10 rounded-full border border-cyan-400/40 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-bold text-white text-sm truncate">{tooltip.vtuber.name}</p>
                <p className="text-xs text-cyan-400/70 truncate">
                  {constellationsRef.current.find(c => c.id === tooltip.vtuber.category)?.name ?? ''}
                </p>
              </div>
            </div>
            {tooltip.vtuber.bio && (
              <p className="px-3 py-2 text-xs text-white/50 line-clamp-2 leading-relaxed">
                {tooltip.vtuber.bio}
              </p>
            )}
            <div className="px-3 pb-2.5 pt-0.5 text-xs text-cyan-400/80 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Click to open profile
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
