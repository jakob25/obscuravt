'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'

interface Props {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: Props) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    setError('')
    const fn = mode === 'login' ? login : register
    const result = await fn(username, password)
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.')
    } else {
      setUsername('')
      setPassword('')
      onClose()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-vault-dark border-border">
        <DialogHeader>
          <DialogTitle className="text-vault-cream">
            {mode === 'login' ? 'Sign In to VTVault' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-vault-cream text-sm">Username</Label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your_username"
              className="mt-1 bg-muted/30 border-border text-vault-cream"
              onKeyDown={e => e.key === 'Enter' && handle()}
            />
          </div>
          <div>
            <Label className="text-vault-cream text-sm">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 bg-muted/30 border-border text-vault-cream"
              onKeyDown={e => e.key === 'Enter' && handle()}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {mode === 'register' && (
            <p className="text-xs text-muted-foreground">
              New accounts start with <span className="text-vault-gold font-medium">5,000 V-Coins</span> 🎉
            </p>
          )}

          <Button
            onClick={handle}
            disabled={loading || !username || !password}
            className="w-full bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold"
          >
            {loading ? 'Loading…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-vault-gold hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
