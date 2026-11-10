'use client'

import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DOSSIER } from '@/lib/site-copy'
import styles from './dossier-folio.module.css'

export interface DossierArt {
  id: string
  image_url: string | null
  twitter_url: string | null
  submitted_by: string | null
}

/** Gallery data follows the existing /api/fan-art public, unreported feed. */
export function DossierArtSheet({ art, unavailable, vtuberId }: { art: DossierArt[]; unavailable: boolean; vtuberId: string }) {
  return (
    <>
      <div className={styles.binderClip} aria-hidden="true"><span /><span /></div>
      <div className={styles.sheetHeading}>
        <h2 className="section-label text-case-teal">{DOSSIER.artTitle}</h2>
        <Link href={`/fan-art?vtuber=${encodeURIComponent(vtuberId)}`} className={styles.textLink}>{DOSSIER.artAll}</Link>
      </div>
      {art.length === 0 ? <p className={styles.empty}>{unavailable ? DOSSIER.artUnavailable : DOSSIER.artEmpty}</p> : (
        <div className={styles.gallery}>
          {art.map((piece, index) => (
            <article key={piece.id} className={styles.artStudy}>
              {piece.image_url ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button type="button" className={styles.artExpand} aria-label={`${DOSSIER.artExpand} ${index + 1}`}>
                      <img src={piece.image_url} alt={DOSSIER.artImage} loading="lazy" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-case-paper-1 text-case-ink sm:max-w-3xl max-h-[90dvh] overflow-y-auto motion-reduce:animate-none motion-reduce:transition-none">
                    <DialogTitle>{DOSSIER.artImage}</DialogTitle>
                    <DialogDescription className="text-case-ink-dim">{piece.submitted_by ? `${DOSSIER.submittedBy} ${piece.submitted_by}` : DOSSIER.artTitle}</DialogDescription>
                    <img src={piece.image_url} alt={DOSSIER.artImage} className="max-h-[65dvh] w-full object-contain" />
                    {piece.twitter_url && <a href={piece.twitter_url} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{DOSSIER.artSource} ↗</a>}
                  </DialogContent>
                </Dialog>
              ) : null}
              <div className={styles.artCredit}>
                {piece.submitted_by && <span>{DOSSIER.submittedBy} {piece.submitted_by}</span>}
                {piece.twitter_url && <a href={piece.twitter_url} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{DOSSIER.artSource} ↗</a>}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
