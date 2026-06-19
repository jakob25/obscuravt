'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface AuthUser {
  username: string
  coins: number
  role: string | null
  accountType: string | null
}

interface AuthContextType {
  user: AuthUser | null
  username: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (username: string, password: string, accountType: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUser({
            username: data.username,
            coins: data.coins || 0,
            role: data.role,
            accountType: data.account_type,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const refreshUser = async () => {
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (data) {
        setUser({
          username: data.username,
          coins: data.coins || 0,
          role: data.role,
          accountType: data.account_type,
        })
      }
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { ok: false, error: data.error || 'Login failed' }
      }

      setUser({
        username: data.username,
        coins: data.coins || 0,
        role: data.role,
        accountType: data.account_type,
      })

      return { ok: true }
    } catch (err) {
      return { ok: false, error: 'Network error' }
    }
  }

  const register = async (username: string, password: string, accountType: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, account_type: accountType }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { ok: false, error: data.error || 'Registration failed' }
      }

      // Auto-login after successful registration
      return login(username, password)
    } catch (err) {
      return { ok: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      username: user?.username || null,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }}}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
