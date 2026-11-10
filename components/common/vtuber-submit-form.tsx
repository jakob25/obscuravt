'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { VTUBER_SUBMIT } from '@/lib/site-copy'
import { formatTagLabel } from '@/lib/tag-label'
import {
  type ClusterOption,
  type NicheOption,
  buildNominationTags,
  closeNicheMatches,
  clustersFromTagRows,
  CUSTOM_NICHE_MAX_COUNT,
  matchExistingNiche,
  nicheDisplayName,
  nicheLeadText,
  nichesFromTagRows,
  safeTagColor,
  sanitizeCustomNiche,
} from '@/lib/nomination-niche'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react'

export const VTUBER_WIZARD_STEPS = ['signin', 'link', 'details', 'tags', 'review'] as const
export type VtuberWizardStep = (typeof VTUBER_WIZARD_STEPS)[number]

type LookupDuplicate = {
  status: 'match' | 'pending' | 'unsure'
  id: string | null
  name: string | null
}

interface VTuberSubmitFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  /** Local screenshot / fixture harness only. Leaves the live form path unchanged. */
  preview?: {
    step: VtuberWizardStep
    signedIn?: boolean
    name?: string
    handle?: string
    platform?: string
    link?: string
    bio?: string
    lookupMessage?: string
    duplicate?: LookupDuplicate | null
    constellation?: string
    niche?: string
    niches?: NicheOption[]
    clusters?: ClusterOption[]
    customNiches?: string[]
    vibeTags?: string[]
    avatarUrl?: string | null
  }
}

function loginHref(pathname: string): string {
  const next = pathname === '/nominator'
    ? '/nominator'
    : `${pathname}${pathname.includes('?') ? '&' : '?'}compose=vtuber`
  return `/login?next=${encodeURIComponent(next)}`
}

export function VTuberSubmitForm({ onSuccess, onCancel, preview }: VTuberSubmitFormProps) {
  const auth = useAuth()
  const previewUser = preview?.signedIn
    ? { username: 'Nim', coins: 0, role: 'fan', isAdmin: false }
    : null
  const user = preview ? previewUser : auth.user
  const authLoading = preview ? false : auth.loading
  const pathname = usePathname() || '/nominator'
  const [step, setStep] = useState<VtuberWizardStep | 'pending'>(preview?.step ?? 'pending')
  const [formData, setFormData] = useState({
    name: preview?.name ?? '',
    handle: preview?.handle ?? '',
    platform: preview?.platform ?? 'Twitch',
    link: preview?.link ?? '',
    bio: preview?.bio ?? '',
  })
  const [selectedConstellation, setSelectedConstellation] = useState(preview?.constellation ?? '')
  const [selectedNiche, setSelectedNiche] = useState(preview?.niche ?? '')
  const [customNiches, setCustomNiches] = useState<string[]>(preview?.customNiches ?? [])
  const [nicheDraft, setNicheDraft] = useState('')
  const [closeHint, setCloseHint] = useState<NicheOption | null>(null)
  const [niches, setNiches] = useState<NicheOption[]>(preview?.niches ?? [])
  const [clusters, setClusters] = useState<ClusterOption[]>(preview?.clusters ?? [])
  const [selectedVibeTags, setSelectedVibeTags] = useState<string[]>(preview?.vibeTags ?? [])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [lookupAvatar, setLookupAvatar] = useState<string | null>(preview?.avatarUrl ?? null)
  const [avatarCleared, setAvatarCleared] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupMessage, setLookupMessage] = useState(preview?.lookupMessage ?? '')
  const [duplicate, setDuplicate] = useState<LookupDuplicate | null>(preview?.duplicate ?? null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [skippedLink, setSkippedLink] = useState(false)
  const touchedRef = useRef({ name: false, handle: false, platform: false, bio: false })
  const lastLookupUrlRef = useRef('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  const vibeTagOptions = ['wholesome', 'chaotic', 'unhinged', 'cozy', 'competitive', 'artistic', 'meme', 'chill']

  const shownAvatar = avatarPreview || (!avatarFile && !avatarCleared ? lookupAvatar : null)
  const blockingDuplicate = duplicate?.status === 'match' || duplicate?.status === 'pending' || duplicate?.status === 'unsure'
  const activeStep: VtuberWizardStep = step === 'pending' ? (user ? 'link' : 'signin') : step
  const visibleSteps = user
    ? VTUBER_WIZARD_STEPS.filter(id => id !== 'signin')
    : [...VTUBER_WIZARD_STEPS]
  const stepIndex = Math.max(0, visibleSteps.indexOf(activeStep))
  const stepMeta = VTUBER_SUBMIT.steps[activeStep]

  useEffect(() => {
    if (preview || authLoading) return
    setStep(current => {
      if (current === 'pending') return user ? 'link' : 'signin'
      if (current === 'signin' && user) return 'link'
      return current
    })
  }, [user, authLoading, preview])

  const skipInitialFocus = useRef(true)
  useEffect(() => {
    if (step === 'pending') return
    if (skipInitialFocus.current) {
      skipInitialFocus.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === 'name' || field === 'handle' || field === 'platform' || field === 'bio') {
      touchedRef.current[field] = true
    }
    if (field === 'link') setSkippedLink(false)
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setAvatarFile(file)
    setAvatarCleared(false)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setError('')
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarCleared(true)
  }

  const toggleVibeTag = (tag: string) => {
    setSelectedVibeTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag].slice(0, 8)
    )
  }

  useEffect(() => {
    if (preview?.niches) setNiches(preview.niches)
    if (preview?.clusters) setClusters(preview.clusters)
    if (preview?.niches && preview?.clusters) return
    let cancelled = false
    fetch('/api/tags', { credentials: 'include' })
      .then(res => (res.ok ? res.json() : []))
      .then(rows => {
        if (cancelled) return
        const list = Array.isArray(rows) ? rows : []
        if (!preview?.niches) setNiches(nichesFromTagRows(list))
        if (!preview?.clusters) setClusters(clustersFromTagRows(list))
      })
      .catch(() => {
        if (cancelled) return
        if (!preview?.niches) setNiches([])
        if (!preview?.clusters) setClusters([])
      })
    return () => { cancelled = true }
  }, [preview])

  function nicheLabel(id: string) {
    return nicheDisplayName(id, niches) || formatTagLabel(id)
  }

  function skipTags() {
    setSelectedConstellation('')
    setSelectedNiche('')
    setCustomNiches([])
    setSelectedVibeTags([])
    setNicheDraft('')
    setCloseHint(null)
    setError('')
    setStep('review')
  }

  function addCustomNiche() {
    const label = sanitizeCustomNiche(nicheDraft)
    if (!label) {
      setError('Enter a short category name.')
      return
    }
    const existing = matchExistingNiche(label, niches)
    if (existing) {
      setSelectedNiche(existing.id)
      setNicheDraft('')
      setCloseHint(null)
      setError('')
      return
    }
    const close = closeNicheMatches(label, niches)
    if (close[0]) {
      setCloseHint(close[0])
      setError('')
      return
    }
    if (customNiches.some(item => item.toLowerCase() === label.toLowerCase())) {
      setNicheDraft('')
      setCloseHint(null)
      setError('')
      return
    }
    if (customNiches.length >= CUSTOM_NICHE_MAX_COUNT) {
      setError(VTUBER_SUBMIT.customLimit)
      return
    }
    setCustomNiches(prev => [...prev, label])
    setNicheDraft('')
    setCloseHint(null)
    setError('')
  }

  useEffect(() => {
    if (preview) return
    const url = formData.link.trim()
    if (!user || !url || skippedLink) {
      setLookupLoading(false)
      return
    }
    if (url === lastLookupUrlRef.current) return

    let cancelled = false
    const handle = window.setTimeout(() => {
      lastLookupUrlRef.current = url
      setLookupLoading(true)
      setLookupMessage('')
      setDuplicate(null)

      fetch('/api/vtubers/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url }),
      })
        .then(async res => {
          const data = await res.json().catch(() => ({}))
          if (cancelled) return
          if (!res.ok) {
            if (res.status === 400) {
              setLookupMessage(typeof data.error === 'string' ? data.error : VTUBER_SUBMIT.pasteLink)
            } else if (res.status === 401) {
              setLookupMessage('You must be signed in to pull a profile.')
            } else {
              setLookupMessage(VTUBER_SUBMIT.lookupFailed)
            }
            return
          }
          setFormData(prev => {
            if (prev.link.trim() !== url) return prev
            return {
              ...prev,
              link: typeof data.link === 'string' && data.link ? data.link : prev.link,
              name: !touchedRef.current.name && data.name ? data.name : prev.name,
              handle: !touchedRef.current.handle && data.handle ? data.handle : prev.handle,
              platform: !touchedRef.current.platform && data.platform ? data.platform : prev.platform,
              bio: !touchedRef.current.bio ? (data.bio || '') : prev.bio,
            }
          })
          if (data.link && !cancelled) {
            lastLookupUrlRef.current = data.link
          }
          if (!avatarFile) {
            setLookupAvatar(typeof data.avatarUrl === 'string' && data.avatarUrl ? data.avatarUrl : null)
            setAvatarCleared(false)
          }
          setLookupMessage(typeof data.message === 'string' && data.message ? data.message : '')
          setDuplicate(data.duplicate && data.duplicate.status ? data.duplicate : null)
        })
        .catch(() => {
          if (!cancelled) setLookupMessage(VTUBER_SUBMIT.lookupFailed)
        })
        .finally(() => {
          if (!cancelled) setLookupLoading(false)
        })
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [formData.link, user, avatarFile, skippedLink, preview])

  function goTo(next: VtuberWizardStep) {
    setError('')
    setStep(next)
  }

  function goBack() {
    if (step === 'link' && !user) return goTo('signin')
    if (step === 'details') return goTo('link')
    if (step === 'tags') return goTo('details')
    if (step === 'review') return goTo('tags')
  }

  function canAdvanceFromLink() {
    if (lookupLoading) return false
    if (blockingDuplicate) return false
    if (skippedLink) return true
    const url = formData.link.trim()
    if (!url) return false
    if (lookupMessage === VTUBER_SUBMIT.pasteLink) return false
    return lastLookupUrlRef.current === url || lastLookupUrlRef.current === formData.link
  }

  function goNext() {
    if (step === 'link') {
      if (!canAdvanceFromLink()) {
        if (!formData.link.trim() && !skippedLink) setError('Paste a profile link, or enter the details by hand.')
        return
      }
      return goTo('details')
    }
    if (step === 'details') {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        setError('Name must be at least 2 characters')
        return
      }
      return goTo('tags')
    }
    if (step === 'tags') return goTo('review')
  }

  function skipLink() {
    setSkippedLink(true)
    setLookupLoading(false)
    setLookupMessage('')
    setDuplicate(null)
    setError('')
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (activeStep !== 'review') {
      goNext()
      return
    }
    if (!user) {
      setError('You must be signed in to submit')
      return
    }
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      goTo('details')
      return
    }
    if (blockingDuplicate) {
      setError(
        duplicate?.status === 'match' && duplicate.name
          ? VTUBER_SUBMIT.alreadyInVault(duplicate.name)
          : duplicate?.status === 'pending' && duplicate.name
            ? VTUBER_SUBMIT.alreadyNominated(duplicate.name)
            : VTUBER_SUBMIT.alreadyUnsure,
      )
      goTo('link')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      let avatarUrl: string | null = null

      if (avatarFile) {
        setUploading(true)
        const uploadBody = new FormData()
        uploadBody.append('file', avatarFile)
        const uploadRes = await fetch('/api/vtubers/avatar', {
          method: 'POST',
          credentials: 'include',
          body: uploadBody,
        })
        const uploadData = await uploadRes.json().catch(() => ({})) as { error?: string; url?: string }
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || "Couldn't upload the profile picture. You can submit without one, or try a different image.")
        }
        avatarUrl = uploadData.url
        setUploading(false)
      }

      const allTags = buildNominationTags({
        constellationId: selectedConstellation || null,
        nicheId: selectedNiche || null,
        vibeTags: selectedVibeTags,
        suggestions: customNiches,
      })

      const res = await fetch('/api/vtubers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          tags: allTags,
          avatar_url: avatarUrl,
          skip_avatar: !avatarFile && avatarCleared,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Submission failed')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        setFormData({ name: '', handle: '', platform: 'Twitch', link: '', bio: '' })
        setSelectedConstellation('')
        setSelectedNiche('')
        setCustomNiches([])
        setNicheDraft('')
        setCloseHint(null)
        setSelectedVibeTags([])
        setAvatarFile(null)
        setAvatarPreview(null)
        setLookupAvatar(null)
        setAvatarCleared(false)
        setLookupMessage('')
        setDuplicate(null)
        setSkippedLink(false)
        touchedRef.current = { name: false, handle: false, platform: false, bio: false }
        lastLookupUrlRef.current = ''
        setStep(user ? 'link' : 'signin')
        setSuccess(false)
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-14 w-14 text-vault-gold mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-vault-cream mb-2">{VTUBER_SUBMIT.submittedTitle}</h3>
        <p className="text-muted-foreground">{VTUBER_SUBMIT.submittedBody}</p>
      </div>
    )
  }

  const duplicateMessage = duplicate?.status === 'match' && duplicate.name
    ? VTUBER_SUBMIT.alreadyInVault(duplicate.name)
    : duplicate?.status === 'pending' && duplicate.name
      ? VTUBER_SUBMIT.alreadyNominated(duplicate.name)
      : duplicate?.status === 'unsure'
        ? VTUBER_SUBMIT.alreadyUnsure
        : ''

  const showBack = activeStep !== 'signin' && !(activeStep === 'link' && user)
  const showActions = showBack || !!onCancel || activeStep !== 'signin'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <nav aria-label="Nomination steps">
        <p className="text-xs text-muted-foreground mb-2">{VTUBER_SUBMIT.stepOf(stepIndex + 1, visibleSteps.length)}</p>
        <ol className="flex items-center gap-1" data-testid="wizard-steps">
          {visibleSteps.map((id, index) => {
            const current = id === activeStep
            const done = index < stepIndex
            return (
              <li key={id} className="flex flex-1 items-center gap-1 min-w-0">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    current
                      ? 'bg-vault-gold text-vault-deep'
                      : done
                        ? 'bg-vault-gold/30 text-vault-gold'
                        : 'border border-foreground/20 text-muted-foreground'
                  }`}
                  aria-current={current ? 'step' : undefined}
                >
                  {index + 1}
                </span>
                <span className={`truncate text-[11px] hidden sm:inline ${current ? 'text-vault-cream' : 'text-muted-foreground'}`}>
                  {VTUBER_SUBMIT.steps[id].title}
                </span>
                {index < visibleSteps.length - 1 && (
                  <span aria-hidden="true" className="hidden sm:block flex-1 h-px bg-white/15 mx-1" />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      <div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-semibold text-vault-cream outline-none"
        >
          {stepMeta.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{stepMeta.instruction}</p>
      </div>

      {activeStep === 'signin' && (
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href={loginHref(pathname)}>{VTUBER_SUBMIT.signIn}</Link>
          </Button>
        </div>
      )}

      {activeStep === 'link' && (
        <div>
          <Label htmlFor="link">{VTUBER_SUBMIT.pasteLink}</Label>
          <Input
            id="link"
            type="url"
            value={formData.link}
            onChange={(e) => handleInputChange('link', e.target.value)}
            placeholder={VTUBER_SUBMIT.linkPlaceholder}
            className="mt-2"
            autoComplete="off"
          />
          {lookupLoading && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2" aria-live="polite">
              <Loader2 className="h-3 w-3 animate-spin" />
              {VTUBER_SUBMIT.lookingUp}
            </p>
          )}
          {!lookupLoading && lookupMessage && (
            <p className="text-xs text-muted-foreground mt-2" aria-live="polite">{lookupMessage}</p>
          )}
          {!lookupLoading && duplicateMessage && (
            <p className="text-sm text-vault-gold mt-2" role="alert">
              {duplicateMessage}
              {duplicate?.status === 'match' && duplicate.id && (
                <>
                  {' '}
                  <Link href={`/vtuber/${duplicate.id}`} className="underline underline-offset-2">
                    Open dossier
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
      )}

      {activeStep === 'details' && (
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Profile Picture (optional)</Label>
            <div className="mt-2 flex items-center gap-4">
              {shownAvatar ? (
                <div className="relative">
                  <img src={shownAvatar} alt="Preview" className="h-20 w-20 rounded-xl object-cover border" />
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 bg-black rounded-full p-1"
                    aria-label="Remove picture"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="avatar-upload" className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border border-dashed hover:bg-muted/50">
                  <div className="text-center">
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1 block">Upload</span>
                  </div>
                </label>
              )}

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button type="button" variant="outline" size="sm">
                    Choose Image
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="VTuber name"
              />
            </div>
            <div>
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                value={formData.handle}
                onChange={(e) => handleInputChange('handle', e.target.value)}
                placeholder="@username"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="platform">Platform</Label>
            <select
              id="platform"
              value={formData.platform}
              onChange={(e) => handleInputChange('platform', e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="Twitch">Twitch</option>
              <option value="YouTube">YouTube</option>
              <option value="Twitter">Twitter</option>
              <option value="Twitch/YouTube">Twitch + YouTube</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="bio">Bio / Description</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Short description..."
              maxLength={300}
              rows={3}
            />
          </div>
        </div>
      )}

      {activeStep === 'tags' && (
        <div className="space-y-6">
          <div className="space-y-2">
            {niches.map((niche) => {
              const selected = selectedNiche === niche.id
              const color = safeTagColor(niche.color)
              return (
                <button
                  key={niche.id}
                  type="button"
                  onClick={() => setSelectedNiche(selected ? '' : niche.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition-all ${
                    selected ? 'bg-background' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  } ${color ? '' : selected ? 'border-vault-gold' : 'border-foreground/20'}`}
                  style={color ? { borderColor: color, borderWidth: selected ? 2 : 1 } : undefined}
                >
                  <span className="flex items-start gap-2.5">
                    {color ? (
                      <span
                        aria-hidden="true"
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border"
                        style={{
                          borderColor: color,
                          backgroundColor: selected ? color : 'transparent',
                        }}
                      />
                    ) : null}
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-foreground">{nicheLeadText(niche)}</span>
                      {niche.description ? (
                        <span className="block text-[11px] text-muted-foreground mt-0.5">{niche.name}</span>
                      ) : null}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div>
            <Label htmlFor="custom-niche">{VTUBER_SUBMIT.addCategory}</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="custom-niche"
                value={nicheDraft}
                onChange={(e) => {
                  setNicheDraft(e.target.value)
                  setCloseHint(null)
                }}
                maxLength={40}
                className="flex-1"
                autoComplete="off"
              />
              <Button type="button" variant="outline" onClick={addCustomNiche} className="border-border text-vault-cream shrink-0">
                {VTUBER_SUBMIT.addCategoryButton}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{VTUBER_SUBMIT.addCategoryHint}</p>
            {closeHint && (
              <p className="text-xs text-vault-gold mt-2">
                {VTUBER_SUBMIT.closeMatch(closeHint.name)}{' '}
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => {
                    setSelectedNiche(closeHint.id)
                    setNicheDraft('')
                    setCloseHint(null)
                  }}
                >
                  Use {closeHint.name}
                </button>
              </p>
            )}
            {customNiches.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {customNiches.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setCustomNiches(prev => prev.filter(item => item !== label))}
                    className="px-3 py-1.5 text-xs rounded-lg border border-vault-gold/40 text-vault-gold"
                  >
                    {formatTagLabel(label)}
                    <span className="ml-1 uppercase tracking-wide text-[10px] text-vault-gold/80">{VTUBER_SUBMIT.categoryNew}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>{VTUBER_SUBMIT.constellationLabel}</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {clusters.map((cluster) => (
                <button
                  key={cluster.id}
                  type="button"
                  onClick={() => setSelectedConstellation(selectedConstellation === cluster.id ? '' : cluster.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    selectedConstellation === cluster.id
                      ? 'bg-vault-gold/20 border-vault-gold text-vault-gold'
                      : 'border-foreground/20 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {cluster.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Vibe Tags (max 8)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {vibeTagOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleVibeTag(tag)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    selectedVibeTags.includes(tag)
                      ? 'bg-vault-gold text-vault-deep border-vault-gold'
                      : 'border-foreground/20 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {formatTagLabel(tag)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{selectedVibeTags.length}/8 selected</p>
          </div>
        </div>
      )}

      {activeStep === 'review' && (
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Link</dt>
            <dd className="text-vault-cream break-all">{formData.link || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="text-vault-cream">{formData.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Handle</dt>
            <dd className="text-vault-cream">{formData.handle || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Platform</dt>
            <dd className="text-vault-cream">{formData.platform || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Bio</dt>
            <dd className="text-vault-cream whitespace-pre-wrap">{formData.bio || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Picture</dt>
            <dd className="mt-1">
              {shownAvatar ? (
                <img src={shownAvatar} alt="" className="h-16 w-16 rounded-xl object-cover border" />
              ) : (
                <span className="text-vault-cream">None</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{VTUBER_SUBMIT.reviewNiche}</dt>
            <dd className="text-vault-cream">
              {selectedNiche ? (
                <>
                  {(() => {
                    const option = niches.find(item => item.id === selectedNiche)
                    return option ? (
                      <>
                        <span className="block">{nicheLeadText(option)}</span>
                        {option.description ? (
                          <span className="block text-xs text-muted-foreground mt-0.5">{option.name}</span>
                        ) : null}
                      </>
                    ) : nicheLabel(selectedNiche)
                  })()}
                </>
              ) : VTUBER_SUBMIT.noNiche}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{VTUBER_SUBMIT.reviewConstellation}</dt>
            <dd className="text-vault-cream">{selectedConstellation ? nicheDisplayName(selectedConstellation, clusters) || formatTagLabel(selectedConstellation) : '—'}</dd>
          </div>
          {customNiches.length > 0 && (
            <div>
              <dt className="text-muted-foreground">{VTUBER_SUBMIT.reviewNewCategories}</dt>
              <dd className="text-vault-cream">{customNiches.map(label => `${formatTagLabel(label)} (${VTUBER_SUBMIT.categoryNew})`).join(', ')}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Vibe tags</dt>
            <dd className="text-vault-cream">{selectedVibeTags.length ? selectedVibeTags.map(formatTagLabel).join(', ') : '—'}</dd>
          </div>
        </dl>
      )}

      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

      {showActions && (
      <div className="sticky bottom-20 sm:bottom-0 -mx-1 flex flex-col-reverse sm:flex-row gap-3 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] border-t border-border bg-background/95 backdrop-blur-sm">
        {showBack && (
          <Button type="button" variant="outline" onClick={goBack} className="border-border text-vault-cream sm:w-auto w-full">
            {VTUBER_SUBMIT.back}
          </Button>
        )}
        {onCancel && activeStep === 'signin' && (
          <Button type="button" variant="outline" onClick={onCancel} className="border-border text-vault-cream">
            Cancel
          </Button>
        )}
        {onCancel && activeStep === 'link' && !!user && (
          <Button type="button" variant="outline" onClick={onCancel} className="border-border text-vault-cream sm:w-auto w-full">
            Cancel
          </Button>
        )}
        {activeStep === 'link' && (
          <Button type="button" variant="outline" onClick={skipLink} className="border-border text-vault-cream sm:w-auto w-full">
            {VTUBER_SUBMIT.skipLink}
          </Button>
        )}
        {activeStep === 'tags' && (
          <Button type="button" variant="outline" onClick={skipTags} className="border-border text-vault-cream sm:w-auto w-full">
            {VTUBER_SUBMIT.skipTags}
          </Button>
        )}
        {activeStep === 'link' || activeStep === 'details' || activeStep === 'tags' ? (
          <Button
            type="submit"
            className="flex-1"
            disabled={activeStep === 'link' && (lookupLoading || blockingDuplicate)}
          >
            {VTUBER_SUBMIT.next}
          </Button>
        ) : null}
        {activeStep === 'review' && (
          <Button type="submit" className="flex-1" disabled={submitting || uploading}>
            {uploading ? 'Uploading image...' : submitting ? 'Submitting...' : 'Submit for Review'}
            {(submitting || uploading) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        )}
      </div>
      )}

      {activeStep === 'review' && (
        <p className="text-xs text-center text-muted-foreground">
          {VTUBER_SUBMIT.reviewedBeforeMaps}
        </p>
      )}
    </form>
  )
}
