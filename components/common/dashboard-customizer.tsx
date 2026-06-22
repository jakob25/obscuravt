'use client'

import { useState, useCallback, useRef } from 'react'
import { Settings, GripVertical, X, Plus, Eye, EyeOff } from 'lucide-react'

export type WidgetId =
  | 'trending_clips'
  | 'active_bets'
  | 'constellations'
  | 'featured_vtubers'
  | 'weekly_digest'
  | 'find_my_oshi'
  | 'tag_validator'
  | 'leaderboard'
  | 'forums'
  | 'recent_notifications'
  | 'daily_loop'
  | 'my_clips'

export interface Widget {
  id: WidgetId
  label: string
  description: string
  defaultSize: 'full' | 'half'
  symbol: string
}

export const ALL_WIDGETS: Widget[] = [
  { id: 'trending_clips',        label: 'Trending Clips',         description: 'Top upvoted clips this week',      defaultSize: 'full',  symbol: '◈' },
  { id: 'active_bets',           label: 'Active Bets',            description: 'Open bets you can place on',       defaultSize: 'half',  symbol: '★' },
  { id: 'constellations',        label: 'Constellations',          description: 'Quick links to all clusters',      defaultSize: 'full',  symbol: '✦' },
  { id: 'featured_vtubers',      label: 'Featured Creators',      description: 'VTubers from the Vault',           defaultSize: 'full',  symbol: '◆' },
  { id: 'weekly_digest',         label: 'Weekly Digest',          description: 'This week\'s highlights',          defaultSize: 'half',  symbol: '⊞' },
  { id: 'find_my_oshi',          label: 'Find My Oshi',           description: 'Quick quiz shortcut',              defaultSize: 'half',  symbol: '♦' },
  { id: 'tag_validator',         label: 'Tag Validator',          description: 'Earn scraps by validating tags',   defaultSize: 'half',  symbol: '⚡' },
  { id: 'leaderboard',           label: 'Leaderboard',            description: 'Top earners this week',            defaultSize: 'half',  symbol: '▲' },
  { id: 'forums',                label: 'Forums',                 description: 'Latest constellation posts',       defaultSize: 'half',  symbol: '◇' },
  { id: 'recent_notifications',  label: 'Notifications',          description: 'Your recent alerts',              defaultSize: 'half',  symbol: '◉' },
  { id: 'daily_loop',             label: 'Daily Loop',             description: 'Daily bonus, tag validator, silhouette, bets', defaultSize: 'full', symbol: '↻' },
  { id: 'my_clips',               label: 'Your Clips',             description: 'Clip metrics for your submissions',          defaultSize: 'half', symbol: '⊕' },
]

const DEFAULT_LAYOUT: WidgetId[] = [
  'daily_loop',
  'trending_clips',
  'constellations',
  'featured_vtubers',
  'active_bets',
]

const STORAGE_KEY = 'vtvault_dashboard_layout'

export function useDashboardLayout() {
  const [layout, setLayout] = useState<WidgetId[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_LAYOUT
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_LAYOUT
    } catch {
      return DEFAULT_LAYOUT
    }
  })

  const save = useCallback((newLayout: WidgetId[]) => {
    setLayout(newLayout)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout)) } catch {}
  }, [])

  const addWidget = useCallback((id: WidgetId) => {
    setLayout(prev => {
      const next = prev.includes(id) ? prev : [...prev, id]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const removeWidget = useCallback((id: WidgetId) => {
    setLayout(prev => {
      const next = prev.filter(w => w !== id)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const moveWidget = useCallback((from: number, to: number) => {
    setLayout(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { layout, addWidget, removeWidget, moveWidget, reset: () => save(DEFAULT_LAYOUT) }
}

interface DashboardCustomizerProps {
  layout: WidgetId[]
  onAdd: (id: WidgetId) => void
  onRemove: (id: WidgetId) => void
  onMove: (from: number, to: number) => void
  onReset: () => void
  availableWidgets?: Widget[]
}

export function DashboardCustomizer({ layout, onAdd, onRemove, onMove, onReset, availableWidgets = ALL_WIDGETS }: DashboardCustomizerProps) {
  const [open, setOpen] = useState(false)
  const dragIdx = useRef<number | null>(null)

  const hidden = availableWidgets.filter(w => !layout.includes(w.id))

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-vault-cream hover:border-vault-bronze/40 transition-colors"
      >
        <Settings className="h-3.5 w-3.5" />
        Customize
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-vault-dark border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-bold text-vault-cream">Customize Dashboard</h2>
              <div className="flex items-center gap-2">
                <button onClick={onReset} className="text-xs text-muted-foreground hover:text-vault-cream transition-colors">
                  Reset
                </button>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-vault-cream transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Active widgets — draggable */}
            <div className="px-5 py-4 max-h-96 overflow-y-auto">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Active Widgets</p>
              <div className="space-y-2 mb-5">
                {layout.map((widgetId, idx) => {
                  const w = availableWidgets.find(x => x.id === widgetId) ?? ALL_WIDGETS.find(x => x.id === widgetId)
                  if (!w) return null
                  return (
                    <div
                      key={widgetId}
                      draggable
                      onDragStart={() => { dragIdx.current = idx }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => {
                        if (dragIdx.current !== null && dragIdx.current !== idx) {
                          onMove(dragIdx.current, idx)
                          dragIdx.current = null
                        }
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border cursor-grab active:cursor-grabbing hover:border-vault-bronze/40 transition-colors"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-lg flex-shrink-0 text-vault-gold font-mono">{w.symbol}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-vault-cream">{w.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{w.description}</p>
                      </div>
                      <button
                        onClick={() => onRemove(widgetId)}
                        className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Add widgets */}
              {hidden.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Add Widgets</p>
                  <div className="space-y-2">
                    {hidden.map(w => (
                      <div key={w.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/50 opacity-60 hover:opacity-100 hover:border-vault-bronze/40 transition-all">
                        <span className="text-lg flex-shrink-0 text-vault-gold font-mono">{w.symbol}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-vault-cream">{w.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{w.description}</p>
                        </div>
                        <button
                          onClick={() => onAdd(w.id)}
                          className="text-muted-foreground hover:text-vault-gold transition-colors flex-shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="px-5 pb-4">
              <p className="text-xs text-muted-foreground text-center">Drag to reorder · Changes save automatically</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
