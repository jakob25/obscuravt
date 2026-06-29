import { createClient } from '@supabase/supabase-js'
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export interface ScheduleSlot {
  id: string
  day_of_week: number
  start_time: string
  timezone: string
  label: string | null
}

export interface DossierCmdiGoal {
  id: string
  title: string
  funded_amount: number
  goal_amount: number
}

export interface DossierBet {
  id: string
  title: string
  options: string[]
}

export interface DossierSidebarData {
  nextScheduleLabel: string | null
  activeCmdi: DossierCmdiGoal | null
  openBets: DossierBet[]
}

function formatTime12h(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function getNextScheduleSlot(slots: ScheduleSlot[]): ScheduleSlot | null {
  if (slots.length === 0) return null
  const now = new Date()
  const today = now.getDay()
  const nowMins = now.getHours() * 60 + now.getMinutes()

  let best: { slot: ScheduleSlot; daysUntil: number } | null = null
  for (const slot of slots) {
    const [h, m] = slot.start_time.split(':').map(Number)
    const slotMins = h * 60 + m
    let daysUntil = (slot.day_of_week - today + 7) % 7
    if (daysUntil === 0 && slotMins <= nowMins) daysUntil = 7
    if (!best || daysUntil < best.daysUntil) best = { slot, daysUntil }
  }
  return best?.slot ?? slots[0]
}

export function formatScheduleLabel(slot: ScheduleSlot | null): string | null {
  if (!slot) return null
  const day = DAYS[slot.day_of_week] ?? 'Unknown'
  const time = formatTime12h(slot.start_time)
  const label = slot.label ? ` — ${slot.label}` : ''
  return `Next: ${day} ${time}${label}`
}

export async function fetchDossierSidebarData(
  vtuberId: string,
  vtuberName: string,
): Promise<DossierSidebarData> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [{ data: scheduleRows }, { data: ideas }, { data: bets }] = await Promise.all([
    supabase
      .from('stream_schedules')
      .select('id, day_of_week, start_time, timezone, label')
      .eq('vtuber_id', vtuberId)
      .order('day_of_week'),
    supabase
      .from('cmdmi_ideas')
      .select('id, title')
      .eq('profile_id', vtuberId)
      .in('status', ['selected', 'completed']),
    supabase
      .from('bets')
      .select('id, title, options, status, vtuber_name')
      .eq('status', 'open')
      .ilike('vtuber_name', vtuberName)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const nextSlot = getNextScheduleSlot((scheduleRows ?? []) as ScheduleSlot[])
  const nextScheduleLabel = formatScheduleLabel(nextSlot)

  let activeCmdi: DossierCmdiGoal | null = null
  const ideaIds = (ideas ?? []).map(i => i.id)
  if (ideaIds.length > 0) {
    const { data: goals } = await supabase
      .from('cmdmi_goals')
      .select('id, idea_id, funded_amount, goal_amount, status')
      .in('idea_id', ideaIds)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    const goal = goals?.[0]
    if (goal) {
      const idea = (ideas ?? []).find(i => i.id === goal.idea_id)
      if (idea) {
        activeCmdi = {
          id: goal.id,
          title: idea.title,
          funded_amount: goal.funded_amount ?? 0,
          goal_amount: goal.goal_amount ?? 0,
        }
      }
    }
  }

  const openBets: DossierBet[] = (bets ?? []).map(b => ({
    id: b.id,
    title: b.title,
    options: Array.isArray(b.options) ? b.options : [],
  }))

  return { nextScheduleLabel, activeCmdi, openBets }
}