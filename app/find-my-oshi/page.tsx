import { Suspense } from 'react'
import type { Metadata } from 'next'
import { FindMyOshiQuiz } from '@/components/discovery/find-my-oshi-quiz'
import { QUESTIONS, decodeOshiAnswers, encodeOshiAnswers } from '@/lib/oshi-quiz'
import { pageMetadata } from '@/lib/og/page-meta'
import { PAGE_META } from '@/lib/site-copy'

type Props = { searchParams: Promise<{ a?: string | string[] }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const raw = (await searchParams).a
  const decoded = decodeOshiAnswers(Array.isArray(raw) ? raw[0] : raw)
  const a = decoded ? encodeOshiAnswers(decoded.indexes) : null
  return pageMetadata({
    title: PAGE_META.findMyOshi.title,
    description: PAGE_META.findMyOshi.description(QUESTIONS.length),
    path: a ? `/find-my-oshi?a=${a}` : '/find-my-oshi',
    // Query-dependent card: a shared result names its real top match
    image: a ? `/find-my-oshi/card?a=${a}` : '/find-my-oshi/card',
  })
}

export default function FindMyOshiPage() {
  return (
    <Suspense fallback={null}>
      <FindMyOshiQuiz />
    </Suspense>
  )
}
