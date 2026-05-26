'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu, X, Compass, Film, Trophy, User } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/clips', label: 'Clips', icon: Film },
  { href: '/bets', label: 'VTuberBets', icon: Trophy },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
            <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">
              Find Your Oshi
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-vault-gold/10 text-vault-gold' 
                    : 'text-muted-foreground hover:text-vault-cream hover:bg-muted/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Right side - Scraps counter & profile */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-vault-gold to-vault-amber" />
            <span className="text-sm font-medium text-vault-cream">1,250</span>
            <span className="text-xs text-muted-foreground">Scraps</span>
          </div>
          
          <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-vault-cream">
            <User className="h-5 w-5" />
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-vault-deep">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive 
                      ? 'bg-vault-gold/10 text-vault-gold' 
                      : 'text-muted-foreground hover:text-vault-cream hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
            
            {/* Mobile scraps display */}
            <div className="flex items-center gap-2 px-4 py-3 mt-2 rounded-lg bg-muted/30 border border-border">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-vault-gold to-vault-amber" />
              <span className="text-sm font-medium text-vault-cream">1,250</span>
              <span className="text-xs text-muted-foreground">Scraps</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
