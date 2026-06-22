'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ShoppingBag, Check, Loader2, AlertCircle, Coins, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ShopItem {
  id: string
  name: string
  type: string
  description: string
  cost: number
  value: string
}

interface OwnedItem {
  item_id: string
  equipped: boolean
}

const TYPE_LABELS: Record<string, string> = {
  title: 'Title',
  badge: 'Badge',
  frame: 'Frame',
}

export default function ShopPage() {
  const { user, refreshUser } = useAuth()
  const [items, setItems] = useState<ShopItem[]>([])
  const [owned, setOwned] = useState<OwnedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean; id: string } | null>(null)

  const fetchShop = async () => {
    const url = user ? `/api/shop?username=${user.username}` : '/api/shop'
    const res = await fetch(url)
    const data = await res.json()
    if (data.items) { setItems(data.items); setOwned(data.owned) }
    else setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchShop() }, [user])

  const ownedIds = new Set(owned.map(o => o.item_id))

  const buy = async (item: ShopItem) => {
    if (!user) return
    setBuying(item.id)
    const res = await fetch('/api/shop/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, item_id: item.id }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage({ text: `"${item.name}" purchased!`, ok: true, id: item.id })
      setOwned(prev => [...prev, { item_id: item.id, equipped: false }])
      await refreshUser()
    } else {
      setMessage({ text: data.error, ok: false, id: item.id })
    }
    setBuying(null)
    setTimeout(() => setMessage(null), 3000)
  }

  // Group items by type
  const grouped = items.reduce<Record<string, ShopItem[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {})

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-vault-gold" />
          <h1 className="text-2xl font-bold text-vault-cream">Shop</h1>
        </div>
        {user && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vault-gold/10 border border-vault-gold/30">
            <Coins className="h-4 w-4 text-vault-gold" />
            <span className="text-vault-gold font-bold tabular-nums">{user.coins.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Vault Scraps</span>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-8">
        Spend your Vault Scraps on titles and cosmetics. Earn more by winning bets.
      </p>

      {!user && (
        <div className="vault-card rounded-xl p-6 text-center mb-6">
          <p className="text-muted-foreground mb-3">Sign in to buy items</p>
          <Button asChild className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i}>
              <div className="h-5 w-24 bg-muted/30 rounded mb-3 animate-pulse" />
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2, 3].map(j => <div key={j} className="vault-card rounded-xl p-5 h-28 animate-pulse bg-muted/20" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([type, typeItems]) => (
            <section key={type}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {TYPE_LABELS[type] ?? type}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {typeItems.map(item => {
                  const isOwned = ownedIds.has(item.id)
                  const isBuying = buying === item.id
                  const canAfford = user ? user.coins >= item.cost : false
                  const msg = message?.id === item.id ? message : null

                  return (
                    <div
                      key={item.id}
                      className={`vault-card rounded-xl p-5 flex flex-col gap-3 transition-all ${
                        isOwned ? 'border-vault-gold/30 bg-vault-gold/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-vault-cream">{item.name}</h3>
                            {isOwned && <Check className="h-3.5 w-3.5 text-vault-gold flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-vault-gold">{item.cost.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">scraps</p>
                        </div>
                      </div>

                      {/* Preview */}
                      {item.type === 'title' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 border border-border w-fit">
                          <Tag className="h-3 w-3 text-vault-gold" />
                          <span className="text-xs text-vault-cream font-medium">{item.value}</span>
                        </div>
                      )}

                      {/* Message */}
                      {msg && (
                        <div className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg ${
                          msg.ok
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                            : 'bg-destructive/10 border border-destructive/20 text-destructive'
                        }`}>
                          {msg.ok ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          {msg.text}
                        </div>
                      )}

                      {/* Buy button */}
                      {user && (
                        isOwned ? (
                          <div className="flex items-center gap-1.5 text-xs text-vault-gold font-medium">
                            <Check className="h-3.5 w-3.5" /> Owned
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => buy(item)}
                            disabled={isBuying || !canAfford}
                            className={`w-full text-xs font-semibold ${
                              canAfford
                                ? 'bg-vault-gold hover:bg-vault-amber text-vault-deep'
                                : 'bg-muted/30 text-muted-foreground cursor-not-allowed border border-border'
                            }`}
                          >
                            {isBuying
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : canAfford
                                ? `Buy — ${item.cost.toLocaleString()} coins`
                                : `Need ${(item.cost - (user?.coins ?? 0)).toLocaleString()} more coins`
                            }
                          </Button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Shop is empty — check back soon!</p>
          )}
        </div>
      )}
    </div>
  )
}
