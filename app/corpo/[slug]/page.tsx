'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Pencil, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { VaultDivider } from '@/components/vault/vault-surfaces'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MemberPicker } from '@/components/corpo/member-picker'

interface CorpoGroup {
  name: string
  bio: string
  banner_url: string | null
  member_vtuber_ids: string[]
  created_by: string
}

interface Member {
  id: string
  name: string
  avatar_url: string | null
  bio: string
  link: string
}

export default function CorpoPage() {
  const params = useParams()
  const slug = params.slug as string
  const { user } = useAuth()
  const [group, setGroup] = useState<CorpoGroup | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editBio, setEditBio] = useState('')
  const [editMemberIds, setEditMemberIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetch(`/api/corpo?slug=${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setGroup(data.group)
          setMembers(data.members ?? [])
          setEditBio(data.group.bio ?? '')
          setEditMemberIds(data.group.member_vtuber_ids ?? [])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [slug])

  const isOwner = user?.username === group?.created_by

  const saveEdit = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/corpo/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bio: editBio, memberVtuberIds: editMemberIds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setEditing(false)
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container mx-auto px-4 py-8 text-muted-foreground animate-pulse">Loading collective…</div>
  if (!group) return <div className="container mx-auto px-4 py-8 text-muted-foreground">Collective not found.</div>

  return (
    <div className="min-h-screen">
      {group.banner_url && (
        <div className="h-40 bg-cover bg-center border-b border-border" style={{ backgroundImage: `url(${group.banner_url})` }} />
      )}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-start justify-between gap-4 mb-2">
          <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream">
            {group.name}
          </GlitchHeading>
          {isOwner && (
            <Button size="sm" variant="outline" className="border-vault-bronze/40 shrink-0" onClick={() => setEditing(v => !v)}>
              <Pencil className="h-4 w-4 mr-1" /> {editing ? 'Cancel' : 'Edit'}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2">Collective dossier · cross-promo hub</p>
        <VaultDivider className="mb-6" />

        {editing && isOwner ? (
          <VaultFrame className="mb-8 p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-vault-cream">Bio</label>
              <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} className="mt-1" />
            </div>
            <MemberPicker selectedIds={editMemberIds} onChange={setEditMemberIds} />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button onClick={saveEdit} disabled={saving} className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save changes'}
            </Button>
          </VaultFrame>
        ) : (
          group.bio && <p className="text-sm text-muted-foreground mb-8">{group.bio}</p>
        )}

        <h2 className="text-sm font-semibold text-vault-cream mb-4">Members</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {members.map(m => (
            <VaultFrame key={m.id}>
              <Link href={`/vtuber/${m.id}`} className="block p-4 group">
                <div className="flex items-center gap-3 mb-2">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-vault-gold/20 flex items-center justify-center font-bold text-vault-gold">{m.name[0]}</div>
                  )}
                  <div>
                    <p className="font-semibold text-vault-cream group-hover:text-vault-gold">{m.name}</p>
                    {m.link && <ExternalLink className="h-3 w-3 text-muted-foreground inline" />}
                  </div>
                </div>
                {m.bio && <p className="text-xs text-muted-foreground line-clamp-2">{m.bio}</p>}
                {members.length > 1 && (
                  <p className="text-[10px] text-vault-gold/80 mt-2">
                    {group.name} recommends → explore the collective
                  </p>
                )}
              </Link>
            </VaultFrame>
          ))}
        </div>
      </div>
    </div>
  )
}