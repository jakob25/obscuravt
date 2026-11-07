import Link from 'next/link'
import { readWorlds } from '@/lib/worlds/read'

export async function WorldLinks({ id }: { id: string }) {
  const { worlds } = await readWorlds(id)
  if (!worlds.length) return null
  return <aside className="rounded-lg border border-border p-4 space-y-2" aria-label="Fictional worlds">
    {worlds.map(world => <p key={world.slug} className="text-sm break-words">Part of <Link className="text-vault-gold underline" href={`/worlds/${world.slug}`}>{world.name}</Link></p>)}
  </aside>
}
