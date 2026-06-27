import { NextRequest, NextResponse } from 'next/server'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean) ?? []
  if (ids.length < 2) {
    return NextResponse.json({ error: 'Provide at least two vtuber ids via ?ids=a,b' }, { status: 400 })
  }

  const { supabaseAdmin } = await import('@/lib/supabase')

  const { data: schedules } = await supabaseAdmin
    .from('stream_schedules')
    .select('vtuber_id,day_of_week,start_time,timezone,label')
    .in('vtuber_id', ids)

  const { data: vtubers } = await supabaseAdmin.from('vtubers').select('id,name').in('id', ids)
  const nameMap = Object.fromEntries((vtubers ?? []).map(v => [v.id, v.name]))

  const byDay: Record<number, Array<{ vtuber_id: string; name: string; start_time: string; label: string | null }>> = {}
  for (const s of schedules ?? []) {
    const d = s.day_of_week as number
    if (!byDay[d]) byDay[d] = []
    byDay[d].push({
      vtuber_id: s.vtuber_id,
      name: nameMap[s.vtuber_id] ?? s.vtuber_id,
      start_time: s.start_time,
      label: s.label,
    })
  }

  const overlapDays = Object.entries(byDay)
    .filter(([, slots]) => {
      const unique = new Set(slots.map(s => s.vtuber_id))
      return unique.size >= 2
    })
    .map(([day, slots]) => ({ day: Number(day), dayLabel: DAYS[Number(day)], slots }))

  return NextResponse.json({ schedules: byDay, overlapDays, vtubers: nameMap })
}