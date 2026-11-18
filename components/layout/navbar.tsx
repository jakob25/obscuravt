'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Menu, X, Compass, Film, Trophy, User,
  LogIn, TrendingUp, Shield, Search, Gamepad2, Gift,
  Bell, ShoppingBag, Calendar, Zap, Eye, MessageSquare, LayoutDashboard,
  Users, Star, HelpCircle, ChevronDown, Activity,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ProfileSwitcher } from '@/components/profile/profile-switcher'
import { NavRgbGlitch } from '@/components/vault/nav-rgb-glitch'

const navItems = [
  { href: '/pulse',          label: 'Pulse',          icon: Activity   },
  { href: '/discover',       label: 'Discover',       icon: Compass    },
  { href: '/clips',          label: 'Clips',          icon: Film       },
  { href: '/bets',           label: 'Bets',           icon: Trophy     },
  { href: '/leaderboard',    label: 'Leaderboard',    icon: TrendingUp },
]

const moreItems = [
  { href: '/resources',     label: 'Stream Resources', icon: Gamepad2  },
  { href: '/weekly',        label: 'Weekly Digest',  icon: Calendar       },
  { href: '/collab',        label: 'Collab',         icon: Users          },
  { href: '/nominator',     label: 'Nominator',      icon: Star           },
  { href: '/help',          label: 'How It Works',   icon: HelpCircle     },
  // Find My Oshi lives in dashboard widgets (lib/roles.ts find_my_oshi) — not primary nav
  { href: '/tag-validator', label: 'Tag Validator',  icon: Zap            },
  { href: '/discovery-games', label: 'Discovery Games', icon: Gamepad2    },
  { href: '/silhouette',    label: 'Who Is This?',   icon: Eye            },
  { href: '/crane',         label: 'Vault Crane',    icon: Gift           },
  { href: '/forums',        label: 'Forums',         icon: MessageSquare  },
]

// Tailwind md breakpoint — desktop nav shows, mobile menu must stay closed
const MD_BREAKPOINT = 768

export function Navbar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  // Close the mobile menu the moment the viewport crosses into desktop.
  // Prevents the stacked "two navs" state when the user resizes or rotates.
  useEffect(() => {
    const closeIfDesktop = () => {
      if (window.innerWidth >= MD_BREAKPOINT) setMobileOpen(false)
    }
    closeIfDesktop()
    window.addEventListener('resize', closeIfDesktop)
    return () => window.removeEventListener('resize', closeIfDesktop)
  }, [])

  // Let floating controls (the + button) step aside while the phone menu is open.
  useEffect(() => {
    const root = document.documentElement
    if (mobileOpen) root.dataset.mobileNavOpen = ''
    else delete root.dataset.mobileNavOpen
    return () => { delete root.dataset.mobileNavOpen }
  }, [mobileOpen])

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
    <NavRgbGlitch>
      <nav className="container mx-auto flex h-16 items-center px-4 gap-4">

        {/* Logo */}
        <Link href="/" data-nav-glitch className="flex items-center gap-2 group shrink-0">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-vault-gold to-vault-bronze">
            <span className="font-bold text-vault-deep text-lg">O</span>
            <div className="absolute inset-0 rounded-lg bg-vault-gold/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-vault-cream">
              Obscura<span className="text-gold-gradient">VT</span>
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
                data-nav-glitch
                aria-current={isActive ? 'page' : undefined}
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
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {/* Search — always visible */}
          <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-vault-cream">
            <Link href="/search" data-nav-glitch aria-label="Search"><Search className="h-5 w-5" /></Link>
          </Button>

          {!loading && user ? (
            <>
              {/* Coin balance — hide below lg so More stays on screen */}
              <Link
                href="/my-profile"
                data-nav-glitch
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:border-vault-gold/40 transition-colors"
              >
                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-vault-gold to-vault-amber" />
                <span className="text-sm font-medium text-vault-cream tabular-nums">{user.coins.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">scraps</span>
              </Link>

              {/* Notifications bell */}
              <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-vault-cream relative">
                <Link href="/notifications" data-nav-glitch aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}>
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span aria-hidden className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-vault-gold text-vault-deep text-[10px] font-bold flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
              </Button>

              {/* Profile switcher (multi-claimed VTubers) */}
              <div className="hidden lg:flex">
                <ProfileSwitcher />
              </div>

              {/* Shop */}
              <Button asChild variant="ghost" size="icon" className="hidden lg:flex text-muted-foreground hover:text-vault-cream">
                <Link href="/shop" data-nav-glitch aria-label="Shop"><ShoppingBag className="h-5 w-5" /></Link>
              </Button>

              {/* Admin */}
              {user.isAdmin && (
                <Button asChild variant="ghost" size="icon" className="hidden lg:flex text-muted-foreground hover:text-vault-gold">
                  <Link href="/admin" data-nav-glitch aria-label="Admin"><Shield className="h-5 w-5" /></Link>
                </Button>
              )}

              {/* Profile */}
              <Button asChild variant="ghost" size="icon" className="hidden lg:flex text-muted-foreground hover:text-vault-cream">
                <Link href="/my-profile" data-nav-glitch aria-label="My Profile"><User className="h-5 w-5" /></Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="hidden md:flex bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
              <Link href="/login" data-nav-glitch>
                <LogIn className="mr-1.5 h-4 w-4" /> Sign In
              </Link>
            </Button>
          )}

          {/* More dropdown for desktop */}
          <div className="hidden md:relative md:flex shrink-0">
            <details className="group">
              <summary data-nav-glitch className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50 active:bg-muted cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                More
                <ChevronDown aria-hidden className="h-4 w-4 transition-transform duration-300 ease-out group-open:rotate-180 motion-reduce:transition-none" />
              </summary>
              <div className="absolute right-0 top-full mt-1 w-48 vault-card rounded-xl border border-border shadow-xl z-50 py-1 animate-in fade-in-0 slide-in-from-top-1 duration-300 ease-out motion-reduce:animate-none">
                {moreItems.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-vault-cream hover:bg-muted/50 active:bg-muted transition-colors">
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                ))}
                {user && (
                  <Link href="/creator"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-vault-gold hover:bg-muted/50 active:bg-muted transition-colors border-t border-border mt-1">
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
            data-nav-glitch
            className="md:hidden text-muted-foreground"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {/* Stays mounted so open and close both ease (300ms) instead of snapping;
          inert keeps the collapsed links out of tab order and screen readers. */}
      <div
        id="mobile-nav-menu"
        inert={!mobileOpen}
        className={cn(
          'md:hidden grid bg-vault-deep transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
          mobileOpen ? 'grid-rows-[1fr] opacity-100 border-t border-border' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {/* Search */}
            <Link href="/search" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50 active:bg-muted">
              <Search className="h-5 w-5" /> Search
            </Link>

            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname?.startsWith(href + '/')
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-vault-gold/10 text-vault-gold' : 'text-muted-foreground hover:text-vault-cream hover:bg-muted/50 active:bg-muted'
                  )}>
                  <Icon className="h-5 w-5" /> {label}
                </Link>
              )
            })}

            <div className="border-t border-border my-2" />

            {moreItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50 active:bg-muted">
                <Icon className="h-5 w-5" /> {label}
              </Link>
            ))}

            {user && (
              <>
                <div className="border-t border-border my-2" />
                <Link href="/creator" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-gold hover:bg-muted/50 active:bg-muted">
                  <LayoutDashboard className="h-5 w-5" /> Creator Dashboard
                </Link>
                <Link href="/my-profile" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50 active:bg-muted">
                  <User className="h-5 w-5" /> My Profile
                </Link>
                <Link href="/shop" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50 active:bg-muted">
                  <ShoppingBag className="h-5 w-5" /> Shop
                </Link>
                {user.isAdmin && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-gold hover:bg-muted/50 active:bg-muted">
                    <Shield className="h-5 w-5" /> Admin
                  </Link>
                )}
              </>
            )}

            {!user && (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-vault-gold/10 text-vault-gold mt-2">
                <LogIn className="h-5 w-5" /> Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </NavRgbGlitch>
  )
}
