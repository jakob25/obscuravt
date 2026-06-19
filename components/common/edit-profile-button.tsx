'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Edit } from 'lucide-react'

interface EditProfileButtonProps {
  vtuberId: string
  claimedBy: string | null
}

export function EditProfileButton({ vtuberId, claimedBy }: EditProfileButtonProps) {
  const { user, username } = useAuth()
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    if (user && username && claimedBy === username) {
      setCanEdit(true)
    }
  }, [user, username, claimedBy])

  if (!canEdit) return null

  return (
    <Link
      href={`/creator/edit/${vtuberId}`}
      className="inline-flex items-center gap-2 px-5 py-2.5 border border-vault-gold text-vault-gold rounded-lg font-semibold hover:bg-vault-gold hover:text-vault-deep transition-colors"
    >
      <Edit className="h-4 w-4" />
      Edit Profile
    </Link>
  )
}
