'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const { login, register } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<'vtuber' | 'fan' | 'clipper'>('fan')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [granted, setGranted] = useState(false)

  const boltsOut = () => {
    // Existing animation logic...
  }

  const handleSubmit = async () => {
    if (!username || !password) return
    setError('')
    setLoading(true)

    let result

    if (mode === 'login') {
      result = await login(username, password)
    } else {
      result = await register(username, password, accountType)
    }

    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    setGranted(true)
    boltsOut()
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  return (
    <>
      {/* Keep existing styles */}
      <div className="vl-page">
        <div className="vl-card">
          <div className="vl-title">ObscuraVT</div>
          <div className="vl-honor">Created in honor of Spindra Popaly</div>

          <div className="vl-lock">
            {/* Existing SVG and form structure */}
            <div className="fo-wrap">
              {/* Tabs */}
              <div className="fo-tabs">
                <button
                  onClick={() => { setMode('login'); setError('') }}
                  className={`fo-tab ${mode === 'login' ? 'on' : ''}`}
                >
                  SIGN IN
                </button>
                <button
                  onClick={() => { setMode('register'); setError('') }}
                  className={`fo-tab ${mode === 'register' ? 'on' : ''}`}
                >
                  REGISTER
                </button>
              </div>

              {/* Form */}
              <input
                className="fo-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                className="fo-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Role Selector - Only show in Register mode */}
              {mode === 'register' && (
                <div className="mt-2">
                  <div className="text-xs text-white/50 mb-1.5 px-1">I am a...</div>
                  <div className="flex gap-2">
                    {(['fan', 'vtuber', 'clipper'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountType(type)}
                        className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                          accountType === type
                            ? 'bg-vault-gold/20 border-vault-gold text-vault-gold'
                            : 'border-white/20 text-white/70 hover:bg-white/5'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <div className="fo-error">{error}</div>}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`fo-btn ${granted ? 'granted' : ''}`}
              >
                {loading ? '...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>

              <div className="fo-hint">
                {mode === 'login' ? (
                  <>No account? <button onClick={() => { setMode('register'); setError('') }}>Register free</button></>
                ) : (
                  <>Have one? <button onClick={() => { setMode('login'); setError('') }}>Sign in</button></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
