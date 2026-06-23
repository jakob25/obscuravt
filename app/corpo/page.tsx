'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { VaultDivider } from '@/components/vault/vault-surfaces'

interface CorpoGroup {
  slug: string
  name: string
  bio: string
}

export default function CorpoIndexPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<CorpoGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', slug: '', bio: '' })

  const loadGroups = () => {
    fetch('/api/corpo')
      .then(r => r.json())
      .then(data => setGroups(data.groups ?? []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadGroups() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/corpo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          bio: form.bio.trim(),
          memberVtuberIds: [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create group')
      setForm({ name: '', slug: '', bio: '' })
      setShowForm(false)
      loadGroups()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream">
          Corpo Collectives
        </GlitchHeading>
        {user && (
          <Button
            size="sm"
            variant="outline"
            className="border-vault-bronze/40"
            onClick={() => setShowForm(v => !v)}
          >
            <Plus className="h-4 w-4 mr-1" /> {showForm ? 'Cancel' : 'Create'}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Small groups, shared spotlight. Cross-promo without the contract drama.
      </p>
      <VaultDivider className="mb-8" />

      {showForm && user && (
        <VaultFrame className="mb-8">
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div>
              <Label htmlFor="corpo-name">Collective Name</Label>
              <Input
                id="corpo-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Starlight Studios"
                required
              />
            </div>
            <div>
              <Label htmlFor="corpo-slug">URL Slug</Label>
              <Input
                id="corpo-slug"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="starlight-studios"
                required
              />
            </div>
            <div>
              <Label htmlFor="corpo-bio">Bio</Label>
              <Textarea
                id="corpo-bio"
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="What makes this collective unique?"
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={submitting} className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : 'Create Collective'}
            </Button>
          </form>
        </VaultFrame>
      )}

      {loading ? (
        <p className="text-muted-foreground animate-pulse">Loading collectives…</p>
      ) : groups.length === 0 ? (
        <VaultFrame>
          <p className="p-6 text-sm text-muted-foreground text-center">
            No collectives yet. {user ? 'Create the first one above.' : 'Sign in to create one.'}
          </p>
        </VaultFrame>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <VaultFrame key={g.slug}>
              <Link href={`/corpo/${g.slug}`} className="block p-5 group">
                <p className="font-semibold text-vault-cream group-hover:text-vault-gold transition-colors">{g.name}</p>
                {g.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{g.bio}</p>}
              </Link>
            </VaultFrame>
          ))}
        </div>
      )}
    </div>
  )
}