'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Menu, X, Compass, Film, Trophy, User, Medal,
  LogIn, TrendingUp, Shield, Search, Heart,
  Bell, ShoppingBag, Calendar, Zap, Eye, MessageSquare, LayoutDashboard
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

const ADMINS = ['jakob25', 'admin']

const navItems = [
  { href: '/discover',       label: 'Discover',      icon: Compass    },
  { href: '/clips',          label: 'Clips',          icon: Film       },
  { href: '/bets',           label: 'Bets',           icon: Trophy     },
  { href: '/find-my-oshi',   label: 'Find My Oshi',   icon: Heart      },
  { href: '/leaderboard',    label: 'Leaderboard',    icon: TrendingUp },
]

const moreItems = [
  { href: '/weekly',        label: 'Weekly Digest',  icon: Calendar       },
  { href: '/tag-validator', label: 'Tag Validator',  icon: Zap            },
  { href: '/silhouette',    label: 'Who Is This?',   icon: Eye            },
  { href: '/forums',        label: 'Forums',         icon: MessageSquare  },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  // Poll unread notifications every 60s when logged in
  useEffect(() => {
    if (!user) { setUnread(0); return }
    const fetchUnread = () =>
      fetch(`/api/notifications?username=${user.username}`)
        .then(r => r.json())
        .then((data: { is_read: boolean }[]) => setUnread(data.filter(n => !n.is_read).length))
        .catch(() => {})
    fetchUnread()
    const id = setInterval(fetchUnread, 60000)
    return () => clearInterval(id)
  }, [user])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-vault-deep/95 backdrop-blur supports-[backdrop-filter]:bg-vault-deep/80">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-vault-gold to-vault-bronze">
            <span className="font-bold text-vault-deep text-lg">V</span>
            <div className="absolute inset-0 rounded-lg bg-vault-gold/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-vault-cream">
              VT<span className="text-gold-gradient">Vault</span>
            </span>
            <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">Find Your Oshi</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname?.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-vault-gold/10 text-vault-gold'
                    : 'text-muted-foreground hover:text-vault-cream hover:bg-muted/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search — always visible */}
          <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-vault-cream">
            <Link href="/search"><Search className="h-5 w-5" /></Link>
          </Button>

          {!loading && user ? (
            <>
              {/* Coin balance */}
              <Link
                href="/my-profile"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:border-vault-gold/40 transition-colors"
              >
                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-vault-gold to-vault-amber" />
                <span className="text-sm font-medium text-vault-cream tabular-nums">{user.coins.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">scraps</span>
              </Link>

              {/* Notifications bell */}
              <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-vault-cream relative">
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-vault-gold text-vault-deep text-[10px] font-bold flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
              </Button>

              {/* Shop */}
              <Button asChild variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-vault-cream">
                <Link href="/shop"><ShoppingBag className="h-5 w-5" /></Link>
              </Button>

              {/* Admin */}
              {ADMINS.includes(user.username) && (
                <Button asChild variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-vault-gold">
                  <Link href="/admin"><Shield className="h-5 w-5" /></Link>
                </Button>
              )}

              {/* Profile */}
              <Button asChild variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-vault-cream">
                <Link href="/my-profile"><User className="h-5 w-5" /></Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="hidden md:flex bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
              <Link href="/login">
                <LogIn className="mr-1.5 h-4 w-4" /> Sign In
              </Link>
            </Button>
          )}

          {/* More dropdown for desktop */}
          <div className="hidden md:relative md:flex">
            <details className="group">
              <summary className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50 cursor-pointer list-none">
                More ▾
              </summary>
              <div className="absolute right-0 top-full mt-1 w-48 vault-card rounded-xl border border-border shadow-xl z-50 py-1">
                {moreItems.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-vault-cream hover:bg-muted/50 transition-colors">
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                ))}
                {user && (
                  <Link href="/creator"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-vault-gold hover:bg-muted/50 transition-colors border-t border-border mt-1">
                    <LayoutDashboard className="h-4 w-4" /> Creator Dashboard
                  </Link>
                )}
              </div>
            </details>
          </div>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-vault-deep">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {/* Search */}
            <Link href="/search" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50">
              <Search className="h-5 w-5" /> Search
            </Link>

            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-vault-gold/10 text-vault-gold' : 'text-muted-foreground hover:text-vault-cream hover:bg-muted/50'
                  )}>
                  <Icon className="h-5 w-5" /> {label}
                </Link>
              )
            })}

            <div className="my-1 border-t border-border" />

            {user ? (
              <>
                <Link href="/notifications" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50">
                  <Bell className="h-5 w-5" />
                  Notifications
                  {unread > 0 && <span className="ml-auto bg-vault-gold text-vault-deep text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
                </Link>
                <Link href="/shop" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50">
                  <ShoppingBag className="h-5 w-5" /> Shop
                </Link>
                {moreItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50">
                  <Icon className="h-5 w-5" /> {label}
                </Link>
              ))}
              {user && (
                <Link href="/creator" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-gold hover:bg-muted/50">
                  <LayoutDashboard className="h-5 w-5" /> Creator Dashboard
                </Link>
              )}
              <Link href="/achievements" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50">
                  <Medal className="h-5 w-5" /> Achievements
                </Link>
                <Link href="/my-profile" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50">
                  <User className="h-5 w-5" /> Profile ({user.coins.toLocaleString()} coins)
                </Link>
                {ADMINS.includes(user.username) && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-gold hover:bg-muted/50">
                    <Shield className="h-5 w-5" /> Admin
                  </Link>
                )}
              </>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); router.push('/login') }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-vault-gold hover:bg-vault-gold/10"
              >
                <LogIn className="h-5 w-5" /> Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
