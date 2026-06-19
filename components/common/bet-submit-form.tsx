'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface BetSubmitFormProps {
  onSuccess?: () => void
  onClose?: () => void
  onCancel?: () => void
}

export function BetSubmitForm({ onSuccess, onClose, onCancel }: BetSubmitFormProps) {
  const { user, username } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['Yes', 'No'])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleClose = () => {
    if (onClose) onClose()
    if (onCancel) onCancel()
  }

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ''])
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !title || options.some(o => !o.trim())) {
      setError('Please fill in title and all options')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          options: options.filter(o => o.trim()),
          created_by: username,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create bet')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        handleClose()
        setTitle('')
        setDescription('')
        setOptions(['Yes', 'No'])
        setSuccess(false)
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold text-vault-cream mb-2">Bet created!</h3>
        <p className="text-muted-foreground">It will appear once approved.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label>Title *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bet title"
          required
        />
      </div>

      <div>
        <Label>Description (optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this bet about?"
          rows={3}
        />
      </div>

      <div>
        <Label>Options (2–6)</Label>
        <div className="space-y-2 mt-2">
          {options.map((opt, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={opt}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <Button type="button" variant="outline" size="sm" onClick={() => removeOption(index)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
        {options.length < 6 && (
          <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2">
            + Add Option
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Bet'}
          {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
