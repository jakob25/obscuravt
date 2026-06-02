import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session'

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json(null)
  return NextResponse.json(user)
}
