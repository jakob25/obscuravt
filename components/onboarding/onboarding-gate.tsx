'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { normalizeRole } from '@/lib/roles'
import { APP_VERSION } from '@/lib/app-version'
import { RolePicker } from './role-picker'
import { UpdateAnnouncement } from './update-announcement'
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
      {needsUpdate && !needsRole && <UpdateAnnouncement onDismiss={() => setNeedsUpdate(false)} />}
    </>
  )
}