'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface PageBackNavProps {
  fallbackHref?: string
  label?: string
  className?: string
  preferFallback?: boolean
}

function sameOriginReferrer(): boolean {
  if (typeof document === 'undefined' || !document.referrer) return false
  try {
    return new URL(document.referrer).origin === window.location.origin
  } catch {
    return false
  }
}

function hasPreviousHistory(): boolean {
  if (typeof window === 'undefined') return false
  return window.history.length > 1
}

export function PageBackNav({
  fallbackHref = '/discover',
  label = 'Back',
  className = 'mb-6',
  preferFallback = false,
}: PageBackNavProps) {
  const router = useRouter()

  return (
    <Link
      href={fallbackHref}
      onClick={(e) => {
        e.preventDefault()
        if (preferFallback) router.push(fallbackHref)
        else if (sameOriginReferrer() || hasPreviousHistory()) router.back()
        else router.push(fallbackHref)
      }}
      className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-vault-gold transition-colors cursor-pointer ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  )
}
