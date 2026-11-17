import type { NextRequest } from 'next/server'
import { caseFileImage } from '@/lib/og/case-file-card'
import { QUESTIONS, decodeOshiAnswers } from '@/lib/oshi-quiz'
import { oshiMatchesFor } from '@/lib/oshi-server'
import { OSHI_SHARE, PAGE_META } from '@/lib/site-copy'

export const revalidate = 3600

/** Share card for Find My Oshi; with a valid ?a= it names the real top matches. */
export async function GET(req: NextRequest) {
  const decoded = decodeOshiAnswers(req.nextUrl.searchParams.get('a'))
  if (decoded) {
    const matches = await oshiMatchesFor(decoded.tags).catch(() => [])
    if (matches.length > 0) {
      return caseFileImage({
        stamp: 'DECLASSIFIED',
        kicker: OSHI_SHARE.resultHeading,
        title: matches[0].name,
        lines: [
          'Matched by vibe, not sub count.',
          matches.length > 1 ? `Also on file: ${matches.slice(1, 3).map(m => m.name).join(' · ')}` : null,
        ],
        footer: 'obscuravt.com · Find My Oshi',
      })
    }
  }
  return caseFileImage({
    stamp: 'VIBE QUIZ',
    title: 'Find My Oshi',
    lines: [PAGE_META.findMyOshi.description(QUESTIONS.length)],
    footer: 'obscuravt.com · Find My Oshi',
  })
}
