import Link from 'next/link'
import { VaultFrame } from '@/components/vault/vault-frame'

export interface CorpoSibling {
  id: string
  name: string
  avatar_url: string | null
}

interface Props {
  corpoName: string
  corpoSlug: string
  siblings: CorpoSibling[]
}

export function RecommendedStrip({ corpoName, corpoSlug, siblings }: Props) {
  if (siblings.length === 0) return null

  return (
    <VaultFrame className="rounded-sm p-5 mb-6">
      <p className="text-xs text-muted-foreground mb-3">
        Recommended from{' '}
        <Link href={`/corpo/${corpoSlug}`} className="text-vault-gold hover:underline">
          {corpoName}
        </Link>
      </p>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {siblings.map(s => (
          <Link
            key={s.id}
            href={`/vtuber/${s.id}`}
            className="shrink-0 flex flex-col items-center gap-1.5 group min-w-[72px]"
          >
            {s.avatar_url ? (
              <img
                src={s.avatar_url}
                alt=""
                className="h-14 w-14 rounded-xl object-cover border border-border group-hover:border-vault-gold/40 transition-colors"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-vault-gold/20 flex items-center justify-center font-bold text-vault-gold border border-border group-hover:border-vault-gold/40">
                {s.name[0]}
              </div>
            )}
            <span className="text-[11px] text-vault-cream group-hover:text-vault-gold text-center line-clamp-2 max-w-[80px]">
              {s.name}
            </span>
          </Link>
        ))}
      </div>
    </VaultFrame>
  )
}