'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { zoom, D3ZoomEvent } from 'd3-zoom'
import { select } from 'd3-selection'
import { supabase } from '@/lib/supabase'

interface NicheNode {
  id: string
  tag: string
  color: string
  position_x: number
  position_y: number
  description: string
  vtuber_count: number
}

interface NicheMapProps {
  onNodeSelect?: (node: NicheNode) => void
}

const MIN_ZOOM = 0.4
const MAX_ZOOM = 5

export function NicheMap({ onNodeSelect }: NicheMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [nodes, setNodes] = useState<NicheNode[]>([])
  const [hoveredNode, setHoveredNode] = useState<NicheNode | null>(null)
  const animationRef = useRef<number>(0)

  // Fetch niche_cluster data from Supabase
  useEffect(() => {
    
    supabase
      .from('canonical_tags')
      .select('id, tag, color, position_x, position_y, description')
      .eq('category', 'niche_cluster')
      .order('sort_order')
      .then(async ({ data: tags, error }) => {
        if (error || !tags) return

        // Count vtubers per niche cluster
        const { data: vtubers } = await supabase
          .from('vtubers')
          .select('id, tags')
          .eq('approved', true)

        const enriched: NicheNode[] = tags.map(t => ({
          id: t.id,
          tag: t.tag,
          color: t.color ?? '#888888',
          position_x: t.position_x ?? 500,
          position_y: t.position_y ?? 400,
          description: t.description ?? '',
          vtuber_count: vtubers?.filter(v => Array.isArray(v.tags) && v.tags.includes(t.id)).length ?? 0,
        }))

        setNodes(enriched)
      })
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

  // Setup d3-zoom
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
    const hovered = nodes.find(node => {
      const dx = node.position_x - x
      const dy = node.position_y - y
      return Math.sqrt(dx * dx + dy * dy) < 70
    })
    setHoveredNode(hovered ?? null)
  }, [transform, nodes])

  const handleClick = useCallback(() => {
    if (hoveredNode && onNodeSelect) onNodeSelect(hoveredNode)
  }, [hoveredNode, onNodeSelect])

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

      ctx.save()
      ctx.translate(transform.x, transform.y)
      ctx.scale(transform.k, transform.k)

      // Background gradient
      const gradient = ctx.createRadialGradient(500, 400, 0, 500, 400, 800)
      gradient.addColorStop(0, 'rgba(26, 26, 26, 1)')
      gradient.addColorStop(1, 'rgba(18, 18, 20, 1)')
      ctx.fillStyle = gradient
      ctx.fillRect(-1000, -1000, 3000, 3000)

      // Background particles
      for (let i = 0; i < 200; i++) {
        const x = (i * 37) % 1200 - 100
        const y = (i * 53) % 1000 - 100
        const size = (i % 3) * 0.5 + 0.5
        const twinkle = Math.sin(time * 2 + i) * 0.3 + 0.7
        ctx.globalAlpha = twinkle * 0.15
        ctx.fillStyle = 'rgba(212, 165, 116, 1)'
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      if (nodes.length === 0) {
        // Skeleton loading dots while data arrives
        ctx.font = `${14 / transform.k}px "Space Grotesk", sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.2)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Loading…', 500, 450)
        ctx.restore()
        animationRef.current = requestAnimationFrame(render)
        return
      }

      // Connection lines between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dist = Math.sqrt((a.position_x - b.position_x) ** 2 + (a.position_y - b.position_y) ** 2)
          if (dist < 350) {
            ctx.strokeStyle = `rgba(255,255,255,${0.04 * (1 - dist / 350)})`
            ctx.lineWidth = 1 / transform.k
            ctx.beginPath()
            ctx.moveTo(a.position_x, a.position_y)
            ctx.lineTo(b.position_x, b.position_y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach(node => {
        const isHovered = hoveredNode?.id === node.id
        const pulse = Math.sin(time * 1.5 + node.position_x * 0.01) * 3
        const r = 52 + (isHovered ? pulse + 6 : 0)

        // Outer glow
        const glowGradient = ctx.createRadialGradient(node.position_x, node.position_y, 0, node.position_x, node.position_y, r * 2.2)
        glowGradient.addColorStop(0, node.color + (isHovered ? '55' : '28'))
        glowGradient.addColorStop(0.5, node.color + '10')
        glowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(node.position_x, node.position_y, r * 2.2, 0, Math.PI * 2)
        ctx.fill()

        // Bubble fill
        const fill = ctx.createRadialGradient(node.position_x - r * 0.3, node.position_y - r * 0.3, 0, node.position_x, node.position_y, r)
        fill.addColorStop(0, node.color + (isHovered ? 'cc' : '88'))
        fill.addColorStop(0.7, node.color + (isHovered ? '55' : '40'))
        fill.addColorStop(1, node.color + '18')
        ctx.fillStyle = fill
        ctx.beginPath()
        ctx.arc(node.position_x, node.position_y, r, 0, Math.PI * 2)
        ctx.fill()

        // Border
        ctx.strokeStyle = node.color + (isHovered ? 'ee' : '66')
        ctx.lineWidth = (isHovered ? 2.5 : 1.5) / transform.k
        ctx.beginPath()
        ctx.arc(node.position_x, node.position_y, r, 0, Math.PI * 2)
        ctx.stroke()

        // Node name
        ctx.font = `${isHovered ? 'bold ' : ''}${14 / transform.k}px "Space Grotesk", sans-serif`
        ctx.fillStyle = isHovered ? '#ffffff' : '#f5f0e6dd'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(node.tag, node.position_x, node.position_y - (node.vtuber_count > 0 ? 8 : 0))

        // Creator count
        if (node.vtuber_count > 0) {
          ctx.font = `${10 / transform.k}px "Space Grotesk", sans-serif`
          ctx.fillStyle = node.color + (isHovered ? 'ff' : 'bb')
          ctx.fillText(`${node.vtuber_count} creator${node.vtuber_count !== 1 ? 's' : ''}`, node.position_x, node.position_y + 10)
        }
      })

      ctx.restore()
      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [dimensions, transform, nodes, hoveredNode])

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

      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-10 p-3 rounded-lg bg-vault-charcoal border border-vault-bronze/50 shadow-xl max-w-[220px]"
          style={{
            left: (hoveredNode.position_x * transform.k + transform.x) + 65,
            top: (hoveredNode.position_y * transform.k + transform.y) - 40,
          }}
        >
          <div className="font-semibold text-vault-cream text-sm">{hoveredNode.tag}</div>
          {hoveredNode.description && (
            <div className="text-xs text-muted-foreground mt-1">{hoveredNode.description}</div>
          )}
          <div className="text-xs mt-1.5" style={{ color: hoveredNode.color }}>
            {hoveredNode.vtuber_count} creator{hoveredNode.vtuber_count !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-vault-deep/80 border border-border text-sm">
        <span className="text-muted-foreground">Zoom:</span>
        <span className="text-vault-cream font-medium">{Math.round(transform.k * 100)}%</span>
      </div>

      <div className="absolute top-4 right-4 px-3 py-2 rounded-lg bg-vault-deep/80 border border-border text-xs text-muted-foreground">
        Scroll to zoom &bull; Drag to pan
      </div>
    </div>
  )
}
