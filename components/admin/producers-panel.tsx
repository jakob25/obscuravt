'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { VaultFrame } from '@/components/vault/vault-frame'
import { MemberPicker } from '@/components/corpo/member-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PRODUCER_LINK_KEYS, PRODUCER_ROLES, PRODUCER_SERVICES, type ProducerRole, type ProducerService } from '@/lib/producers'
import { PRODUCERS } from '@/lib/site-copy'

const EMPTY_PRODUCER = {
  name: '', bio: '', genre_tags: '', commission_url: '', portfolio_url: '',
  youtube: '', twitch: '', x: '', bluesky: '', soundcloud: '',
}
const EMPTY_CREDIT = { producer_id: '', song_title: '', song_url: '', role: '' as ProducerRole | '' }

async function post(url: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

/**
 * Owner-only adds for producer files and their credits. The owner is the
 * verification: nothing here is public, and there is no pending queue.
 */
export function ProducersPanel() {
  const [producers, setProducers] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState(EMPTY_PRODUCER)
  const [services, setServices] = useState<ProducerService[]>([])
  const [credit, setCredit] = useState(EMPTY_CREDIT)
  const [vtuberIds, setVtuberIds] = useState<string[]>([])
  const [busy, setBusy] = useState<'producer' | 'credit' | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ text: string; href?: string } | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/producers', { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.error || 'Could not load producers.'); return }
    setProducers(data.producers ?? [])
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin fetch
    void load()
  }, [load])

  const addProducer = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy('producer'); setError(''); setNotice(null)
    const { ok, data } = await post('/api/admin/producers', {
      ...form,
      genre_tags: form.genre_tags.split(','),
      services,
    })
    setBusy(null)
    if (!ok) { setError(String(data.error || 'Could not add that producer.')); return }
    const id = String(data.id)
    setNotice({ text: `Added ${form.name.trim()}${data.avatar ? '' : ' (no Twitch/YouTube picture found, so the placeholder shows)'}.`, href: `/producer/${id}` })
    setForm(EMPTY_PRODUCER); setServices([])
    setCredit(c => ({ ...c, producer_id: id }))
    void load()
  }

  const addCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy('credit'); setError(''); setNotice(null)
    const { ok, data } = await post('/api/admin/producer-credits', { ...credit, vtuber_id: vtuberIds[0] ?? '' })
    setBusy(null)
    if (!ok) { setError(String(data.error || 'Could not add that credit.')); return }
    setNotice({ text: 'Credit added.', href: `/producer/${credit.producer_id}` })
    setCredit(c => ({ ...EMPTY_CREDIT, producer_id: c.producer_id }))
    setVtuberIds([])
  }

  const field = (key: keyof typeof EMPTY_PRODUCER, label: string, placeholder = 'https://') => (
    <div>
      <Label htmlFor={`producer-${key}`}>{label}</Label>
      <Input id={`producer-${key}`} value={form[key]} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {notice && (
        <p className="text-sm text-emerald-400">
          {notice.text}{' '}
          {notice.href && <Link href={notice.href} className="underline">View file</Link>}
        </p>
      )}

      <VaultFrame className="p-5">
        <h2 className="text-sm font-semibold text-vault-cream mb-1">Add producer</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Goes live on {PRODUCERS.section} right away. No prices, commission status or rights; the commission link covers those.
          Picture comes only from their own YouTube or Twitch link.
        </p>
        <form onSubmit={addProducer} className="space-y-4">
          {field('name', 'Name', 'Producer name')}
          <div>
            <Label htmlFor="producer-bio">Bio</Label>
            <Textarea id="producer-bio" rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          </div>
          {field('genre_tags', 'Sound (genre/mood tags, comma separated)', 'lo-fi, cozy, j-pop')}
          <fieldset>
            <legend className="text-sm font-medium text-vault-cream mb-2">Services</legend>
            <div className="flex flex-wrap gap-3">
              {PRODUCER_SERVICES.map(s => (
                <label key={s} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <input type="checkbox" checked={services.includes(s)}
                    onChange={e => setServices(prev => e.target.checked ? [...prev, s] : prev.filter(x => x !== s))} />
                  {PRODUCERS.services[s]}
                </label>
              ))}
            </div>
          </fieldset>
          {field('commission_url', 'Commission page (VGen, Skeb, Coconala…)')}
          {field('portfolio_url', 'Portfolio (YouTube playlist, SoundCloud…)')}
          {PRODUCER_LINK_KEYS.map(k => <div key={k}>{field(k, PRODUCERS.links[k])}</div>)}
          <Button type="submit" disabled={busy === 'producer'} className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
            {busy === 'producer' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding…</> : 'Add producer'}
          </Button>
        </form>
      </VaultFrame>

      <VaultFrame className="p-5">
        <h2 className="text-sm font-semibold text-vault-cream mb-1">Add credit</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Only songs whose public release already names the producer. Paste that release as the source.
        </p>
        {producers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a producer first.</p>
        ) : (
          <form onSubmit={addCredit} className="space-y-4">
            <div>
              <Label htmlFor="credit-producer">Producer</Label>
              <select id="credit-producer" value={credit.producer_id} required
                onChange={e => setCredit(c => ({ ...c, producer_id: e.target.value }))}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                <option value="">Pick a producer</option>
                {producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <MemberPicker label="VTuber" selectedIds={vtuberIds} onChange={ids => setVtuberIds(ids.slice(-1))} />
            <div>
              <Label htmlFor="credit-title">Song title</Label>
              <Input id="credit-title" value={credit.song_title} required onChange={e => setCredit(c => ({ ...c, song_title: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="credit-url">Source (public release that names the producer)</Label>
              <Input id="credit-url" value={credit.song_url} required placeholder="https://"
                onChange={e => setCredit(c => ({ ...c, song_url: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="credit-role">Role</Label>
              <select id="credit-role" value={credit.role} required
                onChange={e => setCredit(c => ({ ...c, role: e.target.value as ProducerRole }))}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                <option value="">Pick a role</option>
                {PRODUCER_ROLES.map(r => <option key={r} value={r}>{PRODUCERS.roles[r]}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={busy === 'credit' || vtuberIds.length === 0} className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
              {busy === 'credit' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding…</> : 'Add credit'}
            </Button>
          </form>
        )}
      </VaultFrame>
    </div>
  )
}
