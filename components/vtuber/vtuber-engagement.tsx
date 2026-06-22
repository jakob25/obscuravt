'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { VaultFrame } from '@/components/vault/vault-frame'
import {
  Image, MessageCircle, Mic2, CalendarClock, Palette, Lightbulb, ThumbsUp, Plus,
} from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  vtuberId: string
  vtuberName: string
  claimedBy: string | null
}

interface Meme { id: string; image_url: string; caption: string; upvotes: number; submitted_by: string }
interface QaSession { id: string; title: string; status: string }
interface QaQuestion { id: string; question: string; asked_by: string; upvotes: number; answered: boolean }
interface KaraokeReq { id: string; song_title: string; artist: string; status: string; upvotes: number; requested_by: string }
interface ScheduleProposal { id: string; proposed_day: number; proposed_time: string; label: string | null; votes: number; dayLabel?: string }

export function VTuberEngagement({ vtuberId, vtuberName, claimedBy }: Props) {
  const { user } = useAuth()
  const isOwner = user?.username === claimedBy

  const [memes, setMemes] = useState<Meme[]>([])
  const [sessions, setSessions] = useState<QaSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QaQuestion[]>([])
  const [karaoke, setKaraoke] = useState<KaraokeReq[]>([])
  const [proposals, setProposals] = useState<ScheduleProposal[]>([])

  const [memeUrl, setMemeUrl] = useState('')
  const [memeCaption, setMemeCaption] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [songArtist, setSongArtist] = useState('')
  const [voteDay, setVoteDay] = useState(5)
  const [voteTime, setVoteTime] = useState('20:00')
  const [voteLabel, setVoteLabel] = useState('')
  const [qaTitle, setQaTitle] = useState('')
  const [error, setError] = useState('')

  const loadMemes = useCallback(async () => {
    const res = await fetch(`/api/memes?vtuberId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    setMemes(data.memes ?? [])
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

  const loadProposals = useCallback(async () => {
    const res = await fetch(`/api/schedule-votes?vtuberId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    setProposals(data.proposals ?? [])
  }, [vtuberId])

  useEffect(() => {
    loadMemes()
    loadSessions()
    loadKaraoke()
    loadProposals()
  }, [loadMemes, loadSessions, loadKaraoke, loadProposals])

  useEffect(() => {
    if (activeSession) loadQuestions(activeSession)
  }, [activeSession, loadQuestions])

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

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    const res = await fetch('/api/schedule-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ vtuberId, proposedDay: voteDay, proposedTime: voteTime, label: voteLabel || null }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setVoteLabel('')
    loadProposals()
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

  return (
    <VaultFrame className="p-6 mb-6">
      <h2 className="text-sm font-semibold text-vault-cream mb-4">Fan Engagement — {vtuberName}</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link href={`/fan-art?vtuber=${vtuberId}`} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-vault-gold hover:border-vault-gold/40 flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5" /> Fan Art Gallery
        </Link>
        <Link href={`/cmdmi?profile=${vtuberId}`} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-vault-gold hover:border-vault-gold/40 flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5" /> CMDMI Ideas
        </Link>
        <Link href={`/schedule?vtuber=${vtuberId}`} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-vault-gold hover:border-vault-gold/40 flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" /> Stream Schedule
        </Link>
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      <Tabs defaultValue="memes">
        <TabsList className="mb-4 bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="memes"><Image className="h-3.5 w-3.5 mr-1" />Memes</TabsTrigger>
          <TabsTrigger value="qa"><MessageCircle className="h-3.5 w-3.5 mr-1" />Q&A</TabsTrigger>
          <TabsTrigger value="karaoke"><Mic2 className="h-3.5 w-3.5 mr-1" />Karaoke</TabsTrigger>
          <TabsTrigger value="votes"><CalendarClock className="h-3.5 w-3.5 mr-1" />Schedule Vote</TabsTrigger>
        </TabsList>

        <TabsContent value="memes" className="space-y-3">
          {user && (
            <form onSubmit={submitMeme} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <input value={memeUrl} onChange={e => setMemeUrl(e.target.value)} placeholder="Image URL" className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream" />
              <input value={memeCaption} onChange={e => setMemeCaption(e.target.value)} placeholder="Caption (optional)" className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream" />
              <button type="submit" className="h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold">Post</button>
            </form>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {memes.map(m => (
              <div key={m.id} className="rounded-lg overflow-hidden border border-border/60 bg-muted/20">
                <img src={m.image_url} alt={m.caption || 'meme'} className="w-full aspect-square object-cover" />
                <div className="p-2 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground truncate">@{m.submitted_by}</span>
                  <button type="button" onClick={async () => { await fetch('/api/memes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ memeId: m.id }) }); loadMemes() }} className="text-xs text-vault-gold flex items-center gap-0.5">
                    <ThumbsUp className="h-3 w-3" />{m.upvotes}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {memes.length === 0 && <p className="text-xs text-muted-foreground">No memes yet — be the first!</p>}
        </TabsContent>

        <TabsContent value="qa" className="space-y-3">
          {isOwner && (
            <div className="flex gap-2">
              <input value={qaTitle} onChange={e => setQaTitle(e.target.value)} placeholder="New Q&A session title" className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream" />
              <button type="button" onClick={createQaSession} className="h-9 px-3 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold flex items-center gap-1"><Plus className="h-3.5 w-3.5" />Open</button>
            </div>
          )}
          {sessions.length > 0 && (
            <select value={activeSession ?? ''} onChange={e => setActiveSession(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream">
              {sessions.map(s => <option key={s.id} value={s.id}>{s.title} ({s.status})</option>)}
            </select>
          )}
          {user && activeSession && (
            <form onSubmit={submitQuestion} className="flex gap-2">
              <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Ask a question…" className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream" />
              <button type="submit" className="h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold">Ask</button>
            </form>
          )}
          {questions.map(q => (
            <div key={q.id} className="p-3 rounded-lg border border-border/60 bg-muted/20 flex justify-between gap-2">
              <div>
                <p className="text-sm text-vault-cream">{q.question}</p>
                <p className="text-[10px] text-muted-foreground mt-1">@{q.asked_by}{q.answered ? ' · answered' : ''}</p>
              </div>
              <button type="button" onClick={async () => { await fetch('/api/qa', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ action: 'upvote', questionId: q.id }) }); if (activeSession) loadQuestions(activeSession) }} className="text-xs text-vault-gold flex items-center gap-0.5 shrink-0">
                <ThumbsUp className="h-3 w-3" />{q.upvotes}
              </button>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-xs text-muted-foreground">No Q&A sessions yet.</p>}
        </TabsContent>

        <TabsContent value="karaoke" className="space-y-3">
          {user && (
            <form onSubmit={submitKaraoke} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <input value={songTitle} onChange={e => setSongTitle(e.target.value)} placeholder="Song title" className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream" />
              <input value={songArtist} onChange={e => setSongArtist(e.target.value)} placeholder="Artist" className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream" />
              <button type="submit" className="h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold">Request</button>
            </form>
          )}
          {karaoke.map(k => (
            <div key={k.id} className="p-3 rounded-lg border border-border/60 bg-muted/20 flex justify-between items-center gap-2">
              <div>
                <p className="text-sm text-vault-cream font-medium">{k.song_title}</p>
                <p className="text-xs text-muted-foreground">{k.artist || 'Unknown artist'} · @{k.requested_by} · {k.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={async () => { await fetch('/api/karaoke', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ requestId: k.id, upvote: true }) }); loadKaraoke() }} className="text-xs text-vault-gold flex items-center gap-0.5">
                  <ThumbsUp className="h-3 w-3" />{k.upvotes}
                </button>
                {isOwner && k.status === 'pending' && (
                  <button type="button" onClick={async () => { await fetch('/api/karaoke', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ requestId: k.id, status: 'queued' }) }); loadKaraoke() }} className="text-[10px] px-2 py-1 rounded bg-vault-gold/20 text-vault-gold">Queue</button>
                )}
              </div>
            </div>
          ))}
          {karaoke.length === 0 && <p className="text-xs text-muted-foreground">No karaoke requests yet.</p>}
        </TabsContent>

        <TabsContent value="votes" className="space-y-3">
          {user && (
            <form onSubmit={submitProposal} className="flex flex-wrap gap-2 items-end">
              <select value={voteDay} onChange={e => setVoteDay(Number(e.target.value))} className="h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream">
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
              <input value={voteTime} onChange={e => setVoteTime(e.target.value)} placeholder="Time (e.g. 20:00)" className="h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream w-28" />
              <input value={voteLabel} onChange={e => setVoteLabel(e.target.value)} placeholder="Label (optional)" className="flex-1 min-w-[120px] h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream" />
              <button type="submit" className="h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold">Propose</button>
            </form>
          )}
          {proposals.map(p => (
            <div key={p.id} className="p-3 rounded-lg border border-border/60 bg-muted/20 flex justify-between items-center">
              <div>
                <p className="text-sm text-vault-cream">{p.dayLabel ?? DAYS[p.proposed_day]} at {p.proposed_time}</p>
                {p.label && <p className="text-xs text-muted-foreground">{p.label}</p>}
              </div>
              <button type="button" disabled={!user} onClick={async () => { await fetch('/api/schedule-votes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ proposalId: p.id }) }); loadProposals() }} className="text-xs text-vault-gold flex items-center gap-0.5 disabled:opacity-40">
                <ThumbsUp className="h-3 w-3" />{p.votes}
              </button>
            </div>
          ))}
          {proposals.length === 0 && <p className="text-xs text-muted-foreground">No schedule proposals yet.</p>}
        </TabsContent>
      </Tabs>
    </VaultFrame>
  )
}