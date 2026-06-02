'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthUser {
  username: string
  coins: number
  role: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, restore session from httpOnly cookie via /api/auth/me
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setUser({ username: data.username, coins: data.coins, role: data.role })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const refreshUser = async () => {
    if (!user) return
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (data) setUser({ username: data.username, coins: data.coins, role: data.role })
    }
  }

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',  // ← include cookies
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error }
    setUser({ username: data.username, coins: data.coins, role: data.role })
    return { ok: true }
  }

  const register = async (username: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error }
    // After register, fetch user data
    return login(username, password)
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}