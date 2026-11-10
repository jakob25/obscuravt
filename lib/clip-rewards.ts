export const CLIP_POST_SCRAP_AMOUNT = 5
export const CLIP_POST_DAILY_CAP = 5
export const CLIP_REWARD_RESET_HOUR_UTC = 8

export type ClipPostAward = {
  awarded: number
  count_today: number
  daily_cap: number
  capped: boolean
  reset_at: string
}

/** Start of the current clip-reward day: the most recent 08:00 UTC. */
export function clipRewardWindowStart(now: Date = new Date()): Date {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const date = now.getUTCDate()
  const start = new Date(Date.UTC(year, month, date, CLIP_REWARD_RESET_HOUR_UTC, 0, 0, 0))
  if (now.getUTCHours() < CLIP_REWARD_RESET_HOUR_UTC) {
    start.setUTCDate(start.getUTCDate() - 1)
  }
  return start
}

/** Next 08:00 UTC after `now` — when today's clip rewards reset. */
export function clipRewardResetAt(now: Date = new Date()): Date {
  const start = clipRewardWindowStart(now)
  const reset = new Date(start.getTime())
  reset.setUTCDate(reset.getUTCDate() + 1)
  return reset
}

export function formatResetInLocalTime(resetAt: Date, timeZone?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }
  if (timeZone) options.timeZone = timeZone
  return new Intl.DateTimeFormat(undefined, options).format(resetAt)
}

export function clipPostAwardSuccessMessage(
  awarded: number,
  countToday: number,
  dailyCap: number = CLIP_POST_DAILY_CAP,
): string {
  return `+${awarded} scraps · ${countToday} of ${dailyCap} today`
}

export function clipPostAwardCappedMessage(resetAt: Date, timeZone?: string): string {
  const local = formatResetInLocalTime(resetAt, timeZone)
  return `Clip posted. You've earned today's ${CLIP_POST_DAILY_CAP} clip rewards; they reset at 8:00 UTC (${local})`
}

export function clipPostAwardMessage(
  award: ClipPostAward | null | undefined,
  timeZone?: string,
): string | null {
  if (!award) return null
  if (award.awarded > 0) {
    return clipPostAwardSuccessMessage(award.awarded, award.count_today, award.daily_cap)
  }
  if (award.capped) {
    return clipPostAwardCappedMessage(new Date(award.reset_at), timeZone)
  }
  return null
}

export function parseClipPostAwardResult(data: unknown): ClipPostAward | null {
  if (!data || typeof data !== 'object') return null
  const row = data as Record<string, unknown>
  const awarded = Number(row.awarded ?? 0)
  const countToday = Number(row.count_today ?? 0)
  if (!Number.isFinite(awarded) || !Number.isFinite(countToday)) return null
  const resetRaw = row.reset_at
  const resetAt =
    typeof resetRaw === 'string' && resetRaw
      ? resetRaw
      : clipRewardResetAt().toISOString()
  return {
    awarded,
    count_today: countToday,
    daily_cap: CLIP_POST_DAILY_CAP,
    capped: Boolean(row.capped),
    reset_at: resetAt,
  }
}

type AwardRpc = (
  fn: string,
  args: { p_username: string; p_clip_id: string },
) => Promise<{ data: unknown; error: { message?: string } | null }>

/** Award scraps for a posted clip. Never throws; returns null on skip or failure. */
export async function maybeAwardClipPostScraps(
  username: string | undefined | null,
  clipId: string,
  rpc: AwardRpc,
): Promise<ClipPostAward | null> {
  if (!username || username === 'guest') return null
  try {
    const { data, error } = await rpc('award_clip_post_scraps', {
      p_username: username,
      p_clip_id: clipId,
    })
    if (error) {
      console.error('award_clip_post_scraps failed:', error.message)
      return null
    }
    return parseClipPostAwardResult(data)
  } catch (err) {
    console.error('clip post scrap award', err)
    return null
  }
}
