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
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('vtvault_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  const refreshUser = async () => {
    if (!user) return
    const res = await fetch(`/api/users/${user.username}`)
    if (res.ok) {
      const data = await res.json()
      const updated = { username: data.username, coins: data.coins, role: data.role }
      setUser(updated)
      localStorage.setItem('vtvault_user', JSON.stringify(updated))
    }
  }

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error }
    const authUser = { username: data.username, coins: data.coins, role: data.role }
    setUser(authUser)
    localStorage.setItem('vtvault_user', JSON.stringify(authUser))
    return { ok: true }
  }

  const register = async (username: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error }
    return login(username, password)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('vtvault_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
