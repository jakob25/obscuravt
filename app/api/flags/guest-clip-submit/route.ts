import { NextResponse } from 'next/server'
import { allowSignedOutClipSubmit } from '@/lib/flags'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ enabled: allowSignedOutClipSubmit() })
}
