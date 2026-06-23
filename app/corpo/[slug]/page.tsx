'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { VaultDivider } from '@/components/vault/vault-surfaces'

interface CorpoGroup {
  name: string
  bio: string
  banner_url: string | null
  member_vtuber_ids: string[]
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
  const [group, setGroup] = useState<CorpoGroup | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/corpo?slug=${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setGroup(data.group); setMembers(data.members ?? []) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="container mx-auto px-4 py-8 text-muted-foreground animate-pulse">Loading collective…</div>
  if (!group) return <div className="container mx-auto px-4 py-8 text-muted-foreground">Collective not found.</div>

  return (
    <div className="min-h-screen">
      {group.banner_url && (
        <div className="h-40 bg-cover bg-center border-b border-border" style={{ backgroundImage: `url(${group.banner_url})` }} />
      )}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-2">
          {group.name}
        </GlitchHeading>
        <p className="text-sm text-muted-foreground mb-2">Collective dossier · cross-promo hub</p>
        <VaultDivider className="mb-6" />
        {group.bio && <p className="text-sm text-muted-foreground mb-8">{group.bio}</p>}

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
              </Link>
            </VaultFrame>
          ))}
        </div>
      </div>
    </div>
  )
}