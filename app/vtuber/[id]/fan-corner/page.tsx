'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function FanCornerPage() {
  const params = useParams<{ id: string }>();
  const vtuberId = params.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        <div className="archive-shell rounded-lg overflow-hidden border-2 border-[#1e3a4a] lighter-glitch">
          
          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-[#1e3a4a]">
            <div className="text-[#4fc9d6] text-[10px] tracking-[0.18em] mono">OBSCURAVT · CASE EVIDENCE</div>
            <div className="text-[#4fd6a8] text-[9px] tracking-[0.1em] mt-0.5">PAMU — COMMUNITY ARCHIVE</div>
          </div>

          <div className="case-folder p-7">
            
            {/* Gallery */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <div className="section-label">GALLERY</div>
                <Link href={`/fan-art?vtuber=${vtuberId}`} className="text-xs px-3 py-1 border border-[#5a4f2e]">
                  MORE →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="aspect-video bg-[#0d0d14] border border-[#143544] rounded"></div>
                <div className="aspect-video bg-[#0d0d14] border border-[#143544] rounded"></div>
                <div className="aspect-video bg-[#0d0d14] border border-[#143544] rounded"></div>
                <div className="aspect-video bg-[#0d0d14] border border-[#143544] rounded"></div>
              </div>
            </div>

            {/* Clips */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="section-label">CLIPS</div>
                <Link href={`/clips?vtuber=${vtuberId}`} className="text-xs px-3 py-1 border border-[#5a4f2e]">
                  MORE →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="aspect-video bg-[#0d0d14] border border-[#143544] rounded"></div>
                <div className="aspect-video bg-[#0d0d14] border border-[#143544] rounded"></div>
                <div className="aspect-video bg-[#0d0d14] border border-[#143544] rounded"></div>
                <div className="aspect-video bg-[#0d0d14] border border-[#143544] rounded"></div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
