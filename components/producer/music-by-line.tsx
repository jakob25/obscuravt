import Link from 'next/link'
import styles from '@/components/vtuber/dossier-folio.module.css'
import { PRODUCERS } from '@/lib/site-copy'

/**
 * "Music by" line for a VTuber file, rendered by the vtuber page (not the frozen
 * dossier components) into the profile slot. Shows only real credits; renders
 * nothing when there are none. `studioDoor` adds the link into The Booth for
 * creators filed in The Studio niche (a door only, not a niche or map entry).
 */
export function MusicByLine({ producers, studioDoor = false }: { producers: { id: string; name: string }[]; studioDoor?: boolean }) {
  if (producers.length === 0 && !studioDoor) return null
  return (
    <div className="font-mono text-[12px] text-[var(--case-ink)] space-y-1" data-music-by>
      {producers.length > 0 && (
        <p>
          <span className="text-[10px] uppercase tracking-[0.1em] text-case-teal">{PRODUCERS.musicBy}</span>{' '}
          {producers.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ', '}
              <Link href={`/producer/${encodeURIComponent(p.id)}`} className={styles.textLink}>{p.name}</Link>
            </span>
          ))}
        </p>
      )}
      {studioDoor && (
        <p><Link href="/producers" className={styles.textLink}>{PRODUCERS.studioDoor}</Link></p>
      )}
    </div>
  )
}
