export function ClipCredit({ submitter }: { submitter?: string | null }) {
  const name = submitter?.trim()
  const safe = name && !name.includes('@') ? name : null
  return (
    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
      {safe ? `clipped by ${safe}` : 'Community'}
    </p>
  )
}
