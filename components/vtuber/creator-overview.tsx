import summaries from '@/lib/creator-summaries.json'

type Summary = { id: string; text: string; checked: string }

export function CreatorOverview({ id }: { id: string }) {
  const entry = (summaries as Summary[]).find((s) => s.id === id)
  if (!entry || !entry.text) return null
  return (
    <div className="mb-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-case-teal mb-1.5">
        WHAT TO EXPECT
      </div>
      <p className="text-[13.5px] leading-relaxed text-[var(--case-ink)]">{entry.text}</p>
    </div>
  )
}
