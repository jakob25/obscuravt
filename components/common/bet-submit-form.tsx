'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { useVTubers } from '@/hooks/use-data'
import { CATEGORIES } from '@/lib/db-constants'
import { Plus, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface BetSubmitFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function BetSubmitForm({ onSuccess, onCancel }: BetSubmitFormProps) {
  const { user } = useAuth()
  const { vtubers } = useVTubers()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [vtuberName, setVtuberName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [options, setOptions] = useState(['', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const addOption = () => {
    if (options.length < 6) setOptions(prev => [...prev, ''])
  }

  const removeOption = (i: number) => {
    if (options.length > 2) setOptions(prev => prev.filter((_, idx) => idx !== i))
  }

  const updateOption = (i: number, val: string) => {
    setOptions(prev => prev.map((o, idx) => idx === i ? val : o))
  }

  const filledOptions = options.filter(o => o.trim())
  const isValid = title.trim().length >= 10 && filledOptions.length >= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setError('You must be signed in.'); return }
    if (!isValid) return

    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        vtuber_name: vtuberName.trim(),
        category,
        options: filledOptions,
        created_by: user.username,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setSubmitting(false)
      return
    }

    setDone(true)
    setSubmitting(false)
    setTimeout(() => onSuccess?.(), 1200)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle className="h-10 w-10 text-vault-gold" />
        <p className="font-semibold text-vault-cream">Bet created!</p>
        <p className="text-sm text-muted-foreground">Community can now place their scraps.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!user && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-vault-gold/10 border border-vault-gold/30 text-sm text-vault-gold">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          You need to be signed in to create a bet.
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-1.5">
          Bet Question <span className="text-muted-foreground font-normal">(min 10 chars)</span>
        </label>
        <Input
          placeholder="e.g. Will they finish the game in one stream?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={120}
          className="bg-muted/30 border-border text-vault-cream placeholder:text-muted-foreground"
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">{title.length}/120</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-1.5">
          Context <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          placeholder="Add context, stream link, or extra details..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground resize-none"
        />
      </div>

      {/* VTuber */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-1.5">
          Related VTuber <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <select
          value={vtuberName}
          onChange={e => setVtuberName(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-vault-cream text-sm"
        >
          <option value="">General / No specific VTuber</option>
          {vtubers.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-1.5">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as typeof category)}
          className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-vault-cream text-sm"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-1.5">
          Options <span className="text-muted-foreground font-normal">(2–6)</span>
        </label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder={`Option ${i + 1}${i < 2 ? ' (required)' : ''}`}
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                maxLength={80}
                className="bg-muted/30 border-border text-vault-cream placeholder:text-muted-foreground"
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(i)}
                  className="text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {options.length < 6 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addOption}
            className="mt-2 text-muted-foreground hover:text-vault-cream"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add option
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="border-border text-vault-cream">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isValid || submitting || !user}
          className="flex-1 bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Create Bet
        </Button>
      </div>
    </form>
  )
}
