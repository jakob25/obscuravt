'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Trophy, Edit, ArrowRight } from 'lucide-react'

import type { VTuber } from '@/lib/types'

export default function MyProfilePage() {
  const { user, username, loading: authLoading } = useAuth()
  const router = useRouter()

  const [claimedVtubers, setClaimedVtubers] = useState<VTuber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!username) return

    const fetchMyProfiles = async () => {
      try {
        const res = await fetch(`/api/vtubers?claimed_by=${username}`)
        if (!res.ok) throw new Error('Failed to load your profiles')

        const data = await res.json()
        setClaimedVtubers(data)
      } catch (err) {
        setError('Failed to load your claimed profiles')
      } finally {
        setLoading(false)
      }
    }

    fetchMyProfiles()
  }, [user, username, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-vault-gold mx-auto mb-4 rounded-full"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-2xl bg-vault-navy flex items-center justify-center">
          <User className="h-8 w-8 text-vault-gold" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">My Profile</h1>
          <p className="text-white/60">@{username}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="vault-card p-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-vault-gold" />
            <div>
              <div className="text-2xl font-bold">{claimedVtubers.length}</div>
              <div className="text-sm text-white/60">Claimed Profiles</div>
            </div>
          </div>
        </div>

        <div className="vault-card p-6">
          <div className="text-sm text-white/60 mb-1">Coins</div>
          <div className="text-3xl font-bold text-vault-gold">{user?.coins ?? 0}</div>
        </div>

        <div className="vault-card p-6 flex items-center justify-center">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-vault-cyan hover:underline"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Claimed Profiles */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-vault-gold" />
          Your Claimed Profiles
        </h2>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {claimedVtubers.length === 0 ? (
          <div className="vault-card p-8 text-center">
            <p className="text-white/60 mb-4">You haven't claimed any profiles yet.</p>
            <Link 
              href="/discover" 
              className="inline-flex items-center gap-2 text-vault-cyan hover:underline"
            >
              Browse VTubers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claimedVtubers.map((vtuber) => (
              <Link 
                key={vtuber.id} 
                href={`/vtuber/${vtuber.id}`}
                className="vault-card p-5 hover:border-vault-gold/30 transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg group-hover:text-vault-gold transition-colors">
                      {vtuber.name}
                    </div>
                    {vtuber.handle && (
                      <div className="text-sm text-white/60">{vtuber.handle}</div>
                    )}
                  </div>
                  <Edit className="h-4 w-4 text-white/40 group-hover:text-vault-cyan" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
