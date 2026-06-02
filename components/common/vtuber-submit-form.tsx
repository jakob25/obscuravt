'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { useVibeTags } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import { Plus, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface VTuberSubmitFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function VTuberSubmitForm({ onSuccess, onCancel }: VTuberSubmitFormProps) {
  const { user } = useAuth()
  const { vibeTags } = useVibeTags()
  const { constellations } = useStarMapData()

  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [platform, setPlatform] = useState('')
  const [link, setLink] = useState('')
  const [bio, setBio] = useState('')
  const [constellation, setConstellation] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  // ... full impl
  return <div>VTuber form placeholder</div>
}