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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [granted, setGranted] = useState(false)

  const boltsOut = () => {
    const moves: Record<string, string> = {
      bT: 'translateY(-28px)', bB: 'translateY(28px)',
      bL: 'translateX(-28px)', bR: 'translateX(28px)',
      bTR: 'translate(20px,-20px)', bTL: 'translate(-20px,-20px)',
      bBR: 'translate(20px,20px)', bBL: 'translate(-20px,20px)',
    }
    Object.entries(moves).forEach(([id, t]) => {
      const el = document.getElementById(id)
      if (el) el.style.transform = t
    })
    const ring = document.getElementById('dialRing')
    if (ring) ring.style.animationDuration = '0.35s'
  }

  const handleSubmit = async () => {
    if (!username || !password) return
    setError('')
    setLoading(true)
    const fn = mode === 'login' ? login : register
    const result = await fn(username, password)
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }
    setGranted(true)
    boltsOut()
    setTimeout(() => router.push('/'), 1200)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .vl-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a14;
          padding: 2rem;
        }
        .vl-card {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .vl-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(38px, 9vw, 64px);
          letter-spacing: 0.14em;
          color: #d4a843;
          margin-bottom: 4px;
          line-height: 1;
          -webkit-text-stroke: 2px #b8891f;
          paint-order: stroke fill;
        }
        .vl-honor {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          letter-spacing: 0.05em;
          color: #7a6a45;
          font-style: italic;
          font-weight: 300;
          margin-bottom: 26px;
          text-align: center;
        }
        .vl-lock {
          position: relative;
          width: min(460px, 92vw);
          height: min(460px, 92vw);
        }
        .vl-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .bolt {
          transition: transform 0.65s cubic-bezier(0.34,1.2,0.64,1);
        }
        .fo-wrap {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(196px, 42vw);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
        }
        .fo-tabs {
          display: flex;
          background: rgba(10,10,20,0.85);
          border: 1px solid #1e1a35;
          border-radius: 7px;
          padding: 3px;
          width: 100%;
        }
        .fo-tab {
          flex: 1;
          padding: 6px 0;
          border: none;
          background: transparent;
          color: #777;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 5px;
          transition: all 0.2s;
        }
        .fo-tab.on {
          background: rgba(212,168,67,0.18);
          color: #d4a843;
        }
        .fo-input {
          width: 100%;
          padding: 10px 12px;
          background: rgba(10,10,20,0.85);
          border: 1px solid #2a2440;
          border-radius: 7px;
          color: #ffffff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .fo-input:focus { border-color: #d4a843; }
        .fo-input::placeholder { color: rgba(255,255,255,0.45); }
        .fo-btn {
          width: 100%;
          padding: 11px;
          background: #d4a843;
          border: none;
          border-radius: 7px;
          color: #0a0a14;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 0.2em;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .fo-btn:hover { background: #e8bc5a; }
        .fo-btn:active { transform: scale(0.97); }
        .fo-btn.granted { background: #2d7a4a; color: #e8f5ee; }
        .fo-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .fo-hint {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          color: #777;
          text-align: center;
        }
        .fo-hint button {
          background: none;
          border: none;
          color: #d4a843;
          cursor: pointer;
          font-size: 10px;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
        }
        .fo-hint button:hover { text-decoration: underline; }
        .fo-error {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          color: #f87171;
          text-align: center;
          width: 100%;
        }
        @keyframes dialSpin { to { transform: rotate(360deg); } }
        @keyframes handSpin {
          from { transform: rotate(-25deg); }
          to   { transform: rotate(25deg); }
        }
      `}</style>

      <div className="vl-page">
        <div className="vl-card">
          <div className="vl-title">ObscuraVT</div>
          <div className="vl-honor">Created in honor of Spindra Popaly</div>

          <div className="vl-lock">
            <svg className="vl-svg" viewBox="0 0 460 460" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="faceG" cx="38%" cy="32%">
                  <stop offset="0%" stopColor="#1a1730"/>
                  <stop offset="100%" stopColor="#0b0918"/>
                </radialGradient>
                <radialGradient id="hubG" cx="35%" cy="30%">
                  <stop offset="0%" stopColor="#2a2440"/>
                  <stop offset="100%" stopColor="#100e1e"/>
                </radialGradient>
              </defs>

              <g className="bolt" id="bT">
                <rect x="204" y="6" width="52" height="76" rx="7" fill="#12101f" stroke="#d4a843" strokeWidth="1.5"/>
                <rect x="214" y="14" width="32" height="5" rx="2" fill="#d4a843" opacity="0.4"/>
                <rect x="214" y="23" width="32" height="5" rx="2" fill="#d4a843" opacity="0.4"/>
                <rect x="214" y="32" width="32" height="5" rx="2" fill="#d4a843" opacity="0.4"/>
              </g>
              <g className="bolt" id="bB">
                <rect x="204" y="378" width="52" height="76" rx="7" fill="#12101f" stroke="#d4a843" strokeWidth="1.5"/>
                <rect x="214" y="422" width="32" height="5" rx="2" fill="#d4a843" opacity="0.4"/>
                <rect x="214" y="431" width="32" height="5" rx="2" fill="#d4a843" opacity="0.4"/>
                <rect x="214" y="440" width="32" height="5" rx="2" fill="#d4a843" opacity="0.4"/>
              </g>
              <g className="bolt" id="bL">
                <rect x="6" y="204" width="76" height="52" rx="7" fill="#12101f" stroke="#d4a843" strokeWidth="1.5"/>
                <rect x="14" y="214" width="5" height="32" rx="2" fill="#d4a843" opacity="0.4"/>
                <rect x="23" y="214" width="5" height="32" rx="2" fill="#d4a843" opacity="0.4"/>
                <rect x="32" y="214" width="5" height="32" rx="2" fill="#d4a843" opacity="0.4"/>
              </g>
              <g className="bolt" id="bR">
                <rect x="378" y="204" width="76" height="52" rx="7" fill="#12101f" stroke="#d4a843" strokeWidth="1.5"/>
                <rect x="422" y="214" width="5" height="32" rx="2" fill="#d4a843" opacity="0.4"/>
                <rect x="431" y="214" width="5" height="32" rx="2" fill="#d4a843" opacity="0.4"/>
                <rect x="440" y="214" width="5" height="32" rx="2" fill="#d4a843" opacity="0.4"/>
              </g>
              <g className="bolt" id="bTR">
                <rect x="330" y="46" width="72" height="36" rx="7" fill="#12101f" stroke="#d4a843" strokeWidth="1.5" transform="rotate(45 366 64)"/>
                <rect x="345" y="56" width="5" height="22" rx="2" fill="#d4a843" opacity="0.4" transform="rotate(45 347 67)"/>
                <rect x="358" y="56" width="5" height="22" rx="2" fill="#d4a843" opacity="0.4" transform="rotate(45 360 67)"/>
              </g>
              <g className="bolt" id="bTL">
                <rect x="58" y="46" width="72" height="36" rx="7" fill="#12101f" stroke="#d4a843" strokeWidth="1.5" transform="rotate(-45 94 64)"/>
                <rect x="73" y="56" width="5" height="22" rx="2" fill="#d4a843" opacity="0.4" transform="rotate(-45 75 67)"/>
                <rect x="86" y="56" width="5" height="22" rx="2" fill="#d4a843" opacity="0.4" transform="rotate(-45 88 67)"/>
              </g>
              <g className="bolt" id="bBR">
                <rect x="330" y="378" width="72" height="36" rx="7" fill="#12101f" stroke="#d4a843" strokeWidth="1.5" transform="rotate(-45 366 396)"/>
                <rect x="345" y="384" width="5" height="22" rx="2" fill="#d4a843" opacity="0.4" transform="rotate(-45 347 395)"/>
                <rect x="358" y="384" width="5" height="22" rx="2" fill="#d4a843" opacity="0.4" transform="rotate(-45 360 395)"/>
              </g>
              <g className="bolt" id="bBL">
                <rect x="58" y="378" width="72" height="36" rx="7" fill="#12101f" stroke="#d4a843" strokeWidth="1.5" transform="rotate(45 94 396)"/>
                <rect x="73" y="384" width="5" height="22" rx="2" fill="#d4a843" opacity="0.4" transform="rotate(45 75 395)"/>
                <rect x="86" y="384" width="5" height="22" rx="2" fill="#d4a843" opacity="0.4" transform="rotate(45 88 395)"/>
              </g>

              <circle cx="230" cy="230" r="178" fill="none" stroke="#1e1a35" strokeWidth="3"/>
              <circle cx="230" cy="230" r="174" fill="none" stroke="#d4a843" strokeWidth="1" strokeDasharray="5 6" opacity="0.3"/>
              <circle cx="230" cy="230" r="162" fill="url(#faceG)" stroke="#d4a843" strokeWidth="2"/>
              <circle cx="230" cy="230" r="158" fill="none" stroke="#2a2440" strokeWidth="1"/>

              <g stroke="#d4a843" strokeWidth="1.5" opacity="0.3">
                <line x1="230" y1="72" x2="230" y2="84"/>
                <line x1="230" y1="376" x2="230" y2="388"/>
                <line x1="72" y1="230" x2="84" y2="230"/>
                <line x1="376" y1="230" x2="388" y2="230"/>
                <line x1="116" y1="116" x2="124" y2="124"/>
                <line x1="344" y1="116" x2="336" y2="124"/>
                <line x1="116" y1="344" x2="124" y2="336"/>
                <line x1="344" y1="344" x2="336" y2="336"/>
              </g>

              <g id="dialRing" style={{ transformOrigin: '230px 230px', animation: 'dialSpin 10s linear infinite' }}>
                <circle cx="230" cy="230" r="118" fill="none" stroke="#1a1730" strokeWidth="20"/>
                <circle cx="230" cy="230" r="118" fill="none" stroke="#d4a843" strokeWidth="1" strokeDasharray="4 11" opacity="0.5"/>
                <text x="230" y="116" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#d4a843" opacity="0.6">00</text>
                <text x="342" y="234" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#d4a843" opacity="0.6">25</text>
                <text x="230" y="350" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#d4a843" opacity="0.6">50</text>
                <text x="118" y="234" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#d4a843" opacity="0.6">75</text>
              </g>

              <line x1="230" y1="230" x2="230" y2="116" stroke="#d4a843" strokeWidth="2.5" strokeLinecap="round"
                style={{ transformOrigin: '230px 230px', animation: 'handSpin 2.5s ease-in-out infinite alternate' }}/>

              <circle cx="230" cy="230" r="96" fill="url(#hubG)" stroke="#d4a843" strokeWidth="1.5"/>
              <circle cx="230" cy="230" r="90" fill="none" stroke="#2a2440" strokeWidth="1"/>
              <circle cx="230" cy="230" r="7" fill="#d4a843" opacity="0.9"/>
              <circle cx="230" cy="230" r="3" fill="#0b0918"/>
            </svg>

            <div className="fo-wrap">
              <div className="fo-tabs">
                <button type="button" className={`fo-tab ${mode === 'login' ? 'on' : ''}`} onClick={() => { setMode('login'); setError('') }}>Sign In</button>
                <button type="button" className={`fo-tab ${mode === 'register' ? 'on' : ''}`} onClick={() => { setMode('register'); setError('') }}>Register</button>
              </div>

              <input
                className="fo-input"
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete="username"
              />
              <input
                className="fo-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />

              {error && <div className="fo-error">{error}</div>}

              <button
                type="button"
                className={`fo-btn ${granted ? 'granted' : ''}`}
                onClick={handleSubmit}
                disabled={loading || !username || !password}
              >
                {granted ? '✓ ACCESS GRANTED' : loading ? '...' : mode === 'login' ? 'OPEN THE VAULT' : 'CREATE ACCOUNT'}
              </button>

              <div className="fo-hint">
                {mode === 'login'
                  ? <>No account? <button type="button" onClick={() => { setMode('register'); setError('') }}>Register free</button></>
                  : <>Have one? <button type="button" onClick={() => { setMode('login'); setError('') }}>Sign in</button></>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}