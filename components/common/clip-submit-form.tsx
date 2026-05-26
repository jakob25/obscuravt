'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { vibeTags, vtubers } from '@/lib/mock-data'
import { validateClipUrl, extractVideoId, parseTimestamp } from '@/lib/embed-utils'
import { Plus, X, AlertCircle, CheckCircle, Link as LinkIcon } from 'lucide-react'

interface ClipSubmitFormProps {
  onSubmit?: (data: ClipSubmission) => void
  onCancel?: () => void
}

export interface ClipSubmission {
  url: string
  platform: 'youtube' | 'twitch'
  videoId: string
  startTime?: number
  endTime?: number
  title: string
  vtuberId: string
  vibeTags: string[]
  type: 'raw' | 'edited'
}

export function ClipSubmitForm({ onSubmit, onCancel }: ClipSubmitFormProps) {
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [urlValid, setUrlValid] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<{ platform: string; videoId: string } | null>(null)
  
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [title, setTitle] = useState('')
  const [selectedVTuber, setSelectedVTuber] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [clipType, setClipType] = useState<'raw' | 'edited'>('raw')

  const handleUrlChange = (value: string) => {
    setUrl(value)
    setUrlError(null)
    setUrlValid(false)
    setExtractedInfo(null)

    if (value) {
      const validation = validateClipUrl(value)
      if (!validation.valid) {
        setUrlError(validation.error || 'Invalid URL')
      } else {
        const info = extractVideoId(value)
        if (info) {
          setExtractedInfo(info)
          setUrlValid(true)
        }
      }
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : prev.length < 5 ? [...prev, tagId] : prev
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!urlValid || !extractedInfo || !title || !selectedVTuber || selectedTags.length === 0) {
      return
    }

    const submission: ClipSubmission = {
      url,
      platform: extractedInfo.platform as 'youtube' | 'twitch',
      videoId: extractedInfo.videoId,
      startTime: startTime ? parseTimestamp(startTime) : undefined,
      endTime: endTime ? parseTimestamp(endTime) : undefined,
      title,
      vtuberId: selectedVTuber,
      vibeTags: selectedTags,
      type: clipType,
    }

    onSubmit?.(submission)
  }

  const isValid = urlValid && title && selectedVTuber && selectedTags.length > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-2">
          Video URL
        </label>
        <div className="relative">
          <Input
            type="url"
            placeholder="https://youtube.com/watch?v=... or https://twitch.tv/..."
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className={`
              bg-vault-deep border-border text-vault-cream placeholder:text-muted-foreground pr-10
              ${urlError ? 'border-destructive' : ''}
              ${urlValid ? 'border-vault-gold' : ''}
            `}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {urlError && <AlertCircle className="h-4 w-4 text-destructive" />}
            {urlValid && <CheckCircle className="h-4 w-4 text-vault-gold" />}
          </div>
        </div>
        {urlError && (
          <p className="mt-2 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {urlError}
          </p>
        )}
        {extractedInfo && (
          <p className="mt-2 text-sm text-vault-gold flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Detected: {extractedInfo.platform} video
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          YouTube Shorts are not accepted. We focus on raw, unedited clips and longer highlights.
        </p>
      </div>

      {/* Timestamps */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-vault-cream mb-2">
            Start Time (optional)
          </label>
          <Input
            placeholder="e.g., 1:23:45 or 5045"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-vault-deep border-border text-vault-cream placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-vault-cream mb-2">
            End Time (optional)
          </label>
          <Input
            placeholder="e.g., 1:25:30 or 5130"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="bg-vault-deep border-border text-vault-cream placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-2">
          Clip Title
        </label>
        <Input
          placeholder="Give this moment a memorable title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-vault-deep border-border text-vault-cream placeholder:text-muted-foreground"
        />
      </div>

      {/* VTuber Selection */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-2">
          Which VTuber is this?
        </label>
        <select
          value={selectedVTuber}
          onChange={(e) => setSelectedVTuber(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-vault-deep border border-border text-vault-cream"
        >
          <option value="">Select a VTuber...</option>
          {vtubers.map(vtuber => (
            <option key={vtuber.id} value={vtuber.id}>
              {vtuber.name}
            </option>
          ))}
        </select>
      </div>

      {/* Clip Type */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-2">
          Clip Type
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setClipType('raw')}
            className={`
              flex-1 p-3 rounded-lg border text-left transition-colors
              ${clipType === 'raw'
                ? 'bg-vault-gold/10 border-vault-gold text-vault-gold'
                : 'bg-vault-deep border-border text-muted-foreground hover:border-vault-bronze/50'
              }
            `}
          >
            <div className="font-medium text-sm">Raw Highlight</div>
            <div className="text-xs opacity-70 mt-1">Unedited, straight from the stream</div>
          </button>
          <button
            type="button"
            onClick={() => setClipType('edited')}
            className={`
              flex-1 p-3 rounded-lg border text-left transition-colors
              ${clipType === 'edited'
                ? 'bg-vault-bronze/10 border-vault-bronze text-vault-bronze'
                : 'bg-vault-deep border-border text-muted-foreground hover:border-vault-bronze/50'
              }
            `}
          >
            <div className="font-medium text-sm">Edited Clip</div>
            <div className="text-xs opacity-70 mt-1">Has been edited or compiled</div>
          </button>
        </div>
      </div>

      {/* Vibe Tags */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-2">
          Vibe Tags (select up to 5)
        </label>
        <div className="flex flex-wrap gap-2">
          {vibeTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`
                px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                ${selectedTags.includes(tag.id)
                  ? 'bg-vault-gold/20 border-vault-gold text-vault-gold'
                  : 'bg-vault-deep border-border text-muted-foreground hover:border-vault-bronze/50 hover:text-vault-cream'
                }
              `}
            >
              {tag.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Selected: {selectedTags.length}/5
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-vault-bronze/50 text-vault-cream hover:bg-vault-bronze/10"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isValid}
          className="flex-1 bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Submit Clip
        </Button>
      </div>
    </form>
  )
}
