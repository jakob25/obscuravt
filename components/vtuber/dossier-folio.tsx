'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { CaseFolder, CasePhoto, DossierFrame } from '@/components/vault/vault-surfaces'
import { DOSSIER } from '@/lib/site-copy'
import styles from './dossier-folio.module.css'

type Tab = string
type Turn = { from: Tab; to: Tab; backward: boolean }
type Swipe = { x: number; y: number; time: number; id: number; horizontal: boolean; surface: HTMLElement }
const narrowQuery = '(max-width: 800px)'

interface Props {
  name: string
  caseId: string
  accessLine: string
  avatarUrl: string | null
  handle: string
  platform: string
  cluster?: string | null
  collective?: string | null
  snapshot?: string | null
  profile: ReactNode
  /** The niche-specific page (e.g. World), when this creator's niche has one
   * and there is real content for it. Omitted or null means no such page. */
  nichePage?: NichePage | null
  /** @deprecated Shorthand for nichePage with key 'world'. */
  world?: ReactNode
  clips: ReactNode
  art: ReactNode
}

export interface NichePage { key: string; label: string; content: ReactNode }

/** A warm cover, a stationary desktop profile, and mobile swipe sheets:
 * Profile, an optional niche page, Clips and Art.
 * Every real action/content instance stays mounted once, including while turning.
 */
export function DossierFolio({ name, caseId, accessLine, avatarUrl, handle, platform, cluster, collective, snapshot, profile, nichePage, world, clips, art }: Props) {
  const [open, setOpen] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const extra = nichePage ?? (world != null ? { key: 'world', label: DOSSIER.world, content: world } : null)
  const pages = [
    { key: 'profile', label: DOSSIER.profile, content: profile },
    ...(extra ? [extra] : []),
    { key: 'clips', label: DOSSIER.clips, content: clips },
    { key: 'art', label: DOSSIER.art, content: art },
  ]
  const tabs = pages.map(page => page.key)
  // The first page beside the stationary desktop profile.
  const firstSheet = tabs[1]
  const [tab, setTab] = useState<Tab>(firstSheet)
  const [turn, setTurn] = useState<Turn | null>(null)
  const id = useId()
  const openButton = useRef<HTMLButtonElement>(null)
  const tabButtons = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  const hasOpened = useRef(false)
  const swipe = useRef<Swipe | null>(null)
  const suppressClickUntil = useRef(0)
  const panelRefs = useRef<Partial<Record<Tab, HTMLElement | null>>>({})
  const scrollNextPage = useRef(false)
  const available = narrow ? tabs : tabs.slice(1)

  useEffect(() => {
    const media = window.matchMedia(narrowQuery)
    const update = () => {
      setNarrow(media.matches)
      setTurn(null)
      swipe.current = null
      if (!media.matches) {
        setTab(current => current === 'profile' ? firstSheet : current)
        if (document.activeElement === tabButtons.current.profile) tabButtons.current[firstSheet]?.focus({ preventScroll: true })
      }
    }
    update()
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const stopMotion = () => { if (motion.matches) setTurn(null) }
    media.addEventListener('change', update)
    motion.addEventListener('change', stopMotion)
    return () => { media.removeEventListener('change', update); motion.removeEventListener('change', stopMotion) }
  }, [firstSheet])

  useEffect(() => {
    if (open) {
      hasOpened.current = true
      tabButtons.current[window.matchMedia(narrowQuery).matches ? 'profile' : firstSheet]?.focus({ preventScroll: true })
    } else if (hasOpened.current) {
      openButton.current?.focus({ preventScroll: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus only when opening or closing
  }, [open])

  useEffect(() => {
    if (!turn) return
    // Also clear if a browser drops animationend or motion is changed mid-turn.
    const timer = window.setTimeout(() => setTurn(null), 720)
    return () => window.clearTimeout(timer)
  }, [turn])

  useEffect(() => {
    if (!scrollNextPage.current) return
    scrollNextPage.current = false
    panelRefs.current[tab]?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [tab])

  function choose(next: Tab) {
    if (!open || turn || next === tab || (!narrow && next === 'profile')) return
    swipe.current = null
    if (narrow && (panelRefs.current[tab]?.getBoundingClientRect().top ?? 0) < 0) scrollNextPage.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTurn(reduced ? null : { from: tab, to: next, backward: tabs.indexOf(next) < tabs.indexOf(tab) })
    setTab(next)
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, current: Tab) {
    const index = available.indexOf(current)
    let next: Tab
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': next = available[(index + 1) % available.length]; break
      case 'ArrowLeft':
      case 'ArrowUp': next = available[(index + available.length - 1) % available.length]; break
      case 'Home': next = available[0]; break
      case 'End': next = available[available.length - 1]; break
      default: return
    }
    event.preventDefault()
    if (turn) return
    choose(next)
    tabButtons.current[next]?.focus()
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    // A new physical tap must never inherit suppression from a prior swipe.
    suppressClickUntil.current = 0
    const target = event.target instanceof Element ? event.target : null
    const surface = target?.closest<HTMLElement>('[data-swipe-page]')
    if (!open || !narrow || turn || !event.isPrimary || event.pointerType === 'mouse' || !surface || target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[data-no-swipe],[role="dialog"]')) {
      swipe.current = null
      return
    }
    swipe.current = { x: event.clientX, y: event.clientY, time: Date.now(), id: event.pointerId, horizontal: false, surface }
  }

  function moveSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current
    if (!start || start.id !== event.pointerId) return
    const dx = Math.abs(event.clientX - start.x)
    const dy = Math.abs(event.clientY - start.y)
    if (!start.horizontal && dy > 12 && dy > dx) { swipe.current = null; return }
    if (!start.horizontal && dx > 14 && dx > dy * 1.5) {
      start.horizontal = true
      // Do not capture until horizontal intent is established; normal scrolling
      // and taps (including links and artwork triggers) retain native behavior.
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current
    swipe.current = null
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const threshold = Math.min(80, Math.max(44, start.surface.clientWidth * .15))
    if (!start.horizontal || Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - start.time > 1800) return
    // A deliberate swipe must not activate the link/button beneath the finger.
    suppressClickUntil.current = Date.now() + 400
    const next = tabs.indexOf(tab) + (dx < 0 ? 1 : -1)
    if (next >= 0 && next < tabs.length) choose(tabs[next])
  }

  const index = tabs.indexOf(tab)
  const first = narrow ? 0 : 1

  return (
    <div className={styles.stage}>
      <div className={`${styles.book} ${open ? styles.open : ''}`} data-dossier-state={open ? 'open' : 'closed'} onPointerDown={startSwipe} onPointerMove={moveSwipe} onPointerUp={endSwipe} onPointerCancel={() => { swipe.current = null }} onLostPointerCapture={() => { swipe.current = null }} onClickCapture={event => {
        if (event.detail > 0 && Date.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation() }
      }}>
        <button ref={openButton} type="button" className={styles.warmCover} aria-label={`${DOSSIER.open}: ${name}`} aria-expanded={open} aria-controls={tabs.map(key => `${id}-${key}-panel`).join(' ')} aria-hidden={open} inert={open} tabIndex={open ? -1 : 0} onClick={() => {
          const mobile = window.matchMedia(narrowQuery).matches
          setNarrow(mobile)
          setTab(mobile ? 'profile' : firstSheet)
          setOpen(true)
        }}>
          <span className={styles.coverTab}>{DOSSIER.archiveTab}</span>
          <div className={styles.coverTop}>
            <div className={styles.coverLabel}>{DOSSIER.subjectArchive}</div>
            <div className={styles.coverHero}>
              <div><span className={styles.smallLabel}>{DOSSIER.codename}</span><h2>{name}</h2></div>
              <div className={styles.coverPhoto}><CasePhoto src={avatarUrl} alt={name} caption="FIG. 01 — SUBJECT" /></div>
            </div>
            <div className={styles.coverFile}>{caseId}{collective ? ` / ${collective}` : ''}</div>
          </div>
          <div className={styles.coverSnapshot}>
            <dl className={styles.coverIndex}>
              <div><dt>{DOSSIER.handle}</dt><dd>{handle || '—'}</dd></div>
              <div><dt>{DOSSIER.filedUnder}</dt><dd>{cluster || '—'}</dd></div>
              <div><dt>{DOSSIER.platform}</dt><dd>{platform || '—'}</dd></div>
              <div><dt>{DOSSIER.partOf}</dt><dd>{collective || '—'}</dd></div>
            </dl>
            <div className={styles.coverBrief}><span className={styles.smallLabel}>{DOSSIER.snapshot}</span><p>{snapshot || DOSSIER.noSnapshot}</p></div>
          </div>
          <span className={styles.coverStamp}>{DOSSIER.onRecord}</span>
          <span className={styles.openInstruction}><span>{DOSSIER.open}</span><span aria-hidden="true">↗</span></span>
        </button>

        <div id={`${id}-pages`} className={styles.controls} hidden={!open} inert={!open}>
          <div className={styles.tabs} role="tablist" aria-label={DOSSIER.pages}>
            {pages.map(({ key, label }) => (
              <button key={key} type="button" role="tab" className={key === 'profile' ? styles.mobileTab : undefined} id={`${id}-${key}-tab`} aria-controls={`${id}-${key}-panel`} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} ref={node => { tabButtons.current[key] = node }} aria-disabled={Boolean(turn)} onClick={() => choose(key)} onKeyDown={event => navigate(event, key)}>{label}</button>
            ))}
          </div>
          <button type="button" className={styles.close} aria-label={DOSSIER.close} onClick={() => { setOpen(false); setTurn(null); swipe.current = null }}>×</button>
          <p className={styles.swipeHint}>{DOSSIER.swipeHint}</p>
        </div>

        {pages.map(({ key, label, content }) => {
          const stationary = key === 'profile' && !narrow
          const active = stationary || tab === key
          const visible = active || turn?.from === key
          const animated = turn && (turn.backward ? turn.to === key : turn.from === key) && !stationary
          return (
            <section key={key} ref={node => { panelRefs.current[key] = node }} id={`${id}-${key}-panel`} data-swipe-page={key} data-turn-direction={animated ? (turn.backward ? 'backward' : 'forward') : undefined} role={stationary ? 'region' : 'tabpanel'} aria-label={stationary ? DOSSIER.profile : undefined} aria-labelledby={stationary ? undefined : `${id}-${key}-tab`} tabIndex={stationary ? undefined : 0} hidden={!open || !visible} aria-hidden={!open || !active} inert={!open || !active} aria-busy={Boolean(turn) && !stationary} className={`${styles.sheet} ${key === 'profile' ? styles.profilePanel : ''} ${animated ? `${styles.turning} ${turn.backward ? styles.backward : ''}` : ''}`} onAnimationEnd={event => { if (event.target === event.currentTarget) setTurn(null) }}>
              <DossierFrame caseId={caseId} accessLine={accessLine}>
                <CaseFolder className={`${key === 'profile' ? styles.profilePaper : styles.paper} ${key === 'art' ? styles.artPaper : ''}`}>
                  {content}
                  <footer className={`${styles.pageBottom} ${key === 'profile' ? styles.profileNavigation : ''}`} data-no-swipe>
                    <span>{String(tabs.indexOf(key) + 1).padStart(2, '0')} / {String(tabs.length).padStart(2, '0')} · {label}</span>
                    <div className={styles.pageNavigation}>
                      <button type="button" disabled={Boolean(turn) || index <= first} onClick={() => choose(tabs[index - 1])}>{DOSSIER.previous}</button>
                      <button type="button" disabled={Boolean(turn) || index === tabs.length - 1} onClick={() => choose(tabs[index + 1])}>{DOSSIER.next}</button>
                    </div>
                  </footer>
                </CaseFolder>
              </DossierFrame>
            </section>
          )
        })}
      </div>
    </div>
  )
}
