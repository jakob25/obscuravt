'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function FanCornerPage() {
  const params = useParams<{ id: string }>();
  const vtuberId = params.id;

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/cmdi/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vtuberId,
          title: formData.title,
          description: formData.description,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      setSubmitted(true)
      setFormData({ title: '', description: '' })
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        <div className="archive-shell rounded-lg overflow-hidden border-2 border-[#1e3a4a] lighter-glitch">
          
          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-[#1e3a4a]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#4fc9d6] text-[10px] tracking-[0.18em] mono">OBSCURAVT · CASE EVIDENCE</div>
                <div className="text-[#4fd6a8] text-[9px] tracking-[0.1em] mt-0.5">PAMU — COMMUNITY ARCHIVE</div>
              </div>
              <Link 
                href={`/vtuber/${vtuberId}`}
                className="text-xs px-3 py-1 border border-[#5a4f2e] hover:bg-[#5a4f2e] hover:text-[#e9dfc4]"
              >
                ← Back to Profile
              </Link>
            </div>
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

            {/* Clips - now dynamic per VTuber (placeholder for real data) */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3">
                <div className="section-label">CLIPS</div>
                <Link href={`/clips?vtuber=${vtuberId}`} className="text-xs px-3 py-1 border border-[#5a4f2e]">
                  MORE →
                </Link>
              </div>
              <div className="text-sm text-[#5a4f2e] italic">
                Clips for this VTuber will appear here (connected to edited_clips table).
              </div>
            </div>

            {/* CMDI Submit Form */}
            <div id="submit" className="border-t border-[#5a4f2e]/30 pt-8">
              <div className="section-label mb-3">SUBMIT A CHAT MADE ME DO IT IDEA</div>

              {submitted ? (
                <div className="bg-[#d4a843]/10 border border-[#d4a843] rounded p-6 text-center">
                  <p className="text-[#d4a843] font-medium mb-2">✓ Idea submitted successfully!</p>
                  <p className="text-sm text-[#5a4f2e]">It will appear as an active goal once reviewed.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-xs underline"
                  >
                    Submit another idea
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-mono mb-1.5 text-[#5a4f2e]">IDEA TITLE *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-[#0d0d14] border border-[#143544] rounded px-4 py-2 text-sm focus:outline-none focus:border-[#d4a843]"
                      placeholder="Cozy ASMR reading stream"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono mb-1.5 text-[#5a4f2e]">DESCRIPTION (OPTIONAL)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-[#0d0d14] border border-[#143544] rounded px-4 py-2 text-sm h-24 focus:outline-none focus:border-[#d4a843]"
                      placeholder="Describe your idea..."
                    />
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.title}
                    className="px-6 py-2.5 bg-[#d4a843] text-[#0d0d14] text-sm font-semibold rounded disabled:opacity-50 hover:brightness-105 transition-all"
                  >
                    {isSubmitting ? 'Submitting...' : 'SUBMIT IDEA'}
                  </button>

                  <p className="text-[10px] text-[#5a4f2e]">
                    Your idea will be reviewed and can become the next active CMDI goal.
                  </p>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
