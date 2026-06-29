import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

export type NotificationType =
  | 'cmdmi_selected'
  | 'cmdmi_funded'
  | 'cmdmi_new'
  | 'bet_voting'
  | 'bet_won'
  | 'bet_lost'
  | 'achievement'
  | 'qa_open'
  | 'karaoke_open'
  | 'schedule_vote'
  | 'meme_new'

const DEFAULT_PREFS: Record<NotificationType, boolean> = {
  cmdmi_selected: true,
  cmdmi_funded: true,
  cmdmi_new: true,
  bet_voting: true,
  bet_won: true,
  bet_lost: true,
  achievement: true,
  qa_open: true,
  karaoke_open: true,
  schedule_vote: true,
  meme_new: true,
}

async function notificationEnabled(username: string, type: NotificationType): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('notification_prefs')
    .eq('username', username)
    .single()
  if (error?.code === '42703' || !data?.notification_prefs) return true
  const prefs = { ...DEFAULT_PREFS, ...(data.notification_prefs as Record<string, boolean>) }
  return prefs[type] !== false
}

export async function createNotification(
  username: string,
  title: string,
  message: string,
  type: NotificationType,
  relatedId?: string | null,
) {
  if (!await notificationEnabled(username, type)) return

  const { error } = await supabaseAdmin.from('notifications').insert({
    id: randomUUID(),
    username,
    title,
    message,
    type,
    related_id: relatedId ?? null,
    is_read: false,
    created_at: new Date().toISOString(),
  })
  if (error) console.error('createNotification failed:', error.message)
}

export async function notifyFavoriteVtubers(
  vtuberId: string,
  vtuberName: string,
  title: string,
  message: string,
  type: NotificationType,
  relatedId?: string,
  excludeUsername?: string,
) {
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('username, favorite_vtubers')

  for (const u of users ?? []) {
    if (excludeUsername && u.username === excludeUsername) continue
    const favorites = (u.favorite_vtubers ?? '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
    if (favorites.includes(vtuberId)) {
      await createNotification(u.username, title, message, type, relatedId)
    }
  }
}