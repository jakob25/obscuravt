import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const body = await request.json()
    const { vtuberId, title, description } = body

    if (!vtuberId || !title) {
      return NextResponse.json(
        { error: 'vtuberId and title are required' },
        { status: 400 }
      )
    }

    // Insert new CMDI goal (status = active by default)
    const { data, error } = await supabaseAdmin
      .from('cmdi_goals')
      .insert({
        vtuber_id: vtuberId,
        title: title.trim(),
        description: description?.trim() || null,
        current_progress: 0,
        target: 100, // default target, can be changed later
        status: 'active',
        created_by: 'anonymous', // TODO: replace with real user when auth is connected
      })
      .select()
      .single()

    if (error) {
      console.error('CMDI submit error:', error)
      return NextResponse.json(
        { error: 'Failed to submit idea' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, goal: data })
  } catch (err) {
    console.error('CMDI submit exception:', err)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
