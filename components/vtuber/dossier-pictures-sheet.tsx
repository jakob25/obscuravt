'use client'

import { useEffect, useRef, useState } from 'react'
import { DOSSIER } from '@/lib/site-copy'
import styles from './dossier-folio.module.css'

const WIDGETS_SRC = 'https://platform.twitter.com/widgets.js'

export interface DossierPicture {
  id: string
  post_url: string
}

function ensureTwitterWidgets() {
  if (typeof document === 'undefined') return
  const existing = document.querySelector(`script[src="${WIDGETS_SRC}"]`)
  if (existing) {
    const widgets = (window as Window & { twttr?: { widgets?: { load?: () => void } } }).twttr?.widgets
    widgets?.load?.()
    return
  }
  const script = document.createElement('script')
  script.src = WIDGETS_SRC
  script.async = true
  script.setAttribute('charset', 'utf-8')
  document.body.appendChild(script)
}

/** Embedded X photo posts. The widgets script loads only after this page is visible. */
export function DossierPicturesSheet({ posts }: { posts: DossierPicture[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return
    const node = rootRef.current
    if (!node || typeof IntersectionObserver !== 'function') return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setVisible(true)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  useEffect(() => {
    if (visible) ensureTwitterWidgets()
  }, [visible])

  return (
    <div ref={rootRef}>
      <div className={styles.binderClip} aria-hidden="true"><span /><span /></div>
      <div className={styles.sheetHeading}>
        <h2 className="section-label text-[#1f6f6a]">{DOSSIER.pictures}</h2>
      </div>
      <div className={styles.pictureList}>
        {posts.map(post => (
          <article key={post.id} className={styles.picturePost} data-no-swipe>
            <blockquote className="twitter-tweet" data-no-swipe>
              <a href={post.post_url} target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                {DOSSIER.picturesOpen}
              </a>
            </blockquote>
          </article>
        ))}
      </div>
    </div>
  )
}
