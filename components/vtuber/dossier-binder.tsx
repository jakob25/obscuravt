'use client'

import { useEffect, useState } from 'react'

export interface BinderClip {
  id: string
  title: string
  clip_url: string | null
  thumbnail_url?: string | null
}

export interface BinderArt {
  id: string
  image_url: string | null
  twitter_url: string | null
}

interface Props {
  name: string
  bio: string | null
  avatarUrl: string | null
  clips: BinderClip[]
  art: BinderArt[]
}

export function DossierBinder({ name, bio, avatarUrl, clips, art }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- open after first paint; reduced-motion skips the delayed animation
      setOpen(true)
      return
    }
    const t = window.setTimeout(() => setOpen(true), 120)
    return () => window.clearTimeout(t)
  }, [])

  const bottom = clips.slice(0, 2)
  const scraps = [
    ...clips.slice(0, 3).map(c => ({ key: c.id, src: c.thumbnail_url, href: c.clip_url, alt: c.title })),
    ...art.slice(0, 2).map(a => ({ key: a.id, src: a.image_url, href: a.twitter_url, alt: 'fan art' })),
  ].filter(s => s.src)

  return (
    <div className="binder-spread mb-8">
      <div className={`binder-page binder-page-open ${open ? 'is-open' : ''}`}>
        <div className="binder-face">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} />
          ) : (
            <span>{name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="binder-lines">
          <div className="binder-line binder-line-name">{name}</div>
          <div className="binder-line binder-line-short" />
          <div className="binder-line binder-line-bio">{bio || 'No field notes on file.'}</div>
          <div className="binder-line binder-line-bio-2" />
        </div>
        <div className="binder-slots">
          {bottom.length === 0 ? (
            <>
              <div className="binder-slot binder-slot-empty">No clips on file</div>
              <div className="binder-slot binder-slot-empty" />
            </>
          ) : (
            bottom.map(c => (
              <a
                key={c.id}
                href={c.clip_url || '/clips'}
                target={c.clip_url ? '_blank' : undefined}
                rel={c.clip_url ? 'noopener noreferrer' : undefined}
                className="binder-slot"
              >
                {c.thumbnail_url && <img src={c.thumbnail_url} alt="" />}
                <span>{c.title}</span>
              </a>
            ))
          )}
        </div>
      </div>

      <div className="binder-page binder-page-scraps">
        <div className="binder-clip" aria-hidden>
          <span />
          <span />
        </div>
        <div className="binder-scraps">
          {scraps.length === 0 ? (
            <div className="binder-scrap binder-scrap-empty">Nothing pinned</div>
          ) : (
            scraps.map((s, i) => (
              <a
                key={s.key}
                href={s.href || '/clips'}
                target={s.href ? '_blank' : undefined}
                rel={s.href ? 'noopener noreferrer' : undefined}
                className={`binder-scrap binder-scrap-${i % 3}`}
              >
                <img src={s.src!} alt={s.alt} />
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
