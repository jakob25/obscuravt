/**
 * Copy a looked-up profile picture into vtuber-avatars.
 * The image URL always comes from a fresh server-side lookup of the
 * submitted profile link — never from a client-supplied address.
 */
import { randomBytes } from 'crypto'
import { ALLOWED_HOSTS, isAllowedHttpsUrl, safeFetchFollow } from '@/lib/safe-fetch'
import { lookupVtuberProfile } from '@/lib/vtuber-profile-lookup'
import { supabaseAdmin } from '@/lib/supabase'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const BUCKET = 'vtuber-avatars'
const COPY_TIMEOUT_MS = 8_000

function safeUsername(username: string) {
  return username.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'user'
}

export function isStoredVtuberAvatarUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!base) return false
  try {
    const allowed = new URL(base)
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    if (u.hostname.toLowerCase() !== allowed.hostname.toLowerCase()) return false
    if (u.username || u.password || u.port) return false
    return u.pathname.includes('/storage/v1/object/public/vtuber-avatars/')
  } catch {
    return false
  }
}

function sniffType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif'
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp'
  return null
}

async function downloadAllowlistedAvatar(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!isAllowedHttpsUrl(url, ALLOWED_HOSTS.avatar)) return null
  const res = await safeFetchFollow(
    url,
    ALLOWED_HOSTS.avatar,
    { signal: AbortSignal.timeout(COPY_TIMEOUT_MS), cache: 'no-store' },
  )
  if (!res || !res.ok) return null
  const length = Number(res.headers.get('content-length') || '0')
  if (length > MAX_BYTES) return null
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length === 0 || buffer.length > MAX_BYTES) return null
  const headerType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  const sniffed = sniffType(buffer)
  const contentType = ALLOWED_TYPES.has(headerType) ? headerType : sniffed
  if (!contentType || !ALLOWED_TYPES.has(contentType)) return null
  return { buffer, contentType }
}

/** Re-run lookup from the submitted link and store the official avatar, or return null. */
export async function copyLookupAvatarToBucket(profileUrl: string, username: string): Promise<string | null> {
  const result = await lookupVtuberProfile(profileUrl)
  if ('error' in result || !result.avatarUrl) return null

  const downloaded = await downloadAllowlistedAvatar(result.avatarUrl)
  if (!downloaded) return null

  const ext = downloaded.contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin'
  const fileName = `${safeUsername(username)}/${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(fileName, downloaded.buffer, { contentType: downloaded.contentType, upsert: false })
  if (error) {
    console.error('lookup avatar copy failed:', error)
    return null
  }
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl || null
}
