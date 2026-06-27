import { NextResponse } from 'next/server'

export async function GET() {
  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data, error } = await supabaseAdmin
    .from('canonical_tags')
    .select('id,tag,category,color,sort_order')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}