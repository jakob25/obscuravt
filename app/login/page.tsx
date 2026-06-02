'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fn = mode === 'login' ? login : register
    const res = await fn(username, password)
    setLoading(false)
    if (res.ok) router.push('/')
    else setError(res.error || 'Failed')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm vault-card rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-1">{mode === 'login' ? 'Welcome back' : 'Join the Vault'}</h1>
        <p className="text-muted-foreground text-sm mb-6">{mode === 'login' ? 'Sign in to track bets, clips and more.' : 'Create your account to start earning scraps.'}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-vault-gold text-vault-deep">{loading ? '...' : mode==='login'?'Sign In':'Create Account'}</Button>
        </form>
        <button onClick={()=>setMode(mode==='login'?'register':'login')} className="text-xs text-muted-foreground mt-4 hover:text-vault-gold">{mode==='login'?'Need an account? Register':'Have an account? Sign in'}</button>
        <div className="mt-6 text-[10px] text-muted-foreground">Demo: any username + any password works first time (auto-registers).</div>
      </div>
    </div>
  )
}
