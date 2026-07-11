'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { VaultFrame } from '@/components/vault/vault-frame'
import { VaultPanel } from '@/components/vault/vault-surfaces'
import { validateCollabRequestInput } from '@/lib/collab'

const REQUEST_TYPES = ['Collab', 'Game Session', 'Just Chatting', 'Other'] as const
const EXPIRY_OPTIONS = [1, 2, 3, 7] as const

type FormErrors = Partial<Record<'request_type' | 'game_or_activity' | 'contact', string>>

export function CollabRequestForm() {
  const [requestType, setRequestType] = useState('')
  const [gameOrActivity, setGameOrActivity] = useState('')
  const [onStream, setOnStream] = useState(true)
  const [availability, setAvailability] = useState('')
  const [contactTwitter, setContactTwitter] = useState('')
  const [contactDiscord, setContactDiscord] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(3)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const resetForm = () => {
    setRequestType('')
    setGameOrActivity('')
    setOnStream(true)
    setAvailability('')
    setContactTwitter('')
    setContactDiscord('')
    setExpiresInDays(3)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateCollabRequestInput({
      request_type: requestType,
      game_or_activity: gameOrActivity,
      on_stream: onStream,
      availability,
      contact_twitter: contactTwitter,
      contact_discord: contactDiscord,
      expires_in_days: expiresInDays,
    })

    if (!validation.valid) {
      setErrors(validation.errors as FormErrors)
      return
    }

    setSubmitting(true)
    setSuccessMessage('')
    setErrors({})

    const res = await fetch('/api/collab/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        request_type: requestType,
        game_or_activity: gameOrActivity,
        on_stream: onStream,
        availability,
        contact_twitter: contactTwitter,
        contact_discord: contactDiscord,
        expires_in_days: expiresInDays,
      }),
    })

    const data = await res.json().catch(() => ({}))
    setSubmitting(false)

    if (!res.ok) {
      if (data.details) {
        setErrors(data.details)
      }
      return
    }

    setSuccessMessage('Request sent — matched VTubers have been notified')
    resetForm()
  }

  const requestTypeLabel = useMemo(() => requestType || 'Select a request type', [requestType])

  return (
    <VaultFrame className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-vault-cream">Send a collab request</h3>
          <p className="text-xs text-muted-foreground mt-1">Match your claimed profile with other VTubers that share tags.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <VaultPanel className="p-4 space-y-4">
          <div>
            <label className="text-sm text-vault-cream">Looking for</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {REQUEST_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRequestType(type)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${requestType === type ? 'border-vault-gold bg-vault-gold/10 text-vault-gold' : 'border-border text-muted-foreground hover:text-vault-cream'}`}
                >
                  {type}
                </button>
              ))}
            </div>
            {errors.request_type ? <p className="mt-2 text-sm text-red-400">{errors.request_type}</p> : null}
          </div>

          <div>
            <label className="text-sm text-vault-cream" htmlFor="game-or-activity">Game or activity</label>
            <Input
              id="game-or-activity"
              value={gameOrActivity}
              onChange={e => setGameOrActivity(e.target.value)}
              placeholder="e.g. Lethal Company, karaoke, art stream…"
              maxLength={120}
              className="mt-2"
            />
            {errors.game_or_activity ? <p className="mt-2 text-sm text-red-400">{errors.game_or_activity}</p> : null}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
            <div>
              <p className="text-sm text-vault-cream">On stream or off stream</p>
              <p className="text-xs text-muted-foreground">Toggle for the format you want.</p>
            </div>
            <Switch checked={onStream} onCheckedChange={setOnStream} />
          </div>

          <div>
            <label className="text-sm text-vault-cream" htmlFor="availability">General availability</label>
            <Textarea
              id="availability"
              value={availability}
              onChange={e => setAvailability(e.target.value)}
              placeholder="e.g. evenings EST, this weekend"
              className="mt-2 min-h-20"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-vault-cream" htmlFor="contact-twitter">Twitter/X handle</label>
              <Input id="contact-twitter" value={contactTwitter} onChange={e => setContactTwitter(e.target.value)} placeholder="@handle" className="mt-2" />
            </div>
            <div>
              <label className="text-sm text-vault-cream" htmlFor="contact-discord">Discord username</label>
              <Input id="contact-discord" value={contactDiscord} onChange={e => setContactDiscord(e.target.value)} placeholder="username#0000" className="mt-2" />
            </div>
          </div>
          {errors.contact ? <p className="text-sm text-red-400">{errors.contact}</p> : null}

          <div>
            <label className="text-sm text-vault-cream">Expires in</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXPIRY_OPTIONS.map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setExpiresInDays(days)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${expiresInDays === days ? 'border-vault-gold bg-vault-gold/10 text-vault-gold' : 'border-border text-muted-foreground hover:text-vault-cream'}`}
                >
                  {days} day{days === 1 ? '' : 's'}
                </button>
              ))}
            </div>
          </div>
        </VaultPanel>

        {successMessage ? <p className="text-sm text-vault-gold">{successMessage}</p> : null}

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">{requestTypeLabel}</p>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send request'}
          </Button>
        </div>
      </form>
    </VaultFrame>
  )
}
