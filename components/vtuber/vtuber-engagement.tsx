'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { VaultFrame } from '@/components/vault/vault-frame'
import { GalleryWall, GalleryWallItem } from '@/components/vault/vault-surfaces'
import { ImageUploadField } from '@/components/common/image-upload-field'
import { Progress } from '@/components/ui/progress'
import { Plus } from 'lucide-react'
import { StreamPredictions } from '@/components/vtuber/stream-predictions'
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

export function VTuberEngagement({ vtuberId, vtuberName, claimedBy }: Props) {
  const { user } = useAuth()
  const isOwner = user?.username === claimedBy

  const [memes, setMemes] = useState<Meme[]>([])
  const [fanArt, setFanArt] = useState<FanArtPiece[]>([])
  const [sessions, setSessions] = useState<QaSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QaQuestion[]>([])
  const [karaoke, setKaraoke] = useState<KaraokeReq[]>([])
  const [cmdmiIdeas, setCmdmiIdeas] = useState<CmdmiIdea[]>([])
  const [predictions, setPredictions] = useState<StreamPrediction[]>([])
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)

  const [memeUrl, setMemeUrl] = useState('')
  const [memeCaption, setMemeCaption] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [songArtist, setSongArtist] = useState('')
  const [qaTitle, setQaTitle] = useState('')
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
    ])
    setLoading(false)
  }, [loadMemes, loadFanArt, loadSessions, loadKaraoke, loadCmdmi, loadPredictions, loadSchedule])

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

  const hasQaActivity = !!openQaSession && questions.length > 0
  const hasGallery = memes.length > 0 || fanArt.length > 0
  const nextSchedule = useMemo(() => getNextScheduleSlot(schedule), [schedule])
  const hasSchedule = schedule.length > 0

  const hasActivity =
    !!activeCmdmi ||
    pendingKaraoke.length > 0 ||
    activePredictions.length > 0 ||
    hasQaActivity ||
    hasSchedule ||
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
      <h2 className="text-sm font-semibold text-vault-cream mb-4">Fan corner — {vtuberName}</h2>

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
                    {pendingKaraoke.slice(0, 3).map(k => (
                      <li key={k.id} className="flex justify-between gap-2 text-sm">
                        <span className="text-vault-cream truncate">{k.song_title}{k.artist ? ` — ${k.artist}` : ''}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{k.status} · ↑{k.upvotes}</span>
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
                  title="Q&A"
                  meta={`${openQaSession.title} · ${questions.length} question${questions.length === 1 ? '' : 's'}`}
                >
                  <ul className="space-y-2">
                    {questions.slice(0, 4).map(q => (
                      <li key={q.id} className="flex justify-between gap-2 p-2 rounded-lg border border-border/60 bg-muted/20">
                        <div className="min-w-0">
                          <p className="text-sm text-vault-cream line-clamp-2">{q.question}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">@{q.asked_by}{q.answered ? ' · answered' : ''}</p>
                        </div>
                        <span className="text-xs text-vault-gold shrink-0">↑{q.upvotes}</span>
                      </li>
                    ))}
                  </ul>
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
                  <h3 className="text-sm font-semibold text-vault-cream">Q&A</h3>
                  {isOwner && (
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
                        <Plus className="h-3.5 w-3.5" />Open
                      </button>
                    </div>
                  )}
                  {sessions.length > 0 && (
                    <select
                      value={activeSession ?? ''}
                      onChange={e => setActiveSession(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
                    >
                      {sessions.map(s => (
                        <option key={s.id} value={s.id}>{s.title} ({s.status})</option>
                      ))}
                    </select>
                  )}
                  {user && activeSession && (
                    <form onSubmit={submitQuestion} className="flex gap-2">
                      <input
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        placeholder="Ask a question…"
                        className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
                      />
                      <button type="submit" className="h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold">
                        Ask
                      </button>
                    </form>
                  )}
                  {sessions.length === 0 && (
                    <p className="text-xs text-muted-foreground">No Q&A sessions yet.</p>
                  )}
                </section>
              )}

              {pendingKaraoke.length === 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-vault-cream">Karaoke</h3>
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
                  {karaoke.length === 0 && (
                    <p className="text-xs text-muted-foreground">Queue is empty.</p>
                  )}
                </section>
              )}

              {!showPredictionsInline && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-vault-cream">Stream predictions</h3>
                  <StreamPredictions vtuberId={vtuberId} vtuberName={vtuberName} isOwner={isOwner} />
                </section>
              )}

              {!hasSchedule && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-vault-cream">Stream schedule</h3>
                  <p className="text-xs text-muted-foreground">No recurring slots posted yet.</p>
                  <Link href={`/schedule?vtuber=${vtuberId}`} className="text-xs text-vault-gold hover:underline">
                    View or set schedule →
                  </Link>
                </section>
              )}
            </div>
          </details>
        </>
      )}
    </VaultFrame>
  )
}