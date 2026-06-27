import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ExternalLink, Twitch, Youtube } from 'lucide-react'
import {
  DossierFrame,
  CaseFolder,
  CasePhoto,
  CaseField,
} from '@/components/vault/vault-surfaces'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { ClaimProfileButton } from '@/components/vtuber/claim-profile-button'
import { AddToCircleButton } from '@/components/vtuber/add-to-circle-button'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  params: Promise<{ id: string }>
}

export default async function VTuberProfilePage({ params }: Props) {
  const { id } = await params

  const { data: vtuber, error } = await supabase
    .from('vtubers')
    .select('*')
    .eq('id', id)
    .eq('approved', true)
    .single()

  if (error || !vtuber) {
    console.error('VTuber profile error:', error)
    notFound()
  }

  const tags: string[] = vtuber.tags ?? []
  const { data: canonicalTags } = await supabase
    .from('canonical_tags')
    .select('id, tag, color, category')
    .in('id', tags.length > 0 ? tags : ['none'])

  const tagMap = Object.fromEntries((canonicalTags ?? []).map(t => [t.id, t]))

  const clusterTag = tags.find(t => t.startsWith('clust_'))
  const cluster = clusterTag ? tagMap[clusterTag] : null

  const platform = (vtuber.platform ?? '').toLowerCase()
  const isTwitch = platform.includes('twitch')
  const isYoutube = platform.includes('youtube')

  const caseId = `OVT-${String(vtuber.id).replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase().padStart(5, '0')}`

  // Fetch active CMDI goal
  const { data: activeCmdiGoal } = await supabase
    .from('cmdi_goals')
    .select('*')
    .eq('vtuber_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch open bets for this specific VTuber
  const { data: openBets } = await supabase
    .from('bets')
    .select('id, title, option_a, option_b, status')
    .eq('vtuber_id', id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        <PageBackNav fallbackHref="/discover" label="Back to Star Map" className="mb-8" />

        <div className="archive-shell rounded-lg overflow-hidden border-2 border-[#1e3a4a]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1e3a4a]">
            <div>
              <div className="text-[#4fc9d6] text-[10px] tracking-[0.18em] mono">OBSCURAVT • SUBJECT ARCHIVE</div>
              <div className="text-[#4fd6a8] text-[9px] tracking-[0.1em]">{vtuber.claimed_by ? '● VERIFIED SUBJECT' : '● UNCLAIMED FILE'}</div>
            </div>
            <div className="text-[#5a8a99] text-[10px] mono tracking-[0.08em]">CASE NO. {caseId}</div>
          </div>

          <div className="case-folder p-7">
            
            {/* Top Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Link 
                href={`/vtuber/${id}/fan-corner`}
                className="px-4 py-1.5 text-xs border border-[#5a4f2e] hover:bg-[#5a4f2e] hover:text-[#e9dfc4] transition-colors"
              >
                FAN CORNER
              </Link>
              <AddToCircleButton vtuberId={vtuber.id} vtuberName={vtuber.name} />
              <ClaimProfileButton 
                vtuberId={vtuber.id} 
                vtuberName={vtuber.name} 
                claimedBy={vtuber.claimed_by ?? null} 
              />
            </div>

            {/* Subject Info */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
              <div className="lg:col-span-5 flex gap-5">
                <CasePhoto
                  src={vtuber.avatar_url}
                  alt={vtuber.name}
                  caption="FIG. 1 — SUBJECT"
                />
                <div className="flex-1 min-w-0 font-mono pt-1">
                  <CaseField label="CODENAME" value={vtuber.name} />
                  <CaseField label="HANDLE" value={vtuber.handle || undefined} />
                  <CaseField
                    label="CLUSTER"
                    value={cluster ? `FILED UNDER ${cluster.tag.toUpperCase()}` : undefined}
                  />
                  <CaseField
                    label="PLATFORM"
                    value={isTwitch ? 'TWITCH' : isYoutube ? 'YOUTUBE' : vtuber.platform || undefined}
                  />
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--case-ink-dim)] mb-1.5">
                  FIELD NOTES
                </div>
                <p className="text-[13.5px] leading-relaxed text-[var(--case-ink)]">
                  {vtuber.bio || 'No field notes on file.'}
                </p>
                {vtuber.link && (
                  <div className="mt-4">
                    <a
                      href={vtuber.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-medium border border-[rgba(60,50,20,0.35)] text-[var(--case-ink-dim)] hover:text-[var(--case-ink)] hover:border-[rgba(60,50,20,0.55)] transition-colors bg-white/10"
                    >
                      {isTwitch ? <Twitch className="h-3.5 w-3.5 text-purple-700" /> :
                       isYoutube ? <Youtube className="h-3.5 w-3.5 text-red-700" /> :
                       <ExternalLink className="h-3.5 w-3.5" />}
                      {isTwitch ? 'OPEN TWITCH CHANNEL' : isYoutube ? 'OPEN YOUTUBE CHANNEL' : (vtuber.platform || 'CHANNEL').toUpperCase()}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Made Me Do It */}
            <div className="mb-8 border-t border-[#5a4f2e]/30 pt-6">
              <div className="section-label mb-2">CHAT MADE ME DO IT</div>
              
              {activeCmdiGoal ? (
                <div className="bg-[#0d0d14] border border-[#143544] rounded p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{activeCmdiGoal.title}</span>
                    <span className="text-[#d4a843] font-medium">
                      {Math.round((activeCmdiGoal.current_progress / activeCmdiGoal.target) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#143544] rounded mb-1">
                    <div 
                      className="h-2 bg-[#d4a843] rounded transition-all" 
                      style={{ width: `${Math.min((activeCmdiGoal.current_progress / activeCmdiGoal.target) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-[#5a4f2e]">
                    {activeCmdiGoal.current_progress} / {activeCmdiGoal.target} scraps funded
                  </div>
                </div>
              ) : (
                <Link 
                  href={`/vtuber/${id}/fan-corner#submit`}
                  className="px-5 py-2.5 text-sm border border-[#d4a843] text-[#d4a843] hover:bg-[#d4a843] hover:text-[#0d0d14] transition-colors font-medium"
                >
                  + SUBMIT IDEA
                </Link>
              )}
            </div>

            {/* Schedule LEFT + Bets RIGHT (Bets now dynamic per VTuber) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#e9dfc4] border border-[#5a4f2e]/30 rounded p-4">
                <div className="section-label mb-1">SCHEDULE / LAST STREAM</div>
                <div className="text-sm">Next: Sunday 8:00 PM<br /><span className="text-xs text-[#5a4f2e]">or view last stream VOD</span></div>
              </div>

              {/* Bets - now shows real open bets for this specific VTuber */}
              <div className="bg-[#e9dfc4] border border-[#5a4f2e]/30 rounded p-4">
                <div className="section-label mb-2">BETS</div>
                
                {openBets && openBets.length > 0 ? (
                  <div className="space-y-2">
                    {openBets.map((bet) => (
                      <div key={bet.id} className="text-sm">
                        <div className="font-medium">{bet.title}</div>
                        <div className="text-xs text-[#5a4f2e]">
                          {bet.option_a} vs {bet.option_b}
                        </div>
                      </div>
                    ))}
                    <Link 
                      href={`/vtuber/${id}/bets`}
                      className="inline-block mt-1 text-xs text-[#d4a843] hover:underline"
                    >
                      View all open bets →
                    </Link>
                  </div>
                ) : (
                  <div className="text-sm text-[#5a4f2e]">
                    No open bets right now.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
