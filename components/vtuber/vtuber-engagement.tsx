'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { VaultFrame } from '@/components/vault/vault-frame'
import { GalleryWall, GalleryWallItem } from '@/components/vault/vault-surfaces'
import { ImageUploadField } from '@/components/common/image-upload-field'
import {
  Image, MessageCircle, Mic2, CalendarClock, Palette, Lightbulb, ThumbsUp, Plus, Trophy,
} from 'lucide-react'
import { StreamPredictions } from '@/components/vtuber/stream-predictions'

interface Props {
  vtuberId: string
  vtuberName: string
  claimedBy: string | null
}

interface Meme { id: string; image_url: string; caption: string; upvotes: number; submitted_by: string; share_slug: string }
interface QaSession { id: string; title: string; status: string }
interface QaQuestion { id: string; question: string; asked_by: string; upvotes: number; answered: boolean }
interface KaraokeReq { id: string; song_title: string; artist: string; status: string; upvotes: number; requested_by: string }
export function VTuberEngagement({ vtuberId, vtuberName, claimedBy }: Props) {
  const { user } = useAuth()
  const isOwner = user?.username === claimedBy

  const [memes, setMemes] = useState<Meme[]>([])
  const [sessions, setSessions] = useState<QaSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QaQuestion[]>([])
  const [karaoke, setKaraoke] = useState<KaraokeReq[]>([])
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

  useEffect(() => {
    loadMemes()
    loadSessions()
    loadKaraoke()
  }, [loadMemes, loadSessions, loadKaraoke])

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
      <h2 className="text-sm font-semibold text-vault-cream mb-4">Fan corner — {vtuberName}</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link href={`/fan-art?vtuber=${vtuberId}`} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-vault-gold hover:border-vault-gold/40 flex items-center gap-1.5 cursor-pointer">
          <Palette className="h-3.5 w-3.5" /> Fan Art Gallery
        </Link>
        <Link href={`/cmdmi?profile=${vtuberId}`} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-vault-gold hover:border-vault-gold/40 flex items-center gap-1.5 cursor-pointer">
          <Lightbulb className="h-3.5 w-3.5" /> CMDMI Ideas
        </Link>
        <Link href={`/schedule?vtuber=${vtuberId}`} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-vault-gold hover:border-vault-gold/40 flex items-center gap-1.5 cursor-pointer">
          <CalendarClock className="h-3.5 w-3.5" /> Stream Schedule
        </Link>
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      <Tabs defaultValue="memes">
        <TabsList className="mb-4 bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="memes"><Image className="h-3.5 w-3.5 mr-1" />Memes</TabsTrigger>
          <TabsTrigger value="qa"><MessageCircle className="h-3.5 w-3.5 mr-1" />Q&A</TabsTrigger>
          <TabsTrigger value="karaoke"><Mic2 className="h-3.5 w-3.5 mr-1" />Karaoke</TabsTrigger>
          <TabsTrigger value="predictions"><Trophy className="h-3.5 w-3.5 mr-1" />Stream Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="memes" className="space-y-3">
          {user && (
            <form onSubmit={submitMeme} className="space-y-3">
              <ImageUploadField
                purpose="meme"
                label="Upload meme"
                onUploaded={url => setMemeUrl(url)}
                onClear={() => setMemeUrl('')}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <input value={memeUrl} onChange={e => setMemeUrl(e.target.value)} placeholder="Or paste image URL" className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream" />
                <input value={memeCaption} onChange={e => setMemeCaption(e.target.value)} placeholder="Caption (optional)" className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream" />
                <button type="submit" disabled={!memeUrl.trim()} className="h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold disabled:opacity-50">Post</button>
              </div>
            </form>
          )}
          <GalleryWall>
            {memes.map((m, i) => (
              <GalleryWallItem key={m.id} tilt={i % 3 === 0 ? 'left' : i % 3 === 1 ? 'right' : 'none'}>
                <div className="bg-muted/20">
                  <Link href={`/meme/${m.share_slug}`} className="block cursor-pointer">
                    <img src={m.image_url} alt={m.caption || 'meme'} className="w-full object-cover hover:opacity-90 transition-opacity" />
                  </Link>
                  <div className="p-2 flex justify-between items-center gap-1 bg-vault-deep/80">
                    <span className="text-[10px] text-muted-foreground truncate">@{m.submitted_by}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.share_slug && (
                        <Link href={`/meme/${m.share_slug}`} className="text-[10px] text-muted-foreground hover:text-vault-gold">
                          Share
                        </Link>
                      )}
                      <button type="button" disabled={!user} onClick={async () => { await fetch('/api/memes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ memeId: m.id }) }); loadMemes() }} className="text-xs text-vault-gold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                        ↑ {m.upvotes}
                      </button>
                    </div>
                  </div>
                </div>
              </GalleryWallItem>
            ))}
          </GalleryWall>
          {memes.length === 0 && <p className="text-xs text-muted-foreground">Wall&apos;s empty. Post the first meme.</p>}
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

        <TabsContent value="predictions">
          <StreamPredictions vtuberId={vtuberId} vtuberName={vtuberName} isOwner={isOwner} />
        </TabsContent>
      </Tabs>
    </VaultFrame>
  )
}