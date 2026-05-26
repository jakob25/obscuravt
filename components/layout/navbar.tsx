'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu, X, Compass, Film, Trophy, User, Medal, ShoppingBag, LogIn, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'


const navItems = [
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/clips', label: 'Clips', icon: Film },
  { href: '/bets', label: 'Bets', icon: Trophy },
  { href: '/leaderboard', label: 'Leaderboard', icon: TrendingUp },
  { href: '/achievements', label: 'Achievements', icon: Medal },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  

  return (
    <>
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
              <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">
                Find Your Oshi
              </span>
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
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <>
                <Link
                  href="/my-profile"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:border-vault-gold/40 transition-colors"
                >
                  <div className="h-4 w-4 rounded-full bg-gradient-to-br from-vault-gold to-vault-amber" />
                  <span className="text-sm font-medium text-vault-cream">{user.coins.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">coins</span>
                </Link>
                <Button asChild variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-vault-cream">
                  <Link href="/my-profile"><User className="h-5 w-5" /></Link>
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                asChild
                className="hidden md:flex bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold"
              >
                <Link href="/login">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}

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
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-vault-gold/10 text-vault-gold'
                        : 'text-muted-foreground hover:text-vault-cream hover:bg-muted/50'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                )
              })}
              {user ? (
                <Link
                  href="/my-profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-vault-cream hover:bg-muted/50"
                >
                  <User className="h-5 w-5" />
                  Profile ({user.coins.toLocaleString()} coins)
                </Link>
              ) : (
                <button
                  onClick={() => { setMobileOpen(false); router.push('/login') }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-vault-gold hover:bg-vault-gold/10"
                >
                  <LogIn className="h-5 w-5" />
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      
    </>
  )
}
