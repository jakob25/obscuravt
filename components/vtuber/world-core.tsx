import Link from 'next/link'

export interface WorldCharacter {
  id: string
  name: string
  avatar_url: string | null
}

interface Props {
  worldName: string
  worldSlug: string
  lore: string | null
  characters: WorldCharacter[]
}

export function WorldCore({ worldName, worldSlug, lore, characters }: Props) {
  return (
    <div className="world-core mb-8">
      <div className="world-core-card">
        <div className="world-core-label">[{worldName}]</div>
        <div className="world-core-heading">Core</div>
        <div className="world-core-lore">
          {lore || 'No lore on file.'}
        </div>
        <div className="world-core-cast-label">Characters</div>
        <div className="world-core-grid">
          {characters.map(c => (
            <Link key={c.id} href={`/vtuber/${c.id}`} className="world-core-face">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt={c.name} />
              ) : (
                <span>{c.name.charAt(0).toUpperCase()}</span>
              )}
              <em>{c.name}</em>
            </Link>
          ))}
        </div>
        <Link href={`/corpo/${worldSlug}`} className="world-core-more">
          Open world file
        </Link>
      </div>
      <div className="world-core-tabs" aria-hidden>
        <span>Clips</span>
        <span>Art</span>
      </div>
    </div>
  )
}
