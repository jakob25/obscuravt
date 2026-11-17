import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { VTUBER_AVATAR_BUCKET, avatarFolder } from '@/lib/avatar-path'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const BUCKET = VTUBER_AVATAR_BUCKET
const safeUsername = avatarFolder

export async function POST(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Please use a JPEG, PNG, GIF, or WebP image.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 5MB or smaller.' }, { status: 400 })
  }

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin'
  const fileName = `${safeUsername(session.username)}/${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`

  const { supabaseAdmin } = await import('@/lib/supabase')
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('vtuber avatar upload failed:', uploadError)
    return NextResponse.json({
      error: "Couldn't upload the profile picture. You can submit without one, or try a different image.",
    }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName)
  return NextResponse.json({ ok: true, url: urlData.publicUrl })
}
