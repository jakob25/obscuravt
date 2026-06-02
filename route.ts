'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Check, X, ExternalLink, RefreshCw, ShieldAlert, Loader2, Tag, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Admin check is done server-side via requireAdmin() in the API route.
// Client-side we just check if the /api/admin/pending endpoint returns 403.

interface PendingVTuber {
  id: string
  name: string
  handle: string
  platform: string
  link: string
  bio: string
  tags: string[]
  nominated_by: string
  created_at?: string
}

interface CanonicalTag {
  id: string
  tag: string
  category: string
  color: string | null
  position_x: number | null
  position_y: number | null
  description: string | null
  content_tag_ids: string[] | null
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [pending, setPending] = useState<PendingVTuber[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)
  const [activeTab, setActiveTab] = useState<'vtubers' | 'tags'>('vtubers')
  const [tags, setTags] = useState<CanonicalTag[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [tagFilter, setTagFilter] = useState('all')
  const [newTag, setNewTag] = useState({ id: '', tag: '', category: 'vibe', color: '', description: '' })
  const [addingTag, setAddingTag] = useState(false)

  // isAdmin determined by API response — not a client-side check
  // The actual enforcement is in requireAdmin() on the server
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  const fetchTags = useCallback(async () => {
    setTagsLoading(true)
    const res = await fetch('/api/tags', { credentials: 'include' })
    if (res.ok) setTags(await res.json())
    setTagsLoading(false)
  }, [])

  const addTag = async () => {
    if (!newTag.id || !newTag.tag) return
    setAddingTag(true)
    const res = await fetch('/api/tags', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTag),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage({ text: `Tag "${newTag.id}" created!`, type: 'ok' })
      setNewTag({ id: '', tag: '', category: 'vibe', color: '', description: '' })
      fetchTags()
    } else {
      setMessage({ text: data.error, type: 'err' })
    }
    setAddingTag(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const deleteTag = async (id: string) => {
    if (!confirm(`Delete tag "${id}"? This cannot be undone.`)) return
    const res = await fetch('/api/tags', {
      method: 'DELETE', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (res.ok) { setTags(prev => prev.filter(t => t.id !== id)) }
    else setMessage({ text: data.error, type: 'err' })
    setTimeout(() => setMessage(null), 3000)
  }

  const fetchPending = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/pending')
    if (res.ok) {
      const data = await res.json()
      setPending(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/'); return }
    // Probe the admin endpoint — if 403, not an admin
    fetch('/api/admin/pending', { credentials: 'include' })
      .then(r => {
        if (r.status === 403) { setIsAdmin(false); router.push('/') }
        else { setIsAdmin(true); return r.json() }
      })
      .then(data => { if (data) { setPending(data); setLoading(false) } })
      .catch(() => setLoading(false))
    fetchTags()
  }, [authLoading, user, router, fetchTags])

  const approve = async (id: string) => {
    setActionLoading(id)
    const res = await fetch('/api/admin/pending', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'approve', username: user?.username }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage({ text: 'Approved! VTuber is now live on the Star Map.', type: 'ok' })
      setPending(prev => prev.filter(v => v.id !== id))
    } else {
      setMessage({ text: data.error, type: 'err' })
    }
    setActionLoading(null)
    setTimeout(() => setMessage(null), 3000)
  }

  const reject = async (id: string) => {
    setActionLoading(id)
    const res = await fetch('/api/admin/pending', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'reject', username: user?.username }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage({ text: 'Rejected and removed.', type: 'ok' })
      setPending(prev => prev.filter(v => v.id !== id))
    } else {
      setMessage({ text: data.error, type: 'err' })
    }
    setActionLoading(null)
    setTimeout(() => setMessage(null), 3000)
  }

  if (authLoading || isAdmin === null) return null

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <ShieldAlert className="h-12 w-12 text-muted-foreground" />
          <p className="text-vault-cream font-semibold">Access Denied</p>
          <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-vault-cream">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and approve VTuber submissions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPending}
          className="border-border text-vault-cream"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/30 border border-border rounded-xl mb-6 w-fit">
        {([['vtubers', 'VTuber Queue'], ['tags', 'Tag Manager']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30' : 'text-muted-foreground hover:text-vault-cream'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Status message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg border text-sm ${
          message.type === 'ok'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          {message.text}
        </div>
      )}

      {activeTab === 'vtubers' && (<>
      {/* Stats bar */}
      <div className="vault-card rounded-xl p-4 mb-6 flex items-center gap-6">
        <div>
          <p className="text-xs text-muted-foreground">Pending Review</p>
          <p className="text-2xl font-bold text-vault-gold">{loading ? '…' : pending.length}</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium text-vault-cream">{user?.username}</p>
        </div>
      </div>

      {/* Pending list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="vault-card rounded-xl p-5 h-36 animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="vault-card rounded-xl p-12 text-center">
          <Check className="h-10 w-10 text-green-400 mx-auto mb-3" />
          <p className="text-vault-cream font-semibold">All clear!</p>
          <p className="text-sm text-muted-foreground mt-1">No pending VTuber submissions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map(vtuber => (
            <div key={vtuber.id} className="vault-card rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Name + handle */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-vault-cream">{vtuber.name}</h3>
                    {vtuber.handle && (
                      <span className="text-sm text-vault-bronze">{vtuber.handle}</span>
                    )}
                    {vtuber.platform && (
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        {vtuber.platform}
                      </Badge>
                    )}
                  </div>

                  {/* Bio */}
                  {vtuber.bio && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{vtuber.bio}</p>
                  )}

                  {/* Tags */}
                  {vtuber.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {vtuber.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-muted/50 border border-border text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Submitted by <span className="text-vault-cream">{vtuber.nominated_by}</span></span>
                    {vtuber.link && (
                      <a
                        href={vtuber.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-vault-gold hover:text-vault-amber transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit channel
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => approve(vtuber.id)}
                    disabled={actionLoading === vtuber.id}
                    className="bg-green-600 hover:bg-green-500 text-white"
                  >
                    {actionLoading === vtuber.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><Check className="h-4 w-4 mr-1" /> Approve</>
                    }
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reject(vtuber.id)}
                    disabled={actionLoading === vtuber.id}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>)}

      {/* Tag Manager tab */}
      {activeTab === 'tags' && (
        <div className="space-y-6">
          {/* Add new tag */}
          <div className="vault-card rounded-xl p-5">
            <h2 className="font-bold text-vault-cream mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-vault-gold" /> Add New Tag
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ID (e.g. vibe_new_tag)</label>
                <input value={newTag.id} onChange={e => setNewTag(p => ({...p, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')}))}
                  placeholder="vibe_example"
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-vault-cream text-sm outline-none focus:border-vault-gold" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
                <input value={newTag.tag} onChange={e => setNewTag(p => ({...p, tag: e.target.value}))}
                  placeholder="Example Tag"
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-vault-cream text-sm outline-none focus:border-vault-gold" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select value={newTag.category} onChange={e => setNewTag(p => ({...p, category: e.target.value}))}
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-vault-cream text-sm">
                  {['vibe','content','cluster','niche_cluster'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Color (hex)</label>
                <input value={newTag.color} onChange={e => setNewTag(p => ({...p, color: e.target.value}))}
                  placeholder="#d4a574"
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-vault-cream text-sm outline-none focus:border-vault-gold" />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <input value={newTag.description} onChange={e => setNewTag(p => ({...p, description: e.target.value}))}
                placeholder="What this tag means..."
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-vault-cream text-sm outline-none focus:border-vault-gold" />
            </div>
            <Button onClick={addTag} disabled={!newTag.id || !newTag.tag || addingTag}
              className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
              {addingTag ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Tag
            </Button>
          </div>

          {/* Tag list */}
          <div className="vault-card rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
              <h2 className="font-bold text-vault-cream flex items-center gap-2">
                <Tag className="h-4 w-4 text-vault-gold" /> All Tags ({tags.length})
              </h2>
              <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
                className="px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-vault-cream text-xs">
                <option value="all">All categories</option>
                {['vibe','content','cluster','niche_cluster'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {tagsLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading tags…</div>
            ) : (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {tags.filter(t => tagFilter === 'all' || t.category === tagFilter).map(tag => (
                  <div key={tag.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/10">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {tag.color && <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: tag.color }} />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-vault-cream">{tag.tag}</span>
                          <span className="text-xs text-muted-foreground font-mono">{tag.id}</span>
                        </div>
                        <span className="text-xs text-vault-bronze">{tag.category}</span>
                        {tag.description && <p className="text-xs text-muted-foreground truncate">{tag.description}</p>}
                      </div>
                    </div>
                    <button onClick={() => deleteTag(tag.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 ml-3 p-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
