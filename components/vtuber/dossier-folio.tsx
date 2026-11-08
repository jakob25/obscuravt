'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { CaseField, CaseFolder, CasePhoto, DossierFrame } from '@/components/vault/vault-surfaces'
import { DOSSIER } from '@/lib/site-copy'
import styles from './dossier-folio.module.css'

const tabs = ['world', 'clips', 'art'] as const
type Tab = typeof tabs[number]

interface Props {
  name: string
  caseId: string
  accessLine: string
  avatarUrl: string | null
  handle: string
  platform: string
  profile: ReactNode
  world: ReactNode
  clips: ReactNode
  art: ReactNode
}

/** Only the physical folder and its independent sheets own client state.
 * Real profile content remains server-composed and is mounted exactly once.
 */
export function DossierFolio({ name, caseId, accessLine, avatarUrl, handle, platform, profile, world, clips, art }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('world')
  const [departing, setDeparting] = useState<Tab | null>(null)
  const id = useId()
  const openButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const tabButtons = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  const hasOpened = useRef(false)
  const sheets = { world, clips, art }

  useEffect(() => {
    if (open) {
      hasOpened.current = true
      closeButton.current?.focus({ preventScroll: true })
    } else if (hasOpened.current) {
      openButton.current?.focus({ preventScroll: true })
    }
  }, [open])

  function choose(next: Tab) {
    if (next === tab) return
    setDeparting(tab)
    setTab(next)
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, current: Tab) {
    const index = tabs.indexOf(current)
    let next: Tab
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': next = tabs[(index + 1) % tabs.length]; break
      case 'ArrowLeft':
      case 'ArrowUp': next = tabs[(index + tabs.length - 1) % tabs.length]; break
      case 'Home': next = tabs[0]; break
      case 'End': next = tabs[tabs.length - 1]; break
      default: return
    }
    event.preventDefault()
    choose(next)
    tabButtons.current[next]?.focus()
  }

  return (
    <div className={styles.stage}>
      <div className={`${styles.book} ${open ? styles.open : ''}`} data-dossier-state={open ? 'open' : 'closed'}>
        <div className={styles.cover}>
          <div className={`${styles.face} ${styles.front}`} aria-hidden={!open} inert={!open}>
            <button ref={closeButton} type="button" className={styles.close} aria-label={DOSSIER.close} aria-expanded={open} aria-controls={`${id}-sheets`} onClick={() => { setOpen(false); setDeparting(null) }}>×</button>
            {profile}
          </div>
          <div className={`${styles.face} ${styles.back}`} aria-hidden={open} inert={open}>
            <DossierFrame caseId={caseId} accessLine={accessLine}>
              <CaseFolder className={styles.closedPaper}>
                <CasePhoto src={avatarUrl} alt={name} caption="FIG. 1 — SUBJECT" size="lg" />
                <div className={styles.coverFields}>
                  <CaseField label="CODENAME" value={name} />
                  <CaseField label="HANDLE" value={handle || undefined} />
                  <CaseField label="PLATFORM" value={platform || undefined} />
                </div>
              </CaseFolder>
            </DossierFrame>
            <button ref={openButton} type="button" className={styles.openCover} aria-label={`${DOSSIER.open}: ${name}`} aria-expanded={open} aria-controls={`${id}-sheets`} onClick={() => setOpen(true)}>
              <span>{DOSSIER.open} →</span>
            </button>
          </div>
        </div>

        <div id={`${id}-sheets`} className={styles.leaves} aria-hidden={!open} inert={!open}>
          <div className={styles.tabs} role="tablist" aria-label={DOSSIER.pages}>
            {tabs.map(key => (
              <button key={key} type="button" role="tab" id={`${id}-${key}-tab`} aria-controls={`${id}-${key}-panel`} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} ref={node => { tabButtons.current[key] = node }} onClick={() => choose(key)} onKeyDown={event => navigate(event, key)}>
                {DOSSIER[key]}
              </button>
            ))}
          </div>
          {tabs.map(key => (
            <div key={key} id={`${id}-${key}-panel`} role="tabpanel" aria-labelledby={`${id}-${key}-tab`} tabIndex={0} hidden={tab !== key && departing !== key} aria-hidden={tab !== key} inert={tab !== key} className={`${styles.sheet} ${departing === key ? styles.turning : ''}`} onAnimationEnd={event => { if (event.target === event.currentTarget) setDeparting(current => current === key ? null : current) }}>
              <DossierFrame caseId={caseId} accessLine={accessLine}>
                <CaseFolder className={`${styles.paper} ${key === 'art' ? styles.artPaper : ''}`}>
                  {sheets[key]}
                </CaseFolder>
              </DossierFrame>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
