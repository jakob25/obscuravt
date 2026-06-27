'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { VaultFrame } from '@/components/vault/vault-frame'
import { GalleryWall, GalleryWallItem } from '@/components/vault/vault-surfaces'
import { ImageUploadField } from '@/components/common/image-upload-field'
import { Progress } from '@/components/ui/progress'
import { Plus, Check, X } from 'lucide-react'
import { StreamPredictions } from '@/components/vtuber/stream-predictions'
import { useOwnsVtuber } from '@/hooks/use-owns-vtuber'
import type { StreamPrediction } from '@/lib/stream-predictions'

interface Props {
  vtuberId: string
  vtuberName: string
  claimedBy: string | null
}

interface Meme {
  id: string
  image_url: string
  caption: string
  upvotes: number
  submitted_by: string
  share_slug: string
}

interface FanArtPiece {
  id: string
  image_url: string | null
  twitter_url: string
  submitted_by: string
}

interface QaSession { id: string; title: string; status: string }
interface QaQuestion { id: string; question: string; asked_by: string; upvotes: number; answered: boolean }
interface KaraokeReq { id: string; song_title: string; artist: string; status: string; upvotes: number; requested_by: string }

interface CmdmiGoal {
  id: string
  goal_amount: number
  funded_amount: number
  status: string
}

interface CmdmiIdea {
  id: string
  title: string
  submitted_by: string
  goal: CmdmiGoal | null
}

interface ScheduleSlot {
  id: string
  day_of_week: number
  start_time: string
  timezone: string
  label: string | null
}

interface ScheduleProposal {
  id: string
  proposed_day: number
  proposed_time: string
  label: string | null
  votes: number
  dayLabel: string
  created_by: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTime12h(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function getNextScheduleSlot(slots: ScheduleSlot[]): ScheduleSlot | null {
  if (slots.length === 0) return null
  const now = new Date()
  const today = now.getDay()
  const nowMins = now.getHours() * 60 + now.getMinutes()

  let best: { slot: ScheduleSlot; daysUntil: number } | null = null
  for (const slot of slots) {
    const [h, m] = slot.start_time.split(':').map(Number)
    const slotMins = h * 60 + m
    let daysUntil = (slot.day_of_week - today + 7) % 7
    if (daysUntil === 0 && slotMins <= nowMins) daysUntil = 7
    if (!best || daysUntil < best.daysUntil) best = { slot, daysUntil }
  }
  return best?.slot ?? slots[0]
}

function ActivityBlock({
  title,
  meta,
  href,
  children,
}: {
  title: string
  meta?: string
  href?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-vault-cream">{title}</h3>
          {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
        </div>
        {href && (
          <Link href={href} className="text-xs text-vault-gold hover:underline shrink-0">
            Open →
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function OwnerChip({ label }: { label: string }) {
  return (
    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-vault-gold/40 text-vault-gold font-mono">
      {label}
    </span>
  )
}

export function VTuberEngagement({ vtuberId, vtuberName, claimedBy }: Props) {
  const { user } = useAuth()
  const { owns: isOwner } = useOwnsVtuber(vtuberId, claimedBy)

  const [memes, setMemes] = useState<Meme[]>([])
  const [fanArt, setFanArt] = useState<FanArtPiece[]>([])
  const [sessions, setSessions] = useState<QaSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QaQuestion[]>([])
  const [karaoke, setKaraoke] = useState<KaraokeReq[]>([])
  const [cmdmiIdeas, setCmdmiIdeas] = useState<CmdmiIdea[]>([])
  const [predictions, setPredictions] = useState<StreamPrediction[]>([])
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [scheduleProposals, setScheduleProposals] = useState<ScheduleProposal[]>([])
  const [loading, setLoading] = useState(true)

  const [memeUrl, setMemeUrl] = useState('')
  const [memeCaption, setMemeCaption] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [songArtist, setSongArtist] = useState('')
  const [qaTitle, setQaTitle] = useState('')
  const [voteDay, setVoteDay] = useState(0)
  const [voteTime, setVoteTime] = useState('20:00')
  const [voteLabel, setVoteLabel] = useState('')
  const [error, setError] = useState('')

  const loadMemes = useCallback(async () => {
    const res = await fetch(`/api/memes?vtuberId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    setMemes(data.memes ?? [])
  }, [vtuberId])

  const loadFanArt = useCallback(async () => {
    const res = await fetch(`/api/fan-art?vtuberId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    setFanArt(data.art ?? [])
  }, [vtuberId])

  const loadSessions = useCallback(async () => {
    const res = await fetch(`/api/qa?vtuberId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    const list: QaSession[] = data.sessions ?? []
    setSessions(list)
    const open = list.find(s => s.status === 'open')
    if (open) setActiveSession(open.id)
  }, [vtuberId])

  const loadQuestions = useCallback(async (sessionId: string) => {
    const res = await fetch(`/api/qa?sessionId=${encodeURIComponent(sessionId)}`)
    const data = await res.json()
    setQuestions(data.questions ?? [])
  }, [])

  const loadKaraoke = useCallback(async () => {
    const res = await fetch(`/api/karaoke?vtuberId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    setKaraoke(data.requests ?? [])
  }, [vtuberId])

  const loadCmdmi = useCallback(async () => {
    const res = await fetch(`/api/cmdmi?profileId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    setCmdmiIdeas(data.ideas ?? [])
  }, [vtuberId])

  const loadPredictions = useCallback(async () => {
    const res = await fetch(`/api/stream-predictions?vtuberId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    setPredictions(data.predictions ?? [])
  }, [vtuberId])

  const loadSchedule = useCallback(async () => {
    const res = await fetch(`/api/schedule?vtuberId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    setSchedule(data.schedule ?? [])
  }, [vtuberId])

  const loadScheduleVotes = useCallback(async () => {
    const res = await fetch(`/api/schedule-votes?vtuberId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    setScheduleProposals(data.proposals ?? [])
  }, [vtuberId])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      loadMemes(),
      loadFanArt(),
      loadSessions(),
      loadKaraoke(),
      loadCmdmi(),
      loadPredictions(),
      loadSchedule(),
      loadScheduleVotes(),
    ])
    setLoading(false)
  }, [loadMemes, loadFanArt, loadSessions, loadKaraoke, loadCmdmi, loadPredictions, loadSchedule, loadScheduleVotes])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (activeSession) loadQuestions(activeSession)
  }, [activeSession, loadQuestions])

  const activeCmdmi = useMemo(
    () => cmdmiIdeas.find(i => i.goal?.status === 'active') ?? null,
    [cmdmiIdeas],
  )

  const pendingKaraoke = useMemo(
    () => karaoke.filter(k => k.status === 'pending' || k.status === 'queued'),
    [karaoke],
  )

  const activePredictions = useMemo(
    () => predictions.filter(p => p.status === 'open' || p.status === 'closed'),
    [predictions],
  )

  const openQaSession = useMemo(
    () => sessions.find(s => s.status === 'open') ?? null,
    [sessions],
  )

  const hasQaActivity = !!openQaSession
  const hasGallery = memes.length > 0 || fanArt.length > 0
  const nextSchedule = useMemo(() => getNextScheduleSlot(schedule), [schedule])
  const hasSchedule = schedule.length > 0
  const hasScheduleVotes = scheduleProposals.length > 0

  const hasActivity =
    !!activeCmdmi ||
    pendingKaraoke.length > 0 ||
    activePredictions.length > 0 ||
    hasQaActivity ||
    hasSchedule ||
    hasScheduleVotes ||
    hasGallery

  const showPredictionsInline = activePredictions.length > 0

  const submitMeme = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !memeUrl.trim()) return
    setError('')
    const res = await fetch('/api/memes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ vtuberId, imageUrl: memeUrl, caption: memeCaption }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setMemeUrl(''); setMemeCaption('')
    loadMemes()
  }

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !activeSession || !newQuestion.trim()) return
    setError('')
    const res = await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId: activeSession, question: newQuestion }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setNewQuestion('')
    loadQuestions(activeSession)
  }

  const submitKaraoke = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !songTitle.trim()) return
    setError('')
    const res = await fetch('/api/karaoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ vtuberId, songTitle, artist: songArtist }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setSongTitle(''); setSongArtist('')
    loadKaraoke()
  }

  const submitScheduleProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    const res = await fetch('/api/schedule-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        vtuberId,
        proposedDay: voteDay,
        proposedTime: voteTime,
        label: voteLabel || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setVoteLabel('')
    loadScheduleVotes()
  }

  const voteForProposal = async (proposalId: string) => {
    if (!user) return
    const res = await fetch('/api/schedule-votes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ proposalId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    loadScheduleVotes()
  }

  const upvoteQuestion = async (questionId: string) => {
    if (!user) return
    const res = await fetch('/api/qa', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'upvote', questionId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    if (activeSession) loadQuestions(activeSession)
  }

  const markAnswered = async (questionId: string) => {
    if (!isOwner) return
    const res = await fetch('/api/qa', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'answer', questionId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    if (activeSession) loadQuestions(activeSession)
  }

  const closeQaSession = async (sessionId: string) => {
    if (!isOwner) return
    const res = await fetch('/api/qa', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'close', sessionId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    loadSessions()
  }

  const upvoteKaraoke = async (requestId: string) => {
    if (!user) return
    const res = await fetch('/api/karaoke', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ requestId, upvote: true }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    loadKaraoke()
  }

  const updateKaraokeStatus = async (requestId: string, status: 'queued' | 'done' | 'rejected') => {
    if (!isOwner) return
    const res = await fetch('/api/karaoke', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ requestId, status }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    loadKaraoke()
  }

  const createQaSession = async () => {
    if (!isOwner || !qaTitle.trim()) return
    const res = await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'session', vtuberId, title: qaTitle }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setQaTitle('')
    loadSessions()
  }

  const galleryItems = useMemo(() => {
    const items: Array<
      | { kind: 'meme'; key: string; meme: Meme }
      | { kind: 'fan-art'; key: string; art: FanArtPiece }
    > = []
    memes.forEach(m => items.push({ kind: 'meme', key: `meme-${m.id}`, meme: m }))
    fanArt.forEach(a => items.push({ kind: 'fan-art', key: `art-${a.id}`, art: a }))
    return items
  }, [memes, fanArt])

  return (
    <VaultFrame className="p-6 mb-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-semibold text-vault-cream">Fan corner — {vtuberName}</h2>
        {isOwner && <OwnerChip label="Your dossier" />}
      </div>

      {isOwner && (
        <p className="text-xs text-muted-foreground mb-3 border-l-2 border-vault-gold/50 pl-3">
          Open a Q&A session, queue karaoke requests, or post a stream prediction — fans in your Circle get notified.
        </p>
      )}

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {loading ? (
        <p className="text-xs text-muted-foreground animate-pulse">Loading fan activity…</p>
      ) : (
        <>
          {hasActivity ? (
            <div className="space-y-4 mb-4">
              {activeCmdmi?.goal && (
                <ActivityBlock
                  title="CMDMI — funding in progress"
                  meta={`${activeCmdmi.title} · by ${activeCmdmi.submitted_by}`}
                  href={`/cmdmi?profile=${vtuberId}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {activeCmdmi.goal.funded_amount.toLocaleString()} / {activeCmdmi.goal.goal_amount.toLocaleString()} scraps
                      </span>
                      <span className="text-vault-gold">
                        {Math.round((activeCmdmi.goal.funded_amount / activeCmdmi.goal.goal_amount) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min((activeCmdmi.goal.funded_amount / activeCmdmi.goal.goal_amount) * 100, 100)}
                      className="h-1.5"
                    />
                  </div>
                </ActivityBlock>
              )}

              {pendingKaraoke.length > 0 && (
                <ActivityBlock
                  title="Karaoke queue"
                  meta={`${pendingKaraoke.length} request${pendingKaraoke.length === 1 ? '' : 's'} waiting`}
                >
                  <ul className="space-y-2">
                    {pendingKaraoke.slice(0, 5).map(k => (
                      <li key={k.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/50 bg-muted/20">
                        <div className="min-w-0">
                          <p className="text-sm text-vault-cream truncate">{k.song_title}{k.artist ? ` — ${k.artist}` : ''}</p>
                          <p className="text-[10px] text-muted-foreground">@{k.requested_by} · {k.status}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={!user}
                            onClick={() => upvoteKaraoke(k.id)}
                            className="text-xs text-vault-gold px-2 py-1 rounded border border-vault-bronze/30 disabled:opacity-40"
                          >
                            ↑ {k.upvotes}
                          </button>
                          {isOwner && (
                            <>
                              {k.status === 'pending' && (
                                <button type="button" onClick={() => updateKaraokeStatus(k.id, 'queued')} className="text-[10px] px-1.5 py-1 rounded bg-vault-gold/20 text-vault-gold">Queue</button>
                              )}
                              {k.status === 'queued' && (
                                <button type="button" onClick={() => updateKaraokeStatus(k.id, 'done')} className="text-[10px] px-1.5 py-1 rounded bg-emerald-500/20 text-emerald-400">Done</button>
                              )}
                              <button type="button" onClick={() => updateKaraokeStatus(k.id, 'rejected')} className="text-[10px] px-1 py-1 rounded text-red-400 hover:bg-red-500/10" title="Reject">
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </ActivityBlock>
              )}

              {showPredictionsInline && (
                <ActivityBlock
                  title="Stream predictions"
                  meta={`${activePredictions.length} open for wagers or votes`}
                  href="/bets"
                >
                  <StreamPredictions
                    vtuberId={vtuberId}
                    vtuberName={vtuberName}
                    isOwner={isOwner}
                    hideIntro
                    statusFilter={['open', 'closed']}
                  />
                </ActivityBlock>
              )}

              {hasQaActivity && openQaSession && (
                <ActivityBlock
                  title="Q&A live"
                  meta={`${openQaSession.title} · ${questions.length} question${questions.length === 1 ? '' : 's'}`}
                >
                  {isOwner && (
                    <div className="flex items-center justify-between mb-2">
                      <OwnerChip label="Owner controls" />
                      <button
                        type="button"
                        onClick={() => closeQaSession(openQaSession.id)}
                        className="text-[10px] px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        Close session
                      </button>
                    </div>
                  )}
                  {questions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Session open — be the first to ask.</p>
                  ) : (
                    <ul className="space-y-2">
                      {questions.slice(0, 6).map(q => (
                        <li key={q.id} className={`flex items-start justify-between gap-2 p-2 rounded-lg border bg-muted/20 ${q.answered ? 'border-emerald-500/30 opacity-70' : 'border-border/60'}`}>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-vault-cream line-clamp-2">{q.question}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">@{q.asked_by}{q.answered ? ' · answered' : ''}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={!user || q.answered}
                              onClick={() => upvoteQuestion(q.id)}
                              className="text-xs text-vault-gold px-2 py-1 rounded border border-vault-bronze/30 disabled:opacity-40"
                            >
                              ↑ {q.upvotes}
                            </button>
                            {isOwner && !q.answered && (
                              <button
                                type="button"
                                onClick={() => markAnswered(q.id)}
                                className="text-[10px] px-1.5 py-1 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-0.5"
                                title="Mark answered"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {user && !isOwner && activeSession && (
                    <form onSubmit={submitQuestion} className="flex gap-2 mt-3">
                      <input
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        placeholder="Ask a question…"
                        className="flex-1 h-8 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
                      />
                      <button type="submit" className="h-8 px-3 rounded-lg bg-vault-gold text-vault-deep text-xs font-semibold">Ask</button>
                    </form>
                  )}
                </ActivityBlock>
              )}

              {hasSchedule && nextSchedule && (
                <ActivityBlock
                  title="Stream schedule"
                  meta={`${schedule.length} slot${schedule.length === 1 ? '' : 's'} on file`}
                  href={`/schedule?vtuber=${vtuberId}`}
                >
                  <p className="text-sm text-vault-cream">
                    Next: {DAYS[nextSchedule.day_of_week]} {formatTime12h(nextSchedule.start_time)} {nextSchedule.timezone}
                    {nextSchedule.label ? ` · ${nextSchedule.label}` : ''}
                  </p>
                </ActivityBlock>
              )}

              {hasScheduleVotes && (
                <ActivityBlock
                  title="Schedule votes"
                  meta="Fans proposing stream times"
                  href={`/schedule?vtuber=${vtuberId}`}
                >
                  <ul className="space-y-2">
                    {scheduleProposals.slice(0, 3).map(p => (
                      <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-vault-cream truncate">
                          {p.dayLabel} {formatTime12h(p.proposed_time)}
                          {p.label ? ` · ${p.label}` : ''}
                        </span>
                        <button
                          type="button"
                          disabled={!user}
                          onClick={() => voteForProposal(p.id)}
                          className="text-xs text-vault-gold disabled:opacity-40 shrink-0"
                        >
                          ↑ {p.votes}
                        </button>
                      </li>
                    ))}
                  </ul>
                </ActivityBlock>
              )}

              {hasGallery && (
                <ActivityBlock
                  title="Fan submissions"
                  meta={`${memes.length} meme${memes.length === 1 ? '' : 's'} · ${fanArt.length} fan art`}
                  href={`/fan-art?vtuber=${vtuberId}`}
                >
                  <GalleryWall>
                    {galleryItems.map((item, i) => (
                      <GalleryWallItem
                        key={item.key}
                        tilt={i % 3 === 0 ? 'left' : i % 3 === 1 ? 'right' : 'none'}
                      >
                        <div className="bg-muted/20">
                          {item.kind === 'meme' ? (
                            <>
                              <Link href={`/meme/${item.meme.share_slug}`} className="block cursor-pointer">
                                <img
                                  src={item.meme.image_url}
                                  alt={item.meme.caption || 'meme'}
                                  className="w-full object-cover hover:opacity-90 transition-opacity"
                                />
                              </Link>
                              <div className="p-2 flex justify-between items-center gap-1 bg-vault-deep/80">
                                <span className="text-[10px] text-muted-foreground truncate">meme · @{item.meme.submitted_by}</span>
                                <button
                                  type="button"
                                  disabled={!user}
                                  onClick={async () => {
                                    await fetch('/api/memes', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ memeId: item.meme.id }),
                                    })
                                    loadMemes()
                                  }}
                                  className="text-xs text-vault-gold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  ↑ {item.meme.upvotes}
                                </button>
                              </div>
                            </>
                          ) : item.art.image_url ? (
                            <div>
                              <img src={item.art.image_url} alt="Fan art" className="w-full object-cover" />
                              <div className="p-2 bg-vault-deep/80">
                                <span className="text-[10px] text-muted-foreground">fan art · {item.art.submitted_by}</span>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={item.art.twitter_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-4 text-center text-xs text-muted-foreground hover:text-vault-gold"
                            >
                              fan art · view on X
                            </a>
                          )}
                        </div>
                      </GalleryWallItem>
                    ))}
                  </GalleryWall>
                </ActivityBlock>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-4">Nothing live right now.</p>
          )}

          <details className="group">
            <summary className="text-sm font-medium text-vault-cream cursor-pointer list-none flex items-center gap-2">
              <span className="text-muted-foreground group-open:rotate-90 transition-transform inline-block">›</span>
              More ways to engage
            </summary>

            <div className="mt-4 space-y-6 pt-4 border-t border-border">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-vault-cream">Post a meme or fan art</h3>
                {user ? (
                  <form onSubmit={submitMeme} className="space-y-3">
                    <ImageUploadField
                      purpose="meme"
                      label="Upload meme"
                      onUploaded={url => setMemeUrl(url)}
                      onClear={() => setMemeUrl('')}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <input
                        value={memeUrl}
                        onChange={e => setMemeUrl(e.target.value)}
                        placeholder="Or paste image URL"
                        className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
                      />
                      <input
                        value={memeCaption}
                        onChange={e => setMemeCaption(e.target.value)}
                        placeholder="Caption (optional)"
                        className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
                      />
                      <button type="submit" disabled={!memeUrl.trim()} className="h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold disabled:opacity-50">
                        Post meme
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs text-muted-foreground">Sign in to post memes.</p>
                )}
                <Link href={`/fan-art?vtuber=${vtuberId}`} className="text-xs text-vault-gold hover:underline">
                  Submit fan art on the gallery page →
                </Link>
              </section>

              {!activeCmdmi && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-vault-cream">CMDMI</h3>
                  <p className="text-xs text-muted-foreground">Pitch a stream idea or pledge toward a goal.</p>
                  <Link href={`/cmdmi?profile=${vtuberId}`} className="text-xs text-vault-gold hover:underline">
                    Open CMDMI board →
                  </Link>
                </section>
              )}

              {!hasQaActivity && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-vault-cream">Q&A</h3>
                    {isOwner && <OwnerChip label="Owner" />}
                  </div>
                  {isOwner ? (
                    <div className="flex gap-2">
                      <input
                        value={qaTitle}
                        onChange={e => setQaTitle(e.target.value)}
                        placeholder="New Q&A session title"
                        className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
                      />
                      <button
                        type="button"
                        onClick={createQaSession}
                        className="h-9 px-3 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />Open session
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No open Q&A right now. Check back during streams.</p>
                  )}
                  {sessions.filter(s => s.status === 'closed').length > 0 && (
                    <p className="text-xs text-muted-foreground">{sessions.filter(s => s.status === 'closed').length} past session(s) on file.</p>
                  )}
                </section>
              )}

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-vault-cream">Karaoke</h3>
                  {isOwner && pendingKaraoke.length > 0 && <OwnerChip label="Manage queue" />}
                </div>
                {user ? (
                  <form onSubmit={submitKaraoke} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <input
                      value={songTitle}
                      onChange={e => setSongTitle(e.target.value)}
                      placeholder="Song title"
                      className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
                    />
                    <input
                      value={songArtist}
                      onChange={e => setSongArtist(e.target.value)}
                      placeholder="Artist"
                      className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
                    />
                    <button type="submit" className="h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold">
                      Request
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-muted-foreground">Sign in to request a song.</p>
                )}
                {karaoke.length > 0 ? (
                  <ul className="space-y-2">
                    {karaoke.map(k => (
                      <li key={k.id} className={`flex items-center justify-between gap-2 p-2 rounded-lg border ${k.status === 'done' || k.status === 'rejected' ? 'border-border/30 opacity-50' : 'border-border/50 bg-muted/20'}`}>
                        <div className="min-w-0">
                          <p className="text-sm text-vault-cream truncate">{k.song_title}{k.artist ? ` — ${k.artist}` : ''}</p>
                          <p className="text-[10px] text-muted-foreground">@{k.requested_by} · {k.status}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(k.status === 'pending' || k.status === 'queued') && (
                            <button
                              type="button"
                              disabled={!user}
                              onClick={() => upvoteKaraoke(k.id)}
                              className="text-xs text-vault-gold px-2 py-1 rounded border border-vault-bronze/30 disabled:opacity-40"
                            >
                              ↑ {k.upvotes}
                            </button>
                          )}
                          {isOwner && k.status === 'pending' && (
                            <button type="button" onClick={() => updateKaraokeStatus(k.id, 'queued')} className="text-[10px] px-1.5 py-1 rounded bg-vault-gold/20 text-vault-gold">Queue</button>
                          )}
                          {isOwner && k.status === 'queued' && (
                            <button type="button" onClick={() => updateKaraokeStatus(k.id, 'done')} className="text-[10px] px-1.5 py-1 rounded bg-emerald-500/20 text-emerald-400">Done</button>
                          )}
                          {isOwner && (k.status === 'pending' || k.status === 'queued') && (
                            <button type="button" onClick={() => updateKaraokeStatus(k.id, 'rejected')} className="p-1 text-red-400 hover:bg-red-500/10 rounded">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Queue is empty.</p>
                )}
              </section>

              {!showPredictionsInline && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-vault-cream">Stream predictions</h3>
                  <StreamPredictions vtuberId={vtuberId} vtuberName={vtuberName} isOwner={isOwner} />
                </section>
              )}

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-vault-cream">Schedule votes</h3>
                <p className="text-xs text-muted-foreground">
                  Propose when {vtuberName} should stream. {isOwner ? 'Promote winners on the schedule page.' : 'Upvote your pick.'}
                </p>
                {user ? (
                  <form onSubmit={submitScheduleProposal} className="space-y-2">
                    <select
                      value={voteDay}
                      onChange={e => setVoteDay(Number(e.target.value))}
                      className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
                    >
                      {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={voteTime}
                        onChange={e => setVoteTime(e.target.value)}
                        className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
                      />
                      <input
                        value={voteLabel}
                        onChange={e => setVoteLabel(e.target.value)}
                        placeholder="Label (optional)"
                        className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
                      />
                    </div>
                    <button type="submit" className="h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold">
                      Propose time
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-muted-foreground">Sign in to propose or vote.</p>
                )}
                {scheduleProposals.length > 0 ? (
                  <ul className="space-y-2">
                    {scheduleProposals.map(p => (
                      <li key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/20 border border-border/50">
                        <div className="min-w-0">
                          <p className="text-sm text-vault-cream">
                            {p.dayLabel} {formatTime12h(p.proposed_time)}
                            {p.label ? ` · ${p.label}` : ''}
                          </p>
                          <p className="text-[10px] text-muted-foreground">by @{p.created_by}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!user}
                          onClick={() => voteForProposal(p.id)}
                          className="text-xs text-vault-gold disabled:opacity-40 shrink-0 px-2 py-1 rounded border border-vault-bronze/30"
                        >
                          ↑ {p.votes}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No proposals yet — be first.</p>
                )}
                <Link href={`/schedule?vtuber=${vtuberId}`} className="text-xs text-vault-gold hover:underline">
                  {isOwner ? 'Manage schedule & promote winners →' : 'View full schedule →'}
                </Link>
              </section>

              {!hasSchedule && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-vault-cream">Stream schedule</h3>
                  <p className="text-xs text-muted-foreground">No recurring slots posted yet.</p>
                </section>
              )}
            </div>
          </details>
        </>
      )}
    </VaultFrame>
  )
}