'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MemberPicker } from '@/components/corpo/member-picker'
import type { WorldInput } from '@/lib/worlds/schema'

const empty = (): WorldInput => ({slug: '', name: '', bio: '', member_vtuber_ids: [], world_details: {sources: [], membership_sources: {}, cast: []}})
const lines = (text: string) => text.split('\n').map(s => s.trim()).filter(Boolean)
const field = 'w-full rounded border border-border bg-vault-deep p-2 text-vault-cream'
export default function ManageWorlds() {
  const [worlds, setWorlds] = useState<WorldInput[]>([])
  const [world, setWorld] = useState<WorldInput>(empty)
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState('Checking admin access…')
  const [allowed, setAllowed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  async function load() {
    try {
      const res = await fetch('/api/admin/worlds', {cache: 'no-store'})
      const data = await res.json()
      if (!res.ok) { setAllowed(false); setStatus(data.error || 'Could not load worlds.'); return }
      setAllowed(true); setWorlds(data.worlds); setStatus('')
    } catch { setStatus('Could not reach world management. Please reload to try again.') }
  }
  useEffect(() => { void load() }, [])
  function change(patch: Partial<WorldInput>) { setWorld(w => ({...w, ...patch})); setConfirmed(false) }
  function details(patch: Partial<WorldInput['world_details']>) { change({world_details: {...world.world_details, ...patch}}) }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!confirmed || busy) return
    setBusy(true); setStatus('Saving…')
    try {
      const res = await fetch('/api/admin/worlds', {method: editing ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(world)})
      const data = await res.json()
      if (!res.ok) { setStatus(data.error || 'Could not save.'); return }
      await load(); setEditing(true); setStatus('World saved.'); setConfirmed(false)
    } catch { setStatus('Save could not be confirmed. Reload the world list before retrying.') }
    finally { setBusy(false) }
  }
  async function removeWorld() {
    if (busy || !editing || !window.confirm(`Remove ${world.name} and its world links? Dossiers and clips will remain.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/worlds?slug=${encodeURIComponent(world.slug)}`, {method: 'DELETE'})
      const data = await res.json()
      if (!res.ok) {setStatus(data.error || 'Could not remove world.'); return}
      setWorld(empty()); setEditing(false); setConfirmed(false); await load(); setStatus('World removed. Dossiers and clips are unchanged.')
    } catch { setStatus('Removal could not be confirmed. Reload before retrying.') }
    finally { setBusy(false) }
  }
  return <main className="max-w-3xl mx-auto p-4 space-y-6 text-vault-cream">
    <h1 className="text-2xl">Manage fictional worlds</h1>
    <p>Curate public lore and connections. Claims and separate accounts are not required. Saving publishes the information; check every source first.</p>
    <p role="status" aria-live="polite">{status}</p>
    {allowed && <>
      <label className="block">Edit a world<select disabled={busy} className={field} value={editing ? world.slug : ''} onChange={e => { const selected = worlds.find(w => w.slug === e.target.value); setWorld(selected || empty()); setEditing(!!selected); setConfirmed(false); setStatus('') }}><option value="">Create a new world</option>{worlds.map(w => <option key={w.slug} value={w.slug}>{w.name}</option>)}</select></label>
      <form onSubmit={save}><fieldset disabled={busy} className="space-y-5">
        <label className="block">World name<input required maxLength={160} className={field} value={world.name} onChange={e => change({name: e.target.value})} /></label>
        <label className="block">URL name (cannot change after creation)<input required disabled={editing} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} className={field} value={world.slug} onChange={e => change({slug: e.target.value})} /></label>
        <label className="block">Lore<textarea maxLength={10000} rows={5} className={field} value={world.bio} onChange={e => change({bio: e.target.value})} /></label>
        <label className="block">Public sources for the world (one HTTPS link per line)<textarea required rows={3} className={field} value={world.world_details.sources.join('\n')} onChange={e => details({sources: e.target.value.split('\n')})} onBlur={e => details({sources: lines(e.target.value)})} /></label>
        <MemberPicker label="Linked dossiers (selection order is display order)" selectedIds={world.member_vtuber_ids} onChange={ids => change({member_vtuber_ids: ids, world_details: {...world.world_details, membership_sources: Object.fromEntries(ids.map(id => [id, world.world_details.membership_sources[id] || []]))}})} />
        {world.member_vtuber_ids.map(id => <label key={id} className="block">Public source confirming membership for dossier {id}<textarea required className={field} value={(world.world_details.membership_sources[id] || []).join('\n')} onChange={e => details({membership_sources: {...world.world_details.membership_sources, [id]: e.target.value.split('\n')}})} onBlur={e => details({membership_sources: {...world.world_details.membership_sources, [id]: lines(e.target.value)}})} /></label>)}
        <section className="space-y-4"><h2 className="text-xl">Cast descriptions</h2><p>Optional. Add characters here without creating extra dossiers or accounts. Use public sources; do not infer who operates an account.</p>
          {world.world_details.cast.map((c, i) => { const update = (patch: Partial<typeof c>) => details({cast: world.world_details.cast.map((row, index) => index === i ? {...row, ...patch} : row)}); return <fieldset key={i} className="border border-border rounded p-3 space-y-3"><legend>Character {i + 1}</legend>
            <label className="block">Name<input required maxLength={160} className={field} value={c.name} onChange={e => update({name: e.target.value})} /></label>
            <label className="block">Description<textarea maxLength={3000} className={field} value={c.description} onChange={e => update({description: e.target.value})} /></label>
            <label className="block">Public sources (one HTTPS link per line)<textarea required className={field} value={c.sources.join('\n')} onChange={e => update({sources: e.target.value.split('\n')})} onBlur={e => update({sources: lines(e.target.value)})} /></label>
            <button type="button" className="underline" onClick={() => details({cast: world.world_details.cast.filter((_, index) => index !== i)})}>Remove character {i + 1}</button>
          </fieldset> })}
          <button type="button" className="underline" onClick={() => details({cast: [...world.world_details.cast, {name: '', description: '', sources: []}]})}>Add a character</button>
        </section>
        <label className="flex gap-2"><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I checked that the public sources support this lore and every membership. No private identities are inferred.</label>
        <button disabled={busy || !confirmed} className="rounded border border-border p-3 disabled:opacity-50">{busy ? 'Saving…' : 'Save and publish world'}</button>
        {editing && <button type="button" className="block underline text-red-400" onClick={() => void removeWorld()}>Remove this world (keep dossiers and clips)</button>}
        {editing && <Link className="block underline text-vault-gold" href={`/worlds/${world.slug}`}>View world</Link>}
      </fieldset></form>
    </>}
  </main>
}
