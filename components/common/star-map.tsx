'use client'

import * as React from 'react'
import { useRef, useEffect, useState, useCallback } from 'react'
import { zoom, zoomIdentity, D3ZoomEvent } from 'd3-zoom'
import { select } from 'd3-selection'
import type { VTuber, Constellation } from '@/lib/types'
import { vtubers, constellations, getVTubersByConstellation } from '@/lib/mock-data'

interface StarMapProps {
  onVTuberSelect?: (vtuber: VTuber) => void
  onConstellationSelect?: (constellation: Constellation) => void
  initialConstellation?: string
}

interface StarPosition {
  vtuber: VTuber
  x: number
  y: number
  baseX: number
  baseY: number
}

const ZOOM_THRESHOLD = 1.5 // Below this, show constellation labels; above, show individual stars
const MIN_ZOOM = 0.5
const MAX_ZOOM = 4

export function StarMap({ onVTuberSelect, onConstellationSelect, initialConstellation }: StarMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [hoveredStar, setHoveredStar] = useState<StarPosition | null>(null)
  const [hoveredConstellation, setHoveredConstellation] = useState<Constellation | null>(null)
  const [starPositions, setStarPositions] = useState<StarPosition[]>([])
  const animationRef = useRef<number | null>(null)
  const mousePos = useRef({ x: 0, y: 0 })

  // Generate star positions based on constellations
  useEffect(() => {
    const positions: StarPosition[] = []
    const baseWidth = 1000
    const baseHeight = 800

    constellations.forEach((constellation) => {
      const clusterVTubers = getVTubersByConstellation(constellation.id)
      const centerX = (constellation.position.x / 1000) * baseWidth
      const centerY = (constellation.position.y / 600) * baseHeight

      clusterVTubers.forEach((vtuber, index) => {
        // Arrange stars in a loose cluster around the constellation center
        const angle = (index / clusterVTubers.length) * Math.PI * 2 + Math.random() * 0.5
        const radius = 40 + Math.random() * 60
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius

        positions.push({
          vtuber,
          x,
          y,
          baseX: x,
          baseY: y,
        })
      })
    })

    setStarPositions(positions)
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
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        })
      })

    canvas.call(zoomBehavior)

    // If there's an initial constellation, zoom to it
    if (initialConstellation) {
      const constellation = constellations.find(c => c.id === initialConstellation)
      if (constellation) {
        const targetX = (constellation.position.x / 1000) * 1000
        const targetY = (constellation.position.y / 600) * 800
        const newTransform = zoomIdentity
          .translate(dimensions.width / 2 - targetX * 2, dimensions.height / 2 - targetY * 2)
          .scale(2)
        canvas.call(zoomBehavior.transform, newTransform)
      }
    }

    return () => {
      canvas.on('.zoom', null)
    }
  }, [dimensions, initialConstellation])

  // Mouse tracking for hover detection
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - transform.x) / transform.k
    const y = (event.clientY - rect.top - transform.y) / transform.k

    mousePos.current = { x, y }

    // Check if hovering over a star (only when zoomed in)
    if (transform.k >= ZOOM_THRESHOLD) {
      const hitRadius = 20 / transform.k
      const hovered = starPositions.find(star => {
        const dx = star.x - x
        const dy = star.y - y
        return Math.sqrt(dx * dx + dy * dy) < hitRadius
      })
      setHoveredStar(hovered || null)
      setHoveredConstellation(null)
    } else {
      // Check if hovering over constellation label
      const hitRadius = 60
      const hoveredConst = constellations.find(constellation => {
        const centerX = (constellation.position.x / 1000) * 1000
        const centerY = (constellation.position.y / 600) * 800
        const dx = centerX - x
        const dy = centerY - y
        return Math.sqrt(dx * dx + dy * dy) < hitRadius
      })
      setHoveredConstellation(hoveredConst || null)
      setHoveredStar(null)
    }
  }, [transform, starPositions])

  const handleClick = useCallback(() => {
    if (hoveredStar && onVTuberSelect) {
      onVTuberSelect(hoveredStar.vtuber)
    } else if (hoveredConstellation && onConstellationSelect) {
      onConstellationSelect(hoveredConstellation)
    }
  }, [hoveredStar, hoveredConstellation, onVTuberSelect, onConstellationSelect])

  // Animation and render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let time = 0

    const render = () => {
      time += 0.016 // ~60fps
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Save context and apply transform
      ctx.save()
      ctx.translate(transform.x, transform.y)
      ctx.scale(transform.k, transform.k)

      // Draw background gradient
      const gradient = ctx.createRadialGradient(500, 400, 0, 500, 400, 800)
      gradient.addColorStop(0, 'rgba(26, 26, 26, 1)')
      gradient.addColorStop(1, 'rgba(18, 18, 20, 1)')
      ctx.fillStyle = gradient
      ctx.fillRect(-1000, -1000, 3000, 3000)

      // Draw distant background stars
      ctx.fillStyle = 'rgba(212, 165, 116, 0.2)'
      for (let i = 0; i < 200; i++) {
        const x = (i * 37) % 1200 - 100
        const y = (i * 53) % 1000 - 100
        const size = (i % 3) * 0.5 + 0.5
        const twinkle = Math.sin(time * 2 + i) * 0.3 + 0.7
        ctx.globalAlpha = twinkle * 0.4
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw constellation centers and labels (when zoomed out)
      if (transform.k < ZOOM_THRESHOLD) {
        constellations.forEach((constellation) => {
          const centerX = (constellation.position.x / 1000) * 1000
          const centerY = (constellation.position.y / 600) * 800

          ctx.fillStyle = constellation.color
          ctx.beginPath()
          ctx.arc(centerX, centerY, 8, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = 'rgba(212, 165, 116, 0.9)'
          ctx.font = 'bold 14px Space Grotesk, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(constellation.name, centerX, centerY - 20)
        })
      }

      // Draw individual stars (when zoomed in)
      if (transform.k >= ZOOM_THRESHOLD) {
        starPositions.forEach((star) => {
          const alpha = 0.7 + Math.sin(time * 3 + star.x) * 0.3
          ctx.fillStyle = `rgba(212, 165, 116, ${alpha})`
          ctx.beginPath()
          ctx.arc(star.x, star.y, 3.5, 0, Math.PI * 2)
          ctx.fill()

          // Glow effect
          ctx.fillStyle = `rgba(212, 165, 116, ${alpha * 0.3})`
          ctx.beginPath()
          ctx.arc(star.x, star.y, 6, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      // Draw tooltip for hovered star
      if (hoveredStar && transform.k >= ZOOM_THRESHOLD) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillRect(hoveredStar.x + 15, hoveredStar.y - 30, 180, 50)
        
        ctx.fillStyle = '#f0e8d0'
        ctx.font = 'bold 13px Space Grotesk, sans-serif'
        ctx.fillText(hoveredStar.vtuber.name, hoveredStar.x + 20, hoveredStar.y - 12)
        
        ctx.fillStyle = '#8b7355'
        ctx.font = '12px Space Grotesk, sans-serif'
        ctx.fillText('Click to view profile', hoveredStar.x + 20, hoveredStar.y + 5)
      }

      ctx.restore()

      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, transform, starPositions, hoveredStar, hoveredConstellation])

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

      {/* Hovered VTuber tooltip */}
      {hoveredStar && transform.k >= ZOOM_THRESHOLD && (
        <div 
          className="absolute pointer-events-none z-10 p-3 rounded-lg bg-vault-charcoal border border-vault-bronze/50 shadow-xl max-w-[200px]"
          style={{
            left: (hoveredStar.x * transform.k + transform.x) + 20,
            top: (hoveredStar.y * transform.k + transform.y) - 10,
          }}
        >
          <div className="font-semibold text-vault-cream text-sm">{hoveredStar.vtuber.name}</div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{hoveredStar.vtuber.bio}</div>
          <div className="text-xs text-vault-gold mt-2">Click to view profile</div>
        </div>
      )}

      {/* Instructions overlay */}
      <div className="absolute top-4 right-4 px-3 py-2 rounded-lg bg-vault-deep/80 border border-border text-xs text-muted-foreground">
        Scroll to zoom &bull; Drag to pan
      </div>
    </div>
  )
}
