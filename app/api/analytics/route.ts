import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session'
import { ownsVtuber } from '@/lib/owns-vtuber'
import { parseFavoriteVtubers } from '@/lib/community-overlap'

async function safeCount(
  table: string,
  build: (q: ReturnType<typeof import('@/lib/supabase').supabaseAdmin.from>) => ReturnType<typeof import('@/lib/supabase').supabaseAdmin.from>,
): Promise<number> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { count, error } = await build(supabaseAdmin.from(table).select('*', { count: 'exact', head: true }))
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const profileId = req.nextUrl.searchParams.get('profileId')
  if (!profileId) return NextResponse.json({ error: 'profileId is required.' }, { status: 400 })

  if (!await ownsVtuber(user.username, profileId)) {
    return NextResponse.json({ error: 'You do not own this profile.' }, { status: 403 })
  }

  const { supabaseAdmin } = await import('@/lib/supabase')
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: allUsers } = await supabaseAdmin
    .from('users')
    .select('favorite_vtubers')
    .not('favorite_vtubers', 'is', null)

  const circleFollowers = (allUsers ?? []).filter(u =>
    parseFavoriteVtubers(u.favorite_vtubers).includes(profileId),
  ).length

  const [
    cmdmiIdeas,
    cmdmiGoalsActive,
    cmdmiGoalsFunded,
    memesTotal,
    memes7d,
    fanArtTotal,
    karaokePending,
    karaokeQueued,
    karaokeDone,
    qaSessionsOpen,
    scheduleVotes,
    predictionsOpen,
    clipsTotal,
  ] = await Promise.all([
    safeCount('cmdmi_ideas', q => q.eq('profile_id', profileId)),
    safeCount('cmdmi_goals', q => q.eq('profile_id', profileId).eq('status', 'active')),
    safeCount('cmdmi_goals', q => q.eq('profile_id', profileId).eq('status', 'funded')),
    safeCount('memes', q => q.eq('vtuber_id', profileId)),
    safeCount('memes', q => q.eq('vtuber_id', profileId).gte('created_at', since7)),
    safeCount('fan_art', q => q.eq('vtuber_id', profileId).eq('reported', false)),
    safeCount('karaoke_requests', q => q.eq('vtuber_id', profileId).eq('status', 'pending')),
    safeCount('karaoke_requests', q => q.eq('vtuber_id', profileId).eq('status', 'queued')),
    safeCount('karaoke_requests', q => q.eq('vtuber_id', profileId).eq('status', 'done')),
    safeCount('qa_sessions', q => q.eq('vtuber_id', profileId).eq('status', 'open')),
    safeCount('schedule_votes', q => q.eq('vtuber_id', profileId)),
    safeCount('stream_predictions', q => q.eq('vtuber_id', profileId).eq('status', 'open')),
    safeCount('clips', q => q.eq('vtuber_id', profileId)),
  ])

  let qaQuestionCount = 0
  try {
    const { data: sessions } = await supabaseAdmin
      .from('qa_sessions')
      .select('id')
      .eq('vtuber_id', profileId)
    const sessionIds = (sessions ?? []).map(s => s.id)
    if (sessionIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('qa_questions')
        .select('*', { count: 'exact', head: true })
        .in('session_id', sessionIds)
      qaQuestionCount = count ?? 0
    }
  } catch {
    qaQuestionCount = 0
  }

  let memes30d = 0
  try {
    const { count } = await supabaseAdmin
      .from('memes')
      .select('*', { count: 'exact', head: true })
      .eq('vtuber_id', profileId)
      .gte('created_at', since30)
    memes30d = count ?? 0
  } catch {
    memes30d = 0
  }

  const fanEngagementScore =
    circleFollowers * 2 +
    memesTotal +
    fanArtTotal +
    karaokePending + karaokeQueued +
    qaQuestionCount +
    scheduleVotes +
    cmdmiIdeas

  return NextResponse.json({
    profileId,
    circleFollowers,
    fanEngagementScore,
    chatMadeMeDoIt: {
      ideas: cmdmiIdeas,
      activeGoals: cmdmiGoalsActive,
      fundedGoals: cmdmiGoalsFunded,
    },
    memes: { total: memesTotal, last7d: memes7d, last30d: memes30d },
    fanArt: { total: fanArtTotal },
    karaoke: { pending: karaokePending, queued: karaokeQueued, done: karaokeDone },
    qa: { openSessions: qaSessionsOpen, questions: qaQuestionCount },
    scheduleVotes,
    predictionsOpen,
    clips: clipsTotal,
  })
}