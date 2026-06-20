'use client'

import { useRef, useEffect } from 'react'
import { useStarMapData } from '@/hooks/use-star-map-data'

export function StarMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())
  const { vtubers, constellations, loading } = useStarMapData()

  useEffect(() => {
    if (!canvasRef.current || loading) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background stars
    ctx.fillStyle = '#ffffff15'
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * rect.width
      const y = Math.random() * rect.height
      const size = Math.random() * 1.5 + 0.5
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw constellations first (background)
    constellations.forEach((c: any) => {
      if (!c.position) return
      
      ctx.strokeStyle = c.color + '40'
      ctx.lineWidth = 1
      ctx.beginPath()
      
      // Simple constellation lines (placeholder)
      const x = c.position.x * rect.width
      const y = c.position.y * rect.height
      
      ctx.moveTo(x - 30, y - 20)
      ctx.lineTo(x + 30, y + 20)
      ctx.stroke()
    })

    // Draw VTubers as orbs
    vtubers.forEach((v: any) => {
      if (!v.position) return
      
      const x = v.position.x * rect.width
      const y = v.position.y * rect.height
      const radius = 8

      // Try to use cached image
      const cachedImg = imageCache.current.get(v.id)
      
      if (cachedImg && cachedImg.complete) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(cachedImg, x - radius, y - radius, radius * 2, radius * 2)
        ctx.restore()
      } else if (v.avatarUrl) {
        // Load and cache image
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = v.avatarUrl
        imageCache.current.set(v.id, img)
        
        img.onload = () => {
          if (canvasRef.current) {
            const ctx2 = canvasRef.current.getContext('2d')
            if (ctx2) {
              ctx2.save()
              ctx2.beginPath()
              ctx2.arc(x, y, radius, 0, Math.PI * 2)
              ctx2.clip()
              ctx2.drawImage(img, x - radius, y - radius, radius * 2, radius * 2)
              ctx2.restore()
            }
          }
        }
      } else {
        // Fallback: draw colored circle
        ctx.fillStyle = v.color || '#d4a843'
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }, [vtubers, constellations, loading])

  if (loading) {
    return <div className="h-[600px] flex items-center justify-center text-white/50">Loading star map...</div>
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-[600px] rounded-2xl border border-white/10 bg-[#050508]"
    />
  )
}
