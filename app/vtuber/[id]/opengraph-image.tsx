import { ImageResponse } from 'next/og'
import { getShareProfile } from '@/lib/vtuber-share-meta'
import { ALLOWED_HOSTS, isAllowedHttpsUrl } from '@/lib/safe-fetch'

export const alt = 'ObscuraVT creator profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 86400

const GOLD = '#d4a843'
const CREAM = '#f1e9d2'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getShareProfile(id)
  const name = profile?.name ? String(profile.name) : 'ObscuraVT'
  const rawAvatar = profile?.avatar_url ? String(profile.avatar_url).trim() : ''
  // Only load a picture from an already-allowed Twitch/YouTube host; otherwise text-only.
  const avatar = rawAvatar && isAllowedHttpsUrl(rawAvatar, ALLOWED_HOSTS.avatar) ? rawAvatar : null

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d14 60%)', padding: 56 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px solid ${GOLD}99`, borderRadius: 24, background: '#0f0f18' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} width={180} height={180} style={{ borderRadius: 32, border: `3px solid ${GOLD}`, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 160, height: 160, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, #e0b84a, #8a6a1c)`, color: '#111', fontSize: 96, fontWeight: 700 }}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ display: 'flex', fontSize: name.length > 18 ? 64 : 88, fontWeight: 700, color: CREAM, maxWidth: 760 }}>{name}</div>
          </div>
          <div style={{ display: 'flex', marginTop: 48, fontSize: 40, fontWeight: 700, color: CREAM }}>
            on Obscura<span style={{ color: GOLD }}>VT</span>
          </div>
          <div style={{ display: 'flex', marginTop: 56, fontSize: 24, color: '#a8a39a' }}>obscuravt.com</div>
        </div>
      </div>
    ),
    size,
  )
}
