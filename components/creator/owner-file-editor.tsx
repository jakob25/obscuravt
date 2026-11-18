'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { VaultFrame } from '@/components/vault/vault-frame'
import { OWNER_EDIT_LIMITS } from '@/lib/owner-edit-limits'
import { safeImageSrc } from '@/lib/safe-image-src'

/**
 * Creator Dashboard: the approved owner edits their file. Pictures go through
 * the same /api/vtubers/avatar upload (type/size checks) as the Add VTuber form.
 * Hidden for anyone the server says can't edit.
 */
export function OwnerFileEditor({ vtuberId }: { vtuberId: string }) {
  const [state, setState] = useState<'loading' | 'hidden' | 'ready'>('loading')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [link, setLink] = useState('')
  const [handle, setHandle] = useState('')
  const [tags, setTags] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/vtubers/owner-edit?vtuberId=${encodeURIComponent(vtuberId)}`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled) return
        if (!d?.canEdit) { setState('hidden'); return }
        setBio(d.bio ?? '')
        setAvatar(d.avatar_url ?? null)
        setLink(d.link ?? '')
        setHandle(d.handle ?? '')
        setTags(Array.isArray(d.tags) ? d.tags.join(', ') : '')
        setState('ready')
      })
      .catch(() => { if (!cancelled) setState('hidden') })
    return () => { cancelled = true }
  }, [vtuberId])

  const pickFile = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  if (state !== 'ready') return null

  const shownSrc = safeImageSrc(preview) ?? safeImageSrc(avatar)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setMsg(null)
    let avatar_url: string | undefined
    if (file) {
      const fd = new FormData()
      fd.append('file', file)
      const up = await fetch('/api/vtubers/avatar', { method: 'POST', credentials: 'include', body: fd })
      const ud = await up.json().catch(() => ({}))
      if (!up.ok || !ud.url) { setMsg({ ok: false, text: ud.error || "Couldn't upload that picture." }); setSaving(false); return }
      avatar_url = ud.url
    }
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
    const res = await fetch('/api/vtubers/owner-edit', {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vtuberId,
        bio,
        link: link.trim() || null,
        handle: handle.trim() || null,
        tags: tagList,
        ...(avatar_url ? { avatar_url } : {}),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setMsg({ ok: false, text: data.error || "Couldn't save your edit." }); setSaving(false); return }
    if (avatar_url) { setAvatar(avatar_url); pickFile(null) }
    setMsg({ ok: true, text: 'Saved. Your file shows the new version shortly.' })
    setSaving(false)
  }

  return (
    <VaultFrame className="p-5 mb-6">
      <form onSubmit={save} className="space-y-4">
        <h2 className="text-sm font-semibold text-vault-cream">Edit your file</h2>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- user upload preview */}
          {shownSrc && <img src={shownSrc} alt="Your current picture" className="h-16 w-16 rounded-full object-cover border border-border" />}
          <div>
            <Label htmlFor="owner-avatar">Picture</Label>
            <input
              id="owner-avatar" type="file" accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={e => pickFile(e.target.files?.[0] ?? null)}
              className="block text-xs text-muted-foreground mt-1"
            />
            <p className="text-[10px] text-muted-foreground mt-1">JPEG, PNG, GIF or WebP, up to 5MB.</p>
          </div>
        </div>
        <div>
          <Label htmlFor="owner-bio">Bio</Label>
          <Textarea id="owner-bio" value={bio} maxLength={OWNER_EDIT_LIMITS.bio} rows={4} onChange={e => setBio(e.target.value)} />
          <p className="text-[10px] text-muted-foreground mt-1">{bio.length}/{OWNER_EDIT_LIMITS.bio}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="owner-handle">Handle</Label>
            <Input id="owner-handle" value={handle} maxLength={OWNER_EDIT_LIMITS.handle} onChange={e => setHandle(e.target.value)} placeholder="@username" />
          </div>
          <div>
            <Label htmlFor="owner-link">Channel link</Label>
            <Input id="owner-link" type="url" value={link} maxLength={OWNER_EDIT_LIMITS.link} onChange={e => setLink(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <div>
          <Label htmlFor="owner-tags">Tags</Label>
          <Input id="owner-tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="chill, horror, art…" />
          <p className="text-[10px] text-muted-foreground mt-1">Comma-separated. Up to {OWNER_EDIT_LIMITS.tags} tags.</p>
        </div>
        <p className="text-[10px] text-muted-foreground">Your name stays as verified. Ask an admin to change that.</p>
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-xs ${msg.ok ? 'text-vault-gold' : 'text-destructive'}`}>{msg.text}</p>}
        <Button type="submit" variant="vault" size="sm" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </form>
    </VaultFrame>
  )
}
