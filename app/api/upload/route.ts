import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const BUCKET = 'vault-uploads'

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
  const purpose = String(formData.get('purpose') ?? 'general')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required.' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 5MB or smaller.' }, { status: 400 })
  }

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin'
  const fileName = `${purpose}/${session.username}/${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`

  const { supabaseAdmin } = await import('@/lib/supabase')
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    const msg = uploadError.message.includes('Bucket not found')
      ? 'Upload storage not configured — create the vault-uploads bucket in Supabase.'
      : uploadError.message
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName)

  return NextResponse.json({ ok: true, url: urlData.publicUrl })
}