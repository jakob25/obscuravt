'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ClipSubmitForm } from '@/components/common/clip-submit-form'
import { BetSubmitForm } from '@/components/common/bet-submit-form'
import { VTuberSubmitForm } from '@/components/common/vtuber-submit-form'
import { Plus } from 'lucide-react'

type Tab = 'vtuber' | 'clip' | 'bet'

export function AddButton() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('vtuber')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-vault-gold text-vault-deep shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Add to Vault</DialogTitle>
          </DialogHeader>

          <div className="flex border-b border-white/10 mb-4">
            <button
              onClick={() => setActiveTab('vtuber')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'vtuber' 
                  ? 'border-b-2 border-vault-gold text-vault-gold' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              VTuber
            </button>
            <button
              onClick={() => setActiveTab('clip')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'clip' 
                  ? 'border-b-2 border-vault-gold text-vault-gold' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Clip
            </button>
            <button
              onClick={() => setActiveTab('bet')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'bet' 
                  ? 'border-b-2 border-vault-gold text-vault-gold' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Bet
            </button>
          </div>

          {activeTab === 'vtuber' && (
            <VTuberSubmitForm onSuccess={() => setOpen(false)} onClose={() => setOpen(false)} />
          )}

          {activeTab === 'clip' && (
            <ClipSubmitForm onSuccess={() => setOpen(false)} onClose={() => setOpen(false)} />
          )}

          {activeTab === 'bet' && (
            <BetSubmitForm onSuccess={() => setOpen(false)} onClose={() => setOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
