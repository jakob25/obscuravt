'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { user, username, logout } = useAuth()

  return (
    <nav className="border-b border-white/10 bg-[#0a0a14]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a14]/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl tracking-tight">
            ObscuraVT
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/discover" className="hover:text-vault-gold transition-colors">
              Discover
            </Link>
            <Link href="/clips" className="hover:text-vault-gold transition-colors">
              Clips
            </Link>
            <Link href="/bets" className="hover:text-vault-gold transition-colors">
              Bets
            </Link>
            <Link href="/find-my-oshi" className="hover:text-vault-gold transition-colors">
              Find My Oshi
            </Link>
            <Link href="/leaderboard" className="hover:text-vault-gold transition-colors">
              Leaderboard
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/70">@{username}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign out
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
