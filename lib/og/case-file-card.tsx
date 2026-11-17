import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

/**
 * Shared "case file" share card (1200×630) for Open Graph / Twitter previews.
 * Vault colours and fonts from globals.css; a static grain + scanline backdrop only —
 * the site's animated glitch styling is not touched or reproduced here.
 * Every route passes real data; nothing here invents text.
 */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const DEEP = '#0d0d14'
const GOLD = '#d4a843'
const BRONZE = '#8b6914'
const CREAM = '#f0e8d0'
const MUTED = '#a8a39a'
const RED = '#c0392b'

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 400; style: 'normal' }[]> | null = null
function loadFonts() {
  // OTF copies of the site's own woff2 fonts (public/fonts); the OG renderer can't read woff2.
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), 'assets/og-fonts/archive-stamp.otf')),
    readFile(join(process.cwd(), 'assets/og-fonts/govt-agent-bb.otf')),
  ])
    .then(([stamp, govt]) => [
      { name: 'Archive Stamp', data: stamp, weight: 400 as const, style: 'normal' as const },
      { name: 'Govt Agent BB', data: govt, weight: 400 as const, style: 'normal' as const },
    ])
    .catch(() => [])
  return fontsPromise
}

export interface CaseFileCardProps {
  /** Top-left stamp, e.g. "FILE ON RECORD". */
  stamp: string
  /** Big title line. */
  title: string
  /** Optional small line above the title (e.g. "CODENAME:"). */
  kicker?: string | null
  /** Lines under the title. Empty/undefined entries are skipped. */
  lines?: (string | null | undefined)[]
  /** Top-right corner badge, e.g. "● CLAIMED FILE". */
  corner?: string | null
  /** Optional square picture (already host-allowlisted by the caller). */
  avatarUrl?: string | null
  /** Footer, defaults to "obscuravt.com · Subject Archive". */
  footer?: string
}

function titleSize(title: string): number {
  if (title.length > 34) return 52
  if (title.length > 22) return 64
  if (title.length > 14) return 80
  return 96
}

export function caseFileElement({ stamp, title, kicker, lines = [], corner, avatarUrl, footer }: CaseFileCardProps) {
  const shown = lines.filter((l): l is string => !!l && !!l.trim())
  return (
    <div
      style={{
        width: '100%', height: '100%', display: 'flex', position: 'relative', background: DEEP, padding: 40,
        backgroundImage: `radial-gradient(circle at 20% 15%, ${GOLD}22 0%, transparent 45%), radial-gradient(circle at 85% 90%, ${BRONZE}33 0%, transparent 50%)`,
      }}
    >
      {/* scanlines (static) */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 4px)' }} />
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: 18,
          border: `2px solid ${GOLD}88`, background: '#12121c', padding: '36px 48px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', fontFamily: 'Archive Stamp', fontSize: 34, color: RED, border: `4px solid ${RED}`, padding: '6px 18px', transform: 'rotate(-3deg)', letterSpacing: 2 }}>
            {stamp}
          </div>
          {corner ? (
            <div style={{ display: 'flex', fontFamily: 'Govt Agent BB', fontSize: 24, color: corner.includes('UNCLAIMED') ? MUTED : GOLD, letterSpacing: 2 }}>
              {corner}
            </div>
          ) : null}
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 40 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" width={200} height={200} style={{ borderRadius: 16, border: `3px solid ${GOLD}`, objectFit: 'cover' }} />
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            {kicker ? <div style={{ display: 'flex', fontFamily: 'Govt Agent BB', fontSize: 28, color: GOLD, letterSpacing: 3 }}>{kicker}</div> : null}
            <div style={{ display: 'flex', fontFamily: 'Govt Agent BB', fontSize: titleSize(title), color: CREAM, lineHeight: 1.05, marginTop: 6 }}>{title}</div>
            {shown.map((l, i) => (
              <div key={i} style={{ display: 'flex', fontFamily: 'Govt Agent BB', fontSize: 28, color: i === 0 ? CREAM : MUTED, marginTop: i === 0 ? 22 : 8, letterSpacing: 1 }}>{l}</div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${GOLD}55`, paddingTop: 14, fontFamily: 'Govt Agent BB', fontSize: 22, color: MUTED, letterSpacing: 2 }}>
          <span>{footer ?? 'obscuravt.com · Subject Archive'}</span>
          <span style={{ color: GOLD }}>ObscuraVT</span>
        </div>
      </div>
    </div>
  )
}

export async function caseFileImage(props: CaseFileCardProps) {
  const fonts = await loadFonts()
  return new ImageResponse(caseFileElement(props), { ...OG_SIZE, fonts })
}
