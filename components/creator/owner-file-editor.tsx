'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { VaultFrame } from '@/components/vault/vault-frame'
import { OWNER_EDIT_LIMITS } from '@/lib/owner-edit-limits'

/**
 * Creator Dashboard: the approved owner edits their file's bio and picture. Pictures go through
 * the same /api/vtubers/avatar upload (type/size checks) as the Add VTuber form. Hidden for
 * anyone the server says can't edit.
 */
export function OwnerFileEditor({ vtuberId }: { vtuberId: string }) {
  const [state, setState] = useState<'loading' | 'hidden' | 'ready'>('loading')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
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
        setBio(d.bio ?? ''); setAvatar(d.avatar_url ?? null); setState('ready')
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
    const res = await fetch('/api/vtubers/owner-edit', {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vtuberId, bio, ...(avatar_url ? { avatar_url } : {}) }),
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
          {(preview || avatar) && <img src={preview || avatar || ''} alt="Your current picture" className="h-16 w-16 rounded-full object-cover border border-border" />}
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
        <p className="text-[10px] text-muted-foreground">Your name, channel link and tags stay as verified. Ask an admin to change those.</p>
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-xs ${msg.ok ? 'text-vault-gold' : 'text-destructive'}`}>{msg.text}</p>}
        <Button type="submit" variant="vault" size="sm" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </form>
    </VaultFrame>
  )
}
