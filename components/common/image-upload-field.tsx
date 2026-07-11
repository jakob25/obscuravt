'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadImageFile, validateImageFile, type UploadPurpose } from '@/lib/upload-client'

interface ImageUploadFieldProps {
  purpose: UploadPurpose
  onUploaded: (url: string) => void
  onClear?: () => void
  disabled?: boolean
  label?: string
}

export function ImageUploadField({ purpose, onUploaded, onClear, disabled, label = 'Upload image' }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setUploading(true)
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    try {
      const url = await uploadImageFile(file, purpose)
      onUploaded(url)
    } catch (err: unknown) {
      setPreview(null)
      onClear?.()
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const clear = () => {
    setPreview(null)
    setError('')
    onClear?.()
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {preview ? (
          <div className="relative h-16 w-16 shrink-0">
            <img src={preview} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-border" referrerPolicy="no-referrer" />
            <button
              type="button"
              onClick={clear}
              disabled={uploading}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-vault-deep border border-border flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-vault-cream hover:border-vault-bronze/40 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading…' : label}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          disabled={disabled || uploading}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}