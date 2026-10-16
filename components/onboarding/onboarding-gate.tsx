'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { normalizeRole } from '@/lib/roles'
import { APP_VERSION } from '@/lib/app-version'
import { RolePicker } from './role-picker'
import { UpdateAnnouncement } from './update-announcement'

// What's New pop-up switched off by the owner (Oct 16, 2026). Set to true to turn it back on.
const SHOW_UPDATE_POPUP = false
import { TestingBanner } from '@/components/common/testing-banner'

function isStagingHost(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname.includes('staging')
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [needsRole, setNeedsRole] = useState(false)
  const [needsUpdate, setNeedsUpdate] = useState(false)

  useEffect(() => {
    if (loading || !user) {
      setProfileLoaded(true)
      setNeedsRole(false)
      setNeedsUpdate(false)
      return
    }

    fetch(`/api/users/${user.username}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(profile => {
        if (!profile) {
          setProfileLoaded(true)
          return
        }
        const role = normalizeRole(profile.role)
        if (!role) {
          setNeedsRole(true)
        } else if (!profile.last_seen_version || profile.last_seen_version < APP_VERSION) {
          setNeedsUpdate(true)
        }
        setProfileLoaded(true)
      })
      .catch(() => setProfileLoaded(true))
  }, [user, loading])

  const onRoleComplete = () => {
    setNeedsRole(false)
    setNeedsUpdate(true)
  }

  if (!profileLoaded && user) {
    return <>{children}</>
  }

  return (
    <>
      {isStagingHost() && <TestingBanner />}
      {children}
      {needsRole && <RolePicker onComplete={onRoleComplete} />}
      {SHOW_UPDATE_POPUP && needsUpdate && !needsRole && <UpdateAnnouncement onDismiss={() => setNeedsUpdate(false)} />}
    </>
  )
}