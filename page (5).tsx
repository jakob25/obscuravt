'use client'

import { use, useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useVTuberById, useClips, useBets, useVibeTags } from '@/hooks/use-data'
import { useAuth } from '@/lib/auth-context'
import { useStarMapData } from '@/hooks/use-star-map-data'
import { ArrowLeft, Film, ExternalLink, Youtube, Twitch, Twitter, Trophy, Image, Zap, Calendar, ThumbsUp, ExternalLink as ExtLink, Loader2, Send } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ClipCard } from '@/components/common/clip-card'
import { PhotoGallery } from '@/components/common/photo-gallery'

const platformIcons: Record<string, React.ElementType> = {
  youtube: Youtube, twitch: Twitch, twitter: Twitter,
  discord: ExternalLink, website: ExternalLink,
}

interface Props { params: Promise<{ id: string }> }

export default function VTuberPage({ params }: Props) {
  const { id } = use(params)
  const { vtuber, loading: vtLoading } = useVTuberById(id)
  const { clips, loading: clipsLoading } = useClips()
  const { bets } = useBets()
  const { constellations } = useStarMapData()
  const { vibeTags } = useVibeTags()
  const { user } = useAuth()
  const [photoLoaded, setPhotoLoaded] = useState(false)
  const [stampVisible, setStampVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'clips'|'photos'|'fanart'|'cmdmi'|'schedule'>('clips')
  const [fanArt, setFanArt] = useState<{id:string;twitter_url:string;submitted_by:string;created_at:string}[]>([])
  const [fanArtUrl, setFanArtUrl] = useState('')
  const [submittingArt, setSubmittingArt] = useState(false)
  const [ideas, setIdeas] = useState<{id:string;title:string;description:string;upvotes:number;status:string;submitted_by:string}[]>([])
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaDesc, setIdeaDesc] = useState('')
  const [submittingIdea, setSubmittingIdea] = useState(false)
  const [goals, setGoals] = useState<{id:string;idea_id:string;goal_amount:number;funded_amount:number;status:string}[]>([])
  const [pledging, setPledging] = useState<string|null>(null)
  const [pledgeAmounts, setPledgeAmounts] = useState<Record<string,string>>({})
  const [schedules, setSchedules] = useState<{id:string;day_of_week:number;start_time:string;timezone:string;label:string|null}[]>([])

  if (vtLoading) return <DossierSkeleton />
  if (!vtuber) return notFound()

  useEffect(() => {
    if (!vtuber) return
    Promise.all([
      fetch(`/api/fan-art?vtuber_id=${vtuber.id}`).then(r=>r.json()),
      fetch(`/api/cmdmi?profile_id=${vtuber.id}`).then(r=>r.json()),
      fetch(`/api/cmdmi?profile_id=${vtuber.id}&status=selected`).then(r=>r.json()),
      fetch(`/api/schedules?vtuber_id=${vtuber.id}`).then(r=>r.json()),
    ]).then(([art, allIdeas, _selected, sched]) => {
      setFanArt(art)
      setIdeas(allIdeas)
      setSchedules(sched)
      // Fetch active goals
      const selectedIds = allIdeas.filter((i:{status:string})=>i.status==='selected').map((i:{id:string})=>i.id)
      if (selectedIds.length > 0) {
        Promise.all(selectedIds.map((ideaId:string) =>
          fetch(`/api/cmdmi?profile_id=${vtuber.id}`).then(r=>r.json())
        )).catch(()=>{})
      }
    })
  }, [vtuber])

  const constellation = constellations.find(c => c.id === vtuber.category)
  const vtuberClips = clips.filter(c => c.vtuberId === vtuber.id)
  const relatedBets = bets.filter(b =>
    vtuber.name.toLowerCase().split(' ').some(w => w.length > 3 && b.title.toLowerCase().includes(w))
  ).slice(0, 2)

  const tagNames = vtuber.vibeTags
    .map(id => vibeTags.find(t => t.id === id)?.name)
    .filter(Boolean) as string[]

  const handlePhotoLoad = () => {
    setPhotoLoaded(true)
    setTimeout(() => setStampVisible(true), 600)
  }

  const caseNumber = vtuber.id.replace('vt_', '').toUpperCase().padEnd(8, '0').slice(0, 8)
  const fileDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;600&display=swap');

        .dossier-page { background: #1a1410; min-height: 100vh; padding: 2rem 1rem; }

        /* Notebook outer */
        .notebook {
          max-width: 900px;
          margin: 0 auto;
          background: #3d2e1e;
          border-radius: 4px;
          box-shadow:
            0 0 0 2px #2a1f12,
            0 20px 60px rgba(0,0,0,0.8),
            inset 0 0 30px rgba(0,0,0,0.3);
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 22px 1fr;
          position: relative;
        }

        /* Leather texture */
        .notebook::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 3px,
            rgba(0,0,0,0.04) 3px,
            rgba(0,0,0,0.04) 4px
          );
          pointer-events: none;
          z-index: 1;
        }

        /* Spine */
        .spine {
          background: #2a1f12;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          padding: 20px 0;
          border-left: 1px solid #1a1208;
          border-right: 1px solid #1a1208;
          z-index: 2;
        }
        .ring {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #b8a070, #6b5030);
          box-shadow: 0 1px 3px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15);
        }

        /* Pages */
        .page-left, .page-right {
          background: #f0e8d5;
          padding: 28px 24px 28px 28px;
          position: relative;
          min-height: 680px;
          z-index: 2;
        }
        .page-right { padding: 28px 28px 28px 24px; }

        /* Ruled lines */
        .page-left::before, .page-right::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: repeating-linear-gradient(
            transparent,
            transparent 27px,
            #c8b89050 27px,
            #c8b89050 28px
          );
          pointer-events: none;
        }

        /* Page number */
        .page-number {
          font-family: 'Courier Prime', monospace;
          font-size: 11px;
          color: #8b7355;
          position: absolute;
          top: 12px;
          right: 16px;
        }

        /* Torn paper edge on left page */
        .page-left::after {
          content: '';
          position: absolute;
          top: 0; right: -1px; bottom: 0;
          width: 3px;
          background: linear-gradient(180deg,
            #d4c4a0 0%, #c8b890 20%, #d4c4a0 40%,
            #c0b080 60%, #d4c4a0 80%, #c8b890 100%
          );
        }

        /* Paperclip on right page */
        .paperclip {
          position: absolute;
          top: -8px;
          right: 40px;
          width: 12px;
          height: 50px;
          border: 2.5px solid #9a9090;
          border-radius: 6px 6px 0 0;
          border-bottom: none;
          z-index: 10;
        }
        .paperclip::after {
          content: '';
          position: absolute;
          top: 8px;
          left: -5px;
          width: 10px;
          height: 30px;
          border: 2.5px solid #9a9090;
          border-radius: 5px 5px 0 0;
          border-bottom: none;
        }

        /* Sticky note effect */
        .sticky-note {
          background: #e8d89a;
          padding: 10px 12px;
          box-shadow: 2px 3px 8px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(0,0,0,0.05);
          position: relative;
          font-family: 'Courier Prime', monospace;
        }
        .sticky-note::before {
          content: '';
          position: absolute;
          top: -6px;
          left: 30px;
          width: 50px;
          height: 8px;
          background: rgba(180,160,80,0.6);
          transform: rotate(-1deg);
        }

        /* Polaroid */
        .polaroid {
          background: #fff;
          padding: 8px 8px 24px;
          box-shadow: 2px 3px 10px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08);
          transform: rotate(-2.5deg);
          display: inline-block;
          position: relative;
        }
        .polaroid-img {
          width: 110px;
          height: 110px;
          object-fit: cover;
          display: block;
          filter: sepia(25%) contrast(0.95);
        }
        .polaroid-img.loading {
          background: #d4c4a0;
        }

        /* Typewriter text */
        .type-field {
          font-family: 'Courier Prime', monospace;
          font-size: 12.5px;
          color: #2a1f0e;
          line-height: 28px;
        }
        .type-label {
          color: #5a4a30;
          font-weight: 700;
          font-size: 11.5px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .type-value {
          color: #1a1208;
          margin-left: 4px;
        }

        /* File header */
        .file-header {
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          color: #5a4a30;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #c0a870;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Info note */
        .info-note {
          background: #e0cc8a;
          border: 1px solid #c8a860;
          padding: 12px 14px;
          font-family: 'Courier Prime', monospace;
          font-size: 11.5px;
          color: #2a1f0e;
          line-height: 1.65;
          position: relative;
          transform: rotate(0.5deg);
          box-shadow: 2px 3px 8px rgba(0,0,0,0.18);
          margin-top: 14px;
        }
        .info-note::before {
          content: '';
          position: absolute;
          top: -5px; left: 20px;
          width: 60px; height: 7px;
          background: rgba(160,130,50,0.5);
          transform: rotate(-1deg);
        }
        .info-note-label {
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 6px;
          color: #5a4030;
        }

        /* CONFIDENTIEL stamp */
        .stamp {
          position: absolute;
          bottom: 18px;
          right: 16px;
          border: 3px solid #b03020;
          padding: 4px 10px;
          color: #b03020;
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transform: rotate(-8deg);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          box-shadow: inset 0 0 0 1px rgba(176,48,32,0.3);
        }
        .stamp.visible { opacity: 0.75; }

        /* Right page note sheet */
        .note-sheet {
          background: #faf8f0;
          border: 1px solid #e0d4b8;
          padding: 16px;
          box-shadow: 1px 2px 8px rgba(0,0,0,0.12);
          position: relative;
          min-height: 200px;
        }
        .note-sheet::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            transparent, transparent 23px,
            #d8cca840 23px, #d8cca840 24px
          );
          pointer-events: none;
        }

        /* Tags as handwritten */
        .hand-tag {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #3a2a10;
          background: transparent;
          border: 1px solid #8a7040;
          padding: 2px 8px;
          border-radius: 2px;
          display: inline-block;
          margin: 2px;
          transform: rotate(var(--rot, 0deg));
        }

        /* Section divider */
        .section-rule {
          border: none;
          border-top: 1px dashed #c0a870;
          margin: 16px 0;
        }

        /* Clip row */
        .clip-row {
          font-family: 'Courier Prime', monospace;
          font-size: 11.5px;
          padding: 5px 0;
          border-bottom: 1px solid #d4c4a050;
          color: #2a1f0e;
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        .clip-row:last-child { border-bottom: none; }

        /* Bet row */
        .bet-entry {
          font-family: 'Courier Prime', monospace;
          font-size: 11px;
          color: #2a1f0e;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px dashed #c0a87060;
        }

        /* Back link */
        .back-link {
          font-family: 'Courier Prime', monospace;
          font-size: 12px;
          color: #a09070;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 20px;
          text-decoration: none;
          letter-spacing: 0.03em;
          transition: color 0.2s;
        }
        .back-link:hover { color: #d4c4a0; }

        /* Platform link */
        .platform-link {
          font-family: 'Courier Prime', monospace;
          font-size: 11px;
          color: #5a4030;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: underline;
          text-underline-offset: 2px;
          margin-right: 10px;
        }

        @media (max-width: 640px) {
          .notebook { grid-template-columns: 1fr; }
          .spine { display: none; }
          .page-right { border-top: 2px solid #c0a870; }
        }
      `}</style>

      <div className="dossier-page">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Back nav */}
          <Link href="/discover" className="back-link">
            <ArrowLeft size={14} />
            ← RETURN TO STAR MAP
          </Link>

          {/* Notebook wrapper */}
          <div className="notebook">

            {/* ── LEFT PAGE ── */}
            <div className="page-left">
              <div className="file-header">
                <span>SUBJECT FILE</span>
                <span style={{ fontSize: 10, letterSpacing: '0.06em' }}>CASE #{caseNumber}</span>
              </div>

              {/* Polaroid + fields */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, position: 'relative' }}>
                  {/* Paperclip on photo */}
                  <div style={{
                    position: 'absolute', top: -10, left: 16,
                    width: 10, height: 40,
                    border: '2px solid #9090a0', borderRadius: '5px 5px 0 0', borderBottom: 'none',
                    zIndex: 5
                  }} />
                  <div className="polaroid">
                    <img
                      src={vtuber.avatarUrl}
                      alt={vtuber.name}
                      className={`polaroid-img ${!photoLoaded ? 'loading' : ''}`}
                      onLoad={handlePhotoLoad}
                      onError={handlePhotoLoad}
                    />
                  </div>
                </div>

                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div className="type-field">
                    <span className="type-label">Nom:</span>
                    <span className="type-value">{vtuber.name.split(' ').slice(-1)[0] || vtuber.name}</span>
                  </div>
                  <div className="type-field">
                    <span className="type-label">Prenom:</span>
                    <span className="type-value">{vtuber.name.split(' ')[0]}</span>
                  </div>
                  <div className="type-field">
                    <span className="type-label">Handle:</span>
                    <span className="type-value" style={{ fontSize: 11 }}>
                      {vtuber.externalLinks[0]?.url.split('/').pop() || vtuber.id.replace('vt_', '@')}
                    </span>
                  </div>
                  <div className="type-field">
                    <span className="type-label">Platform:</span>
                    <span className="type-value">
                      {vtuber.externalLinks.map(l => l.platform).join(' / ') || 'Unknown'}
                    </span>
                  </div>
                  <div className="type-field">
                    <span className="type-label">Constellation:</span>
                    <span className="type-value" style={{ color: constellation?.color || '#2a1f0e' }}>
                      {constellation?.name || '—'}
                    </span>
                  </div>
                  <div className="type-field">
                    <span className="type-label">Filed:</span>
                    <span className="type-value">{fileDate}</span>
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className="info-note">
                <div className="info-note-label">Information:</div>
                <div style={{ lineHeight: '20px' }}>
                  {vtuber.bio || `Subject is a VTuber operating in the ${constellation?.name || 'unknown'} constellation. Further intelligence pending.`}
                </div>
              </div>

              {/* Tags */}
              {tagNames.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="type-label" style={{ fontFamily: 'Courier Prime, monospace', fontSize: 11, marginBottom: 6 }}>
                    Vibe Classification:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {tagNames.slice(0, 8).map((name, i) => (
                      <span
                        key={i}
                        className="hand-tag"
                        style={{ '--rot': `${(i % 3 - 1) * 1.2}deg` } as React.CSSProperties}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {vtuber.externalLinks.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="type-label" style={{ fontFamily: 'Courier Prime, monospace', fontSize: 11, marginBottom: 4 }}>
                    Known Channels:
                  </div>
                  {vtuber.externalLinks.map((link, i) => {
                    const Icon = platformIcons[link.platform] || ExternalLink
                    return (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="platform-link">
                        <Icon size={11} />
                        {link.platform}
                      </a>
                    )
                  })}
                </div>
              )}

              {/* CONFIDENTIEL stamp */}
              <div className={`stamp ${stampVisible ? 'visible' : ''}`}>Confidentiel</div>
            </div>

            {/* ── SPINE ── */}
            <div className="spine">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="ring" />
              ))}
            </div>

            {/* ── RIGHT PAGE ── */}
            <div className="page-right">
              <div className="paperclip" />
              <span className="page-number">49</span>

              {/* Note sheet */}
              <div className="note-sheet" style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'Special Elite, cursive', fontSize: 12, color: '#5a4a30', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Intelligence Notes
                </div>

                {/* Clips section */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: 'Courier Prime, monospace', fontWeight: 700, fontSize: 11, color: '#5a4030', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Film size={11} /> Field Clips ({clipsLoading ? '…' : vtuberClips.length})
                  </div>
                  {clipsLoading ? (
                    <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 11, color: '#8a7050' }}>Loading intel…</div>
                  ) : vtuberClips.length === 0 ? (
                    <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 11, color: '#8a7050', fontStyle: 'italic' }}>
                      No documented footage on file.{' '}
                      <Link href="/clips" style={{ color: '#5a4030', textDecoration: 'underline' }}>Submit clip →</Link>
                    </div>
                  ) : (
                    vtuberClips.slice(0, 4).map(clip => (
                      <div key={clip.id} className="clip-row">
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          [{clip.type.toUpperCase()}] {clip.title}
                        </span>
                        <span style={{ flexShrink: 0, color: '#8a7050', fontSize: 10 }}>
                          ↑{clip.votes.up}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <hr className="section-rule" />

                {/* Bets section */}
                <div>
                  <div style={{ fontFamily: 'Courier Prime, monospace', fontWeight: 700, fontSize: 11, color: '#5a4030', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Trophy size={11} /> Active Intel Bets
                  </div>
                  {relatedBets.length === 0 ? (
                    <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 11, color: '#8a7050', fontStyle: 'italic' }}>
                      No active bets on file.{' '}
                      <Link href="/bets" style={{ color: '#5a4030', textDecoration: 'underline' }}>View bets →</Link>
                    </div>
                  ) : (
                    relatedBets.map(bet => {
                      const total = bet.options.reduce((s, o) => s + o.totalScraps, 0)
                      return (
                        <div key={bet.id} className="bet-entry">
                          <div style={{ fontWeight: 700, marginBottom: 3 }}>{bet.title}</div>
                          {bet.options.slice(0, 2).map(opt => {
                            const pct = total > 0 ? Math.round((opt.totalScraps / total) * 100) : 0
                            return (
                              <div key={opt.id} style={{ marginBottom: 2 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                                  <span>{opt.label}</span>
                                  <span style={{ color: '#8a7050' }}>{pct}%</span>
                                </div>
                                <div style={{ height: 3, background: '#d4c4a0', borderRadius: 2, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: '#8a6030', transition: 'width 0.8s ease' }} />
                                </div>
                              </div>
                            )
                          })}
                          <div style={{ fontSize: 10, color: '#8a7050', marginTop: 3 }}>{total.toLocaleString()} scraps pooled</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Constellation info */}
              {constellation && (
                <div className="sticky-note" style={{ transform: 'rotate(-1deg)' }}>
                  <div style={{ fontFamily: 'Special Elite, cursive', fontSize: 11, color: '#5a4030', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Constellation:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: constellation.color, boxShadow: `0 0 6px ${constellation.color}` }} />
                    <span style={{ fontFamily: 'Courier Prime, monospace', fontWeight: 700, fontSize: 12, color: '#2a1f0e' }}>
                      {constellation.name}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 11, color: '#4a3820', lineHeight: 1.5 }}>
                    {constellation.description}
                  </div>
                  <Link
                    href={`/discover?constellation=${constellation.id}`}
                    style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: '#8a6030', textDecoration: 'underline', marginTop: 6, display: 'inline-block' }}
                  >
                    → Explore constellation
                  </Link>
                </div>
              )}
            </div>

          </div>


          {/* ── Tabbed sections below dossier ── */}
          <div style={{ marginTop: 32 }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #3d2e1e', paddingBottom: 0 }}>
              {([['clips','🎬 Clips'],['photos','📸 Photos'],['fanart','🎨 Fan Art'],['cmdmi','⚡ CMDMI'],['schedule','📅 Schedule']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '8px 14px', border: 'none', borderBottom: activeTab === tab ? '2px solid #d4a843' : '2px solid transparent',
                    background: 'transparent', color: activeTab === tab ? '#d4a843' : '#7a6a45',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Clips tab */}
            {activeTab === 'clips' && (
              <div>
                {clipsLoading ? (
                  <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#7a6a45' }}>Loading clips…</p>
                ) : vtuberClips.length === 0 ? (
                  <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#7a6a45', fontStyle: 'italic' }}>
                    No clips on file.{' '}
                    <a href="/clips" style={{ color: '#d4a843', textDecoration: 'underline' }}>Submit one →</a>
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vtuberClips.map(clip => <ClipCard key={clip.id} clip={clip} />)}
                  </div>
                )}
              </div>
            )}


            {/* Photos tab */}
            {activeTab === 'photos' && (
              <div>
                <PhotoGallery vtuberId={vtuber.id} />
              </div>
            )}

            {/* Fan Art tab */}
            {activeTab === 'fanart' && (
              <div>
                {user && (
                  <div style={{ background: '#f0e8d5', border: '1px solid #c8b890', padding: '14px 16px', marginBottom: 20, borderRadius: 4 }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#5a4a30', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                      Submit Fan Art
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={fanArtUrl} onChange={e => setFanArtUrl(e.target.value)}
                        placeholder="Paste Twitter/X post URL…"
                        style={{ flex: 1, padding: '8px 10px', background: 'rgba(10,10,20,0.85)', border: '1px solid #2a2440', borderRadius: 6, color: '#fff', fontFamily: "'Courier Prime', monospace", fontSize: 12, outline: 'none' }}
                      />
                      <button
                        onClick={async () => {
                          if (!fanArtUrl.trim() || submittingArt) return
                          setSubmittingArt(true)
                          const res = await fetch('/api/fan-art', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({vtuber_id: vtuber.id, submitted_by: user.username, twitter_url: fanArtUrl.trim()}) })
                          if (res.ok) { const d = await res.json(); setFanArt(prev => [d, ...prev]); setFanArtUrl('') }
                          setSubmittingArt(false)
                        }}
                        disabled={submittingArt || !fanArtUrl.trim()}
                        style={{ padding: '8px 14px', background: '#d4a843', border: 'none', borderRadius: 6, color: '#0a0a14', fontFamily: "'Share Tech Mono', monospace", fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: submittingArt || !fanArtUrl.trim() ? 0.5 : 1 }}>
                        {submittingArt ? '…' : 'Submit'}
                      </button>
                    </div>
                  </div>
                )}
                {fanArt.length === 0 ? (
                  <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#7a6a45', fontStyle: 'italic' }}>No fan art submitted yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {fanArt.map(art => (
                      <div key={art.id} style={{ background: '#faf8f0', border: '1px solid #ddd0b4', padding: 12, borderRadius: 4 }}>
                        <a href={art.twitter_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: "'Courier Prime', monospace", fontSize: 11, color: '#5a4030', textDecoration: 'underline', wordBreak: 'break-all', display: 'block', marginBottom: 6 }}>
                          {art.twitter_url.replace('https://','').slice(0,40)}…
                        </a>
                        <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 10, color: '#8a7050', display: 'flex', justifyContent: 'space-between' }}>
                          <span>by {art.submitted_by}</span>
                          <button onClick={async () => { await fetch('/api/fan-art', {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:art.id,action:'report'})}); setFanArt(prev=>prev.filter(a=>a.id!==art.id)) }}
                            style={{ color: '#b03020', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: "'Courier Prime', monospace" }}>
                            Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CMDMI tab */}
            {activeTab === 'cmdmi' && (
              <div>
                <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#7a6a45', marginBottom: 16 }}>
                  Submit a stream idea. If the VTuber selects it and sets a scraps goal — help fund it to make it happen!
                </p>

                {/* Active goals */}
                {ideas.filter(i=>i.status==='selected').map(idea => {
                  const goal = goals.find(g=>g.idea_id===idea.id)
                  return goal ? (
                    <div key={idea.id} style={{ background: '#e8d89a', border: '1px solid #c8a860', padding: '14px 16px', marginBottom: 12, borderRadius: 4 }}>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#5a4030', textTransform: 'uppercase', marginBottom: 4 }}>Active Goal</div>
                      <div style={{ fontFamily: "'Courier Prime', monospace", fontWeight: 700, color: '#1a1208', marginBottom: 8 }}>{idea.title}</div>
                      <div style={{ height: 6, background: '#d4c4a0', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: '100%', width: `${Math.min(100,(goal.funded_amount/goal.goal_amount)*100)}%`, background: '#8a6030', transition: 'width 0.8s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Courier Prime', monospace", fontSize: 11, color: '#5a4030', marginBottom: 10 }}>
                        <span>{goal.funded_amount.toLocaleString()} / {goal.goal_amount.toLocaleString()} scraps</span>
                        <span>{Math.round((goal.funded_amount/goal.goal_amount)*100)}%</span>
                      </div>
                      {user && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="number" placeholder="Pledge amount…"
                            value={pledgeAmounts[goal.id]??''} onChange={e=>setPledgeAmounts(p=>({...p,[goal.id]:e.target.value}))}
                            style={{ flex: 1, padding: '6px 8px', background: 'rgba(10,10,20,0.8)', border: '1px solid #2a2440', borderRadius: 5, color: '#fff', fontFamily: "'Courier Prime', monospace", fontSize: 11, outline: 'none' }} />
                          <button disabled={pledging===goal.id||!pledgeAmounts[goal.id]}
                            onClick={async () => {
                              if (!pledgeAmounts[goal.id]) return
                              setPledging(goal.id)
                              await fetch('/api/cmdmi/pledge', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal_id:goal.id,username:user.username,amount:parseInt(pledgeAmounts[goal.id])})})
                              setPledging(null)
                            }}
                            style={{ padding: '6px 14px', background: '#d4a843', border: 'none', borderRadius: 5, color: '#0a0a14', fontFamily: "'Share Tech Mono', monospace", fontSize: 11, cursor: 'pointer', opacity: pledging===goal.id||!pledgeAmounts[goal.id]?0.5:1 }}>
                            {pledging===goal.id?'…':'Pledge'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null
                })}

                {/* Pending ideas */}
                <div style={{ marginBottom: 14 }}>
                  {ideas.filter(i=>i.status==='pending').map(idea => (
                    <div key={idea.id} style={{ fontFamily: "'Courier Prime', monospace", padding: '10px 0', borderBottom: '1px dashed #c0a87050' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1208', marginBottom: 2 }}>{idea.title}</div>
                      {idea.description && <div style={{ fontSize: 11, color: '#5a4030', marginBottom: 4 }}>{idea.description}</div>}
                      <div style={{ fontSize: 10, color: '#8a7050', display: 'flex', justifyContent: 'space-between' }}>
                        <span>by {idea.submitted_by}</span>
                        <span>↑ {idea.upvotes}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit idea */}
                {user && (
                  <div style={{ background: '#f0e8d5', border: '1px solid #c8b890', padding: '14px 16px', borderRadius: 4 }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#5a4a30', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Submit Your Idea</div>
                    <input value={ideaTitle} onChange={e=>setIdeaTitle(e.target.value)} placeholder="Stream idea title…"
                      style={{ width: '100%', padding: '7px 10px', background: 'rgba(10,10,20,0.85)', border: '1px solid #2a2440', borderRadius: 5, color: '#fff', fontFamily: "'Courier Prime', monospace", fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box' }} />
                    <textarea value={ideaDesc} onChange={e=>setIdeaDesc(e.target.value)} placeholder="Describe it (optional)…" rows={2}
                      style={{ width: '100%', padding: '7px 10px', background: 'rgba(10,10,20,0.85)', border: '1px solid #2a2440', borderRadius: 5, color: '#fff', fontFamily: "'Courier Prime', monospace", fontSize: 12, outline: 'none', resize: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
                    <button disabled={!ideaTitle.trim()||submittingIdea}
                      onClick={async () => {
                        if (!ideaTitle.trim()) return
                        setSubmittingIdea(true)
                        const res = await fetch('/api/cmdmi', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile_id:vtuber.id,submitted_by:user.username,title:ideaTitle.trim(),description:ideaDesc.trim()})})
                        if (res.ok) { const d=await res.json(); setIdeas(prev=>[d,...prev]); setIdeaTitle(''); setIdeaDesc('') }
                        setSubmittingIdea(false)
                      }}
                      style={{ padding: '8px 16px', background: '#d4a843', border: 'none', borderRadius: 5, color: '#0a0a14', fontFamily: "'Share Tech Mono', monospace", fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: !ideaTitle.trim()||submittingIdea?0.5:1 }}>
                      {submittingIdea?'Submitting…':'Submit Idea'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Schedule tab */}
            {activeTab === 'schedule' && (
              <div>
                {schedules.length === 0 ? (
                  <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#7a6a45', fontStyle: 'italic' }}>No stream schedule on file.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => {
                      const slots = schedules.filter(s => s.day_of_week === i)
                      return (
                        <div key={day} style={{ background: slots.length ? '#e8d89a' : '#faf8f0', border: `1px solid ${slots.length ? '#c8a860' : '#ddd0b4'}`, padding: '10px 8px', borderRadius: 4, minHeight: 70 }}>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#5a4030', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>{day}</div>
                          {slots.map(slot => (
                            <div key={slot.id} style={{ fontFamily: "'Courier Prime', monospace", fontSize: 10, color: '#1a1208', marginBottom: 3 }}>
                              {slot.start_time}
                              {slot.label && <div style={{ color: '#5a4030', fontSize: 9 }}>{slot.label}</div>}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}

function DossierSkeleton() {
  return (
    <div className="dossier-page">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ height: 20, width: 160, background: '#3d2e1e', borderRadius: 2, marginBottom: 20, opacity: 0.6 }} />
        <div className="notebook">
          <div className="page-left">
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 126, height: 150, background: '#d4c4a0', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                {[100, 80, 110, 70, 130].map((w, i) => (
                  <div key={i} style={{ height: 14, width: w, background: '#c0b080', borderRadius: 1, opacity: 0.5 }} />
                ))}
              </div>
            </div>
            <div style={{ height: 140, background: '#e0cc8a', opacity: 0.5, marginTop: 14 }} />
          </div>
          <div className="spine">
            {Array.from({ length: 14 }).map((_, i) => <div key={i} className="ring" />)}
          </div>
          <div className="page-right">
            <div style={{ height: 300, background: '#faf8f0', opacity: 0.7 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
