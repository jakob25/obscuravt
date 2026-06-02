'use client'

import { useState } from 'react'
import { Plus, Film, Trophy, Star, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ClipSubmitForm } from '@/components/common/clip-submit-form'
import { BetSubmitForm } from '@/components/common/bet-submit-form'
import { VTuberSubmitForm } from '@/components/common/vtuber-submit-form'

type Tab = 'vtuber' | 'clip' | 'bet'

const tabs: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'vtuber', label: 'Add VTuber',  icon: Star,   description: 'Nominate a creator for the Star Map' },
  { id: 'clip',   label: 'Submit Clip', icon: Film,   description: 'Share a great moment from a stream'  },
  { id: 'bet',    label: 'Create Bet',  icon: Trophy, description: 'Start a community prediction'        },
]

export function AddButton() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('vtuber')
  const [menuOpen, setMenuOpen] = useState(false)

  const openTab = (t: Tab) => {
    setTab(t)
    setOpen(true)
    setMenuOpen(false)
  }

  return (
    <>
      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Mini menu */}
        {menuOpen && (
          <div className="flex flex-col gap-2 mb-1">
            {tabs.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => openTab(t.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-vault-dark border border-vault-gold/30 text-vault-cream text-sm font-medium shadow-xl hover:bg-vault-gold/10 hover:border-vault-gold/60 transition-all whitespace-nowrap"
                  style={{ animation: 'slideUp 0.15s ease both' }}
                >
                  <Icon className="h-4 w-4 text-vault-gold" />
                  {t.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
            menuOpen
              ? 'bg-vault-dark border-2 border-vault-gold/50 rotate-45'
              : 'bg-vault-gold hover:bg-vault-amber'
          }`}
          style={{ boxShadow: '0 8px 30px rgba(212,168,67,0.35)' }}
          aria-label="Add content"
        >
          {menuOpen
            ? <X className="h-6 w-6 text-vault-cream" />
            : <Plus className="h-7 w-7 text-vault-deep font-bold" strokeWidth={3} />
          }
        </button>
      </div>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-vault-dark border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-vault-cream">
              {tabs.find(t => t.id === tab)?.label}
            </DialogTitle>
          </DialogHeader>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-muted/30 rounded-lg mb-2">
            {tabs.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    tab === t.id
                      ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30'
                      : 'text-muted-foreground hover:text-vault-cream'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-4">
            {tabs.find(t => t.id === tab)?.description}
          </p>

          {/* Forms */}
          {tab === 'vtuber' && (
            <VTuberSubmitForm onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
          )}
          {tab === 'clip' && (
            <ClipSubmitForm onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
          )}
          {tab === 'bet' && (
            <BetSubmitForm onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
