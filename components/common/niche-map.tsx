'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { zoom, D3ZoomEvent } from 'd3-zoom'
import { select } from 'd3-selection'
import { supabase } from '@/lib/supabase'

interface NicheCluster {
  id: string
  tag: string
  color: string
  position_x: number
  position_y: number
  description: string
  content_tag_ids: string[]
}

interface VTuberStar {
  id: string
  name: string
  avatar_url: string
  tags: string[]
  // which niche cluster this star belongs to
  cluster_id: string
  x: number
  y: number
  baseX: number
  baseY: number
}

interface NicheMapProps {
  onVTuberSelect?: (id: string) => void
  onClusterSelect?: (cluster: NicheCluster) => void
}

const ZOOM_THRESHOLD = 1.5
const MIN_ZOOM = 0.4
const MAX_ZOOM = 5



export function NicheMap({ onVTuberSelect, onClusterSelect }: NicheMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const staticFramesRef = useRef<HTMLCanvasElement[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [clusters, setClusters] = useState<NicheCluster[]>([])
  const [starPositions, setStarPositions] = useState<VTuberStar[]>([])
  const [hoveredStar, setHoveredStar] = useState<VTuberStar | null>(null)
  const [hoveredCluster, setHoveredCluster] = useState<NicheCluster | null>(null)
  const animationRef = useRef<number>(0)

  // Fetch clusters + vtubers, build star positions
  useEffect(() => {
    const W = 320, H = 240, FRAMES = 16
    const frames: HTMLCanvasElement[] = []
    for (let f = 0; f < FRAMES; f++) {
      const off = document.createElement('canvas')
      off.width = W; off.height = H
      const oc = off.getContext('2d')!
      const img = oc.createImageData(W, H)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random()
        const b = v * v * 220
        d[i]   = b * 0.45
        d[i+1] = b * 0.55
        d[i+2] = b * 1.4
        d[i+3] = 18 + v * 45
      }
      if (Math.random() > 0.65) {
        const by = Math.floor(Math.random() * H)
        for (let x = 0; x < W; x++) {
          const idx = (by * W + x) * 4
          d[idx] = 160; d[idx+1] = 210; d[idx+2] = 255; d[idx+3] = 50 + Math.random() * 60
        }
      }
      oc.putImageData(img, 0, 0)
      frames.push(off)
    }
    staticFramesRef.current = frames
  }, [])

  useEffect(() => {
    async function load() {
      const { data: tags, error } = await supabase
        .from('canonical_tags')
        .select('id, tag, color, position_x, position_y, description, content_tag_ids')
        .eq('category', 'niche_cluster')
        .order('sort_order')

      if (error || !tags) return

      const { data: vtubers } = await supabase
        .from('vtubers')
        .select('id, name, avatar_url, tags')
        .eq('approved', true)

      const builtClusters: NicheCluster[] = tags.map(t => ({
        id: t.id,
        tag: t.tag,
        color: t.color ?? '#888888',
        position_x: t.position_x ?? 500,
        position_y: t.position_y ?? 400,
        description: t.description ?? '',
        content_tag_ids: (t as any).content_tag_ids ?? [],
      }))

      setClusters(builtClusters)

      // Build star positions — a vtuber can appear in multiple clusters
      const stars: VTuberStar[] = []
      builtClusters.forEach(cluster => {
        const matched = vtubers?.filter(v =>
          Array.isArray(v.tags) &&
          cluster.content_tag_ids.some((cid: string) => v.tags.includes(cid))
        ) ?? []

        matched.forEach((v, index) => {
          const angle = (index / Math.max(matched.length, 1)) * Math.PI * 2 + (index * 0.4)
          const radius = 45 + (index % 3) * 25
          const x = cluster.position_x + Math.cos(angle) * radius
          const y = cluster.position_y + Math.sin(angle) * radius
          stars.push({
            id: v.id,
            name: v.name,
            avatar_url: v.avatar_url ?? '',
            tags: v.tags ?? [],
            cluster_id: cluster.id,
            x,
            y,
            baseX: x,
            baseY: y,
          })
        })
      })

      setStarPositions(stars)
    }

    load()
  }, [])

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // D3 zoom
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = select(canvasRef.current)
    const zoomBehavior = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => {
        setTransform({ x: event.transform.x, y: event.transform.y, k: event.transform.k })
      })
    canvas.call(zoomBehavior)
    return () => { canvas.on('.zoom', null) }
  }, [dimensions])

  // Mouse hover
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - transform.x) / transform.k
    const y = (event.clientY - rect.top - transform.y) / transform.k

    if (transform.k >= ZOOM_THRESHOLD) {
      const hitRadius = 20 / transform.k
      const hovered = starPositions.find(star => {
        const dx = star.x - x
        const dy = star.y - y
        return Math.sqrt(dx * dx + dy * dy) < hitRadius
      })
      setHoveredStar(hovered ?? null)
      setHoveredCluster(null)
    } else {
      const hovered = clusters.find(c => {
        const dx = c.position_x - x
        const dy = c.position_y - y
        return Math.sqrt(dx * dx + dy * dy) < 70
      })
      setHoveredCluster(hovered ?? null)
      setHoveredStar(null)
    }
  }, [transform, starPositions, clusters])

  const handleClick = useCallback(() => {
    if (hoveredStar && onVTuberSelect) onVTuberSelect(hoveredStar.id)
    else if (hoveredCluster && onClusterSelect) onClusterSelect(hoveredCluster)
  }, [hoveredStar, hoveredCluster, onVTuberSelect, onClusterSelect])

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let time = 0

    const render = () => {
      time += 0.016
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // ── Analog static ─────────────────────────────────────────────────────────
      const sFrames = staticFramesRef.current
      if (sFrames.length > 0) {
        const sIdx = Math.floor(time * 6) % sFrames.length
        ctx.save()
        ctx.globalAlpha = 0.22
        ctx.globalCompositeOperation = 'screen'
        ctx.drawImage(sFrames[sIdx], 0, 0, dimensions.width, dimensions.height)
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
        ctx.restore()
      }

      ctx.save()
      ctx.translate(transform.x, transform.y)
      ctx.scale(transform.k, transform.k)

      // Background
      const gradient = ctx.createRadialGradient(500, 400, 0, 500, 400, 800)
      gradient.addColorStop(0, 'rgba(26, 26, 26, 1)')
      gradient.addColorStop(1, 'rgba(18, 18, 20, 1)')
      ctx.fillStyle = gradient
      ctx.fillRect(-1000, -1000, 3000, 3000)

      // Background stars
      ctx.fillStyle = 'rgba(212, 165, 116, 0.2)'
      for (let i = 0; i < 200; i++) {
        const bx = (i * 37) % 1200 - 100
        const by = (i * 53) % 1000 - 100
        const size = (i % 3) * 0.5 + 0.5
        const twinkle = Math.sin(time * 2 + i) * 0.3 + 0.7
        ctx.globalAlpha = twinkle * 0.4
        ctx.beginPath()
        ctx.arc(bx, by, size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const showClusters = transform.k < ZOOM_THRESHOLD
      const showStars = transform.k >= ZOOM_THRESHOLD

      // --- ZOOMED OUT: draw cluster bubbles ---
      if (showClusters) {
        clusters.forEach(cluster => {
          const isHovered = hoveredCluster?.id === cluster.id
          const cx = cluster.position_x
          const cy = cluster.position_y
          const count = starPositions.filter(s => s.cluster_id === cluster.id).length

          // Outer glow
          const glowR = isHovered ? 100 : 80
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
          glow.addColorStop(0, cluster.color + (isHovered ? '50' : '30'))
          glow.addColorStop(0.5, cluster.color + '15')
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(cx, cy, glowR, 0, Math.PI * 2)
          ctx.fill()

          // Bubble fill
          const bubbleR = isHovered ? 58 : 48
          const fill = ctx.createRadialGradient(cx - bubbleR * 0.3, cy - bubbleR * 0.3, 0, cx, cy, bubbleR)
          fill.addColorStop(0, cluster.color + (isHovered ? 'cc' : '88'))
          fill.addColorStop(0.7, cluster.color + (isHovered ? '55' : '40'))
          fill.addColorStop(1, cluster.color + '18')
          ctx.fillStyle = fill
          ctx.beginPath()
          ctx.arc(cx, cy, bubbleR, 0, Math.PI * 2)
          ctx.fill()

          // Bubble border
          ctx.strokeStyle = cluster.color + (isHovered ? 'ee' : '66')
          ctx.lineWidth = (isHovered ? 2.5 : 1.5) / transform.k
          ctx.beginPath()
          ctx.arc(cx, cy, bubbleR, 0, Math.PI * 2)
          ctx.stroke()

          // Mini stars inside the bubble (decorative — same pattern as star-map bg stars)
          const miniCount = Math.min(count, 8)
          for (let i = 0; i < miniCount; i++) {
            const angle = (i / miniCount) * Math.PI * 2
            const r = bubbleR * 0.55
            const sx = cx + Math.cos(angle + time * 0.3) * r
            const sy = cy + Math.sin(angle + time * 0.3) * r
            const twinkle = Math.sin(time * 3 + i * 1.3) * 0.4 + 0.6
            ctx.globalAlpha = twinkle
            const starGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 5 / transform.k)
            starGrad.addColorStop(0, '#ffffff')
            starGrad.addColorStop(0.4, cluster.color)
            starGrad.addColorStop(1, cluster.color + '00')
            ctx.fillStyle = starGrad
            ctx.beginPath()
            ctx.arc(sx, sy, 5 / transform.k, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.globalAlpha = 1

          // Cluster name
          ctx.font = `${isHovered ? 'bold ' : ''}${16 / transform.k}px "Space Grotesk", sans-serif`
          ctx.fillStyle = isHovered ? cluster.color : '#f5f0e6'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(cluster.tag, cx, cy)

          // Creator count
          ctx.font = `${10 / transform.k}px "Space Grotesk", sans-serif`
          ctx.fillStyle = '#888'
          ctx.fillText(`${count} creator${count !== 1 ? 's' : ''}`, cx, cy + 20 / transform.k)
        })
      }

      // --- ZOOMED IN: draw individual stars ---
      if (showStars) {
        // Connection lines per cluster
        clusters.forEach(cluster => {
          const clusterStars = starPositions.filter(s => s.cluster_id === cluster.id)
          if (clusterStars.length > 1) {
            ctx.strokeStyle = cluster.color + '20'
            ctx.lineWidth = 1 / transform.k
            ctx.beginPath()
            clusterStars.forEach((star, i) => {
              if (i === 0) ctx.moveTo(star.x, star.y)
              else ctx.lineTo(star.x, star.y)
            })
            ctx.stroke()
          }
        })

        // Stars
        starPositions.forEach(star => {
          const isHovered = hoveredStar?.id === star.id && hoveredStar?.cluster_id === star.cluster_id
          const cluster = clusters.find(c => c.id === star.cluster_id)
          const color = cluster?.color ?? '#d4a574'

          // Float animation
          const floatX = Math.sin(time + star.baseX * 0.01) * 2
          const floatY = Math.cos(time * 1.3 + star.baseY * 0.01) * 2
          const x = star.x + floatX
          const y = star.y + floatY

          // Hover glow
          if (isHovered) {
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 30)
            glowGradient.addColorStop(0, color + '80')
            glowGradient.addColorStop(0.5, color + '30')
            glowGradient.addColorStop(1, 'transparent')
            ctx.fillStyle = glowGradient
            ctx.beginPath()
            ctx.arc(x, y, 30, 0, Math.PI * 2)
            ctx.fill()
          }

          // Star core
          const coreR = isHovered ? 12 : 8
          const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, coreR)
          coreGradient.addColorStop(0, '#ffffff')
          coreGradient.addColorStop(0.3, color)
          coreGradient.addColorStop(1, color + '00')
          ctx.fillStyle = coreGradient
          ctx.beginPath()
          ctx.arc(x, y, coreR, 0, Math.PI * 2)
          ctx.fill()

          // Avatar clip (when very zoomed in)
          if (transform.k >= 2 && star.avatar_url) {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.src = star.avatar_url
            const avatarR = isHovered ? 15 : 10
            ctx.save()
            ctx.beginPath()
            ctx.arc(x, y, avatarR, 0, Math.PI * 2)
            ctx.clip()
            try {
              ctx.drawImage(img, x - avatarR, y - avatarR, avatarR * 2, avatarR * 2)
            } catch {
              ctx.fillStyle = color
              ctx.fill()
            }
            ctx.restore()
            ctx.strokeStyle = isHovered ? '#d4a574' : color + '80'
            ctx.lineWidth = isHovered ? 2 : 1
            ctx.beginPath()
            ctx.arc(x, y, avatarR, 0, Math.PI * 2)
            ctx.stroke()
          }

          // Name label
          if (isHovered || transform.k >= 3) {
            ctx.font = `${isHovered ? 'bold ' : ''}${12 / transform.k}px "Space Grotesk", sans-serif`
            ctx.fillStyle = isHovered ? '#d4a574' : '#f5f0e6'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.fillText(star.name, x, y + (transform.k >= 2 ? 18 : 12))
          }
        })
      }

      ctx.restore()
      animationRef.current = requestAnimationFrame(render)
    }

    render()
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [dimensions, transform, clusters, starPositions, hoveredStar, hoveredCluster])

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{ touchAction: 'none' }}
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-vault-deep/80 border border-border text-sm">
        <span className="text-muted-foreground">Zoom:</span>
        <span className="text-vault-cream font-medium">{Math.round(transform.k * 100)}%</span>
        {transform.k < ZOOM_THRESHOLD && (
          <span className="text-vault-gold text-xs">(Zoom in to see creators)</span>
        )}
      </div>

      {/* Hovered star tooltip */}
      {hoveredStar && transform.k >= ZOOM_THRESHOLD && (
        <div
          className="absolute pointer-events-none z-10 p-3 rounded-lg bg-vault-charcoal border border-vault-bronze/50 shadow-xl max-w-[200px]"
          style={{
            left: (hoveredStar.x * transform.k + transform.x) + 20,
            top: (hoveredStar.y * transform.k + transform.y) - 10,
          }}
        >
          <div className="font-semibold text-vault-cream text-sm">{hoveredStar.name}</div>
          <div className="text-xs text-vault-gold mt-2">Click to view profile</div>
        </div>
      )}

      {/* Hovered cluster tooltip */}
      {hoveredCluster && transform.k < ZOOM_THRESHOLD && (
        <div
          className="absolute pointer-events-none z-10 p-3 rounded-lg bg-vault-charcoal border border-vault-bronze/50 shadow-xl max-w-[220px]"
          style={{
            left: (hoveredCluster.position_x * transform.k + transform.x) + 65,
            top: (hoveredCluster.position_y * transform.k + transform.y) - 40,
          }}
        >
          <div className="font-semibold text-vault-cream text-sm">{hoveredCluster.tag}</div>
          {hoveredCluster.description && (
            <div className="text-xs text-muted-foreground mt-1">{hoveredCluster.description}</div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-4 right-4 px-3 py-2 rounded-lg bg-vault-deep/80 border border-border text-xs text-muted-foreground">
        Scroll to zoom &bull; Drag to pan
      </div>
    </div>
  )
}
