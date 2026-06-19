'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Trophy, Edit, ArrowRight, Users, Film } from 'lucide-react'

import type { VTuber } from '@/lib/types'

export default function DashboardPage() {
  const { user, username, loading: authLoading } = useAuth()
  const router = useRouter()

  const [claimedVtubers, setClaimedVtubers] = useState<VTuber[]>([])
  const [loading, setLoading] = useState(true)

  const accountType = user?.accountType

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!username) return

    // Only VTubers need to load claimed profiles
    if (accountType === 'vtuber') {
      const fetchClaimed = async () => {
        try {
          const res = await fetch(`/api/vtubers?claimed_by=${username}`)
          if (res.ok) {
            const data = await res.json()
            setClaimedVtubers(data)
          }
        } catch (err) {
          console.error('Failed to load claimed profiles')
        } finally {
          setLoading(false)
        }
      }
      fetchClaimed()
    } else {
      setLoading(false)
    }
  }, [user, username, authLoading, accountType, router])

  if (authLoading || loading) {
    return <div className="p-8">Loading dashboard...</div>
  }

  // ── VTUBER DASHBOARD ─────────────────────────────────────────────
  if (accountType === 'vtuber') {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-white/60">Welcome back, @{username}</p>
          </div>
          <Link 
            href="/my-profile" 
            className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5"
          >
            View Public Profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Claimed Profiles */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-vault-gold" />
            Your Claimed Profiles ({claimedVtubers.length})
          </h2>

          {claimedVtubers.length === 0 ? (
            <div className="vault-card p-8 text-center">
              <p className="text-white/60 mb-4">You haven't claimed any profiles yet.</p>
              <Link href="/discover" className="text-vault-cyan hover:underline">
                Browse and claim VTubers →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claimedVtubers.map((vt) => (
                <div key={vt.id} className="vault-card p-5">
                  <div className="font-semibold text-lg mb-1">{vt.name}</div>
                  {vt.handle && <div className="text-sm text-white/60 mb-3">{vt.handle}</div>}
                  <div className="flex gap-2">
                    <Link 
                      href={`/vtuber/${vt.id}`} 
                      className="flex-1 text-center py-2 border border-white/20 rounded-lg hover:bg-white/5 text-sm"
                    >
                      View Public
                    </Link>
                    <Link 
                      href={`/creator/edit/${vt.id}`} 
                      className="flex-1 text-center py-2 bg-vault-gold text-vault-deep rounded-lg hover:bg-[#e8bc5a] text-sm font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/discover" className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5">
              Discover VTubers
            </Link>
            <Link href="/tag-validator" className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5">
              Validate Tags
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── FAN / CLIPPER DASHBOARD (placeholder for now) ─────────────────
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
      <p className="text-white/60 mb-8">Welcome back, @{username}</p>

      <div className="vault-card p-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Activity</h2>
        <p className="text-white/60">
          This area will show recent updates from oshis you follow, your voting history, 
          and other activity. (Coming soon)
        </p>
      </div>

      {accountType === 'clipper' && (
        <div className="vault-card p-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Film className="h-5 w-5" />
            Your Clips
          </h2>
          <p className="text-white/60">
            Your clip stats and performance will appear here.
          </p>
        </div>
      )}

      <div className="mt-8">
        <Link href="/discover" className="text-vault-cyan hover:underline flex items-center gap-1">
          Explore VTubers <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
