'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { useVTubers } from '@/hooks/use-data'
import { CATEGORIES } from '@/lib/db-constants'
import { Plus, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface BetSubmitFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function BetSubmitForm({ onSuccess, onCancel }: BetSubmitFormProps) {
  const { user } = useAuth()
  const { vtubers } = useVTubers()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [vtuberName, setVtuberName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [options, setOptions] = useState(['', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const addOption = () => {
    if (options.length < 6) setOptions(prev => [...prev, ''])
  }
  // ... full form logic from source
  return <div>Bet form - full in follow</div>
}