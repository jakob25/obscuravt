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
  const animationRef = useRef<number>()
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
      ctx.globalAlpha = 1

      const showConstellationLabels = transform.k < ZOOM_THRESHOLD
      const showIndividualStars = transform.k >= ZOOM_THRESHOLD

      // Draw constellation connections (subtle lines between stars)
      if (showIndividualStars) {
        constellations.forEach(constellation => {
          const clusterStars = starPositions.filter(
            s => s.vtuber.category === constellation.id
          )
          
          if (clusterStars.length > 1) {
            ctx.strokeStyle = `${constellation.color}20`
            ctx.lineWidth = 1 / transform.k
            ctx.beginPath()
            
            // Connect stars in sequence
            clusterStars.forEach((star, i) => {
              if (i === 0) {
                ctx.moveTo(star.x, star.y)
              } else {
                ctx.lineTo(star.x, star.y)
              }
            })
            ctx.stroke()
          }
        })
      }

      // Draw constellation labels (when zoomed out)
      if (showConstellationLabels) {
        constellations.forEach(constellation => {
          const centerX = (constellation.position.x / 1000) * 1000
          const centerY = (constellation.position.y / 600) * 800
          const isHovered = hoveredConstellation?.id === constellation.id

          // Constellation glow
          const glowGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, isHovered ? 100 : 80
          )
          glowGradient.addColorStop(0, `${constellation.color}40`)
          glowGradient.addColorStop(0.5, `${constellation.color}15`)
          glowGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, isHovered ? 100 : 80, 0, Math.PI * 2)
          ctx.fill()

          // Constellation name
          ctx.font = `${isHovered ? 'bold ' : ''}${16 / transform.k}px "Space Grotesk", sans-serif`
          ctx.fillStyle = isHovered ? constellation.color : '#f5f0e6'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(constellation.name, centerX, centerY)

          // Star count
          const count = getVTubersByConstellation(constellation.id).length
          ctx.font = `${10 / transform.k}px "Space Grotesk", sans-serif`
          ctx.fillStyle = '#888'
          ctx.fillText(`${count} creators`, centerX, centerY + 20 / transform.k)
        })
      }

      // Draw individual stars (when zoomed in)
      if (showIndividualStars) {
        starPositions.forEach(star => {
          const isHovered = hoveredStar?.vtuber.id === star.vtuber.id
          const constellation = constellations.find(c => c.id === star.vtuber.category)
          const color = constellation?.color || '#d4a574'
          
          // Gentle floating animation
          const floatX = Math.sin(time + star.baseX * 0.01) * 2
          const floatY = Math.cos(time * 1.3 + star.baseY * 0.01) * 2
          const x = star.x + floatX
          const y = star.y + floatY

          // Star glow
          if (isHovered) {
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 30)
            glowGradient.addColorStop(0, `${color}80`)
            glowGradient.addColorStop(0.5, `${color}30`)
            glowGradient.addColorStop(1, 'transparent')
            ctx.fillStyle = glowGradient
            ctx.beginPath()
            ctx.arc(x, y, 30, 0, Math.PI * 2)
            ctx.fill()
          }

          // Star core
          const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, isHovered ? 12 : 8)
          coreGradient.addColorStop(0, '#ffffff')
          coreGradient.addColorStop(0.3, color)
          coreGradient.addColorStop(1, `${color}00`)
          ctx.fillStyle = coreGradient
          ctx.beginPath()
          ctx.arc(x, y, isHovered ? 12 : 8, 0, Math.PI * 2)
          ctx.fill()

          // Draw avatar as star (only when quite zoomed in)
          if (transform.k >= 2) {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.src = star.vtuber.avatarUrl
            
            ctx.save()
            ctx.beginPath()
            ctx.arc(x, y, isHovered ? 15 : 10, 0, Math.PI * 2)
            ctx.clip()
            
            // Draw avatar if loaded
            try {
              ctx.drawImage(img, x - (isHovered ? 15 : 10), y - (isHovered ? 15 : 10), isHovered ? 30 : 20, isHovered ? 30 : 20)
            } catch {
              // Fallback to colored circle
              ctx.fillStyle = color
              ctx.fill()
            }
            ctx.restore()

            // Border
            ctx.strokeStyle = isHovered ? '#d4a574' : `${color}80`
            ctx.lineWidth = isHovered ? 2 : 1
            ctx.beginPath()
            ctx.arc(x, y, isHovered ? 15 : 10, 0, Math.PI * 2)
            ctx.stroke()
          }

          // Star name (when hovered or very zoomed in)
          if (isHovered || transform.k >= 3) {
            ctx.font = `${isHovered ? 'bold ' : ''}${12 / transform.k}px "Space Grotesk", sans-serif`
            ctx.fillStyle = isHovered ? '#d4a574' : '#f5f0e6'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.fillText(star.vtuber.name, x, y + (transform.k >= 2 ? 18 : 12))
          }
        })
      }

      ctx.restore()

      animationRef.current = requestAnimationFrame(render)
    }

    render()

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
