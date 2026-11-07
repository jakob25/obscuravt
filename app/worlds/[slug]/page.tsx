import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readWorlds } from '@/lib/worlds/read'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
function Sources({ urls }: { urls: string[] }) {
  return <ul className="flex flex-wrap gap-3 text-sm">{urls.map((url, i) => <li key={url}><a className="text-vault-gold underline break-all" href={url} target="_blank" rel="noopener noreferrer">Source {i + 1} ({new URL(url).hostname})</a></li>)}</ul>
}
export default async function WorldPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { worlds, unavailable } = await readWorlds(undefined, slug)
  if (unavailable) return <main className="max-w-4xl mx-auto p-6"><h1 className="text-2xl">World temporarily unavailable</h1><p>Please try again later. Creator dossiers and clips are unchanged.</p></main>
  const world = worlds[0]
  if (!world) notFound()
  const { data: dossiers, error } = world.member_vtuber_ids.length
    ? await supabase.from('vtubers').select('id,name').in('id', world.member_vtuber_ids).eq('approved', true)
    : { data: [], error: null }
  const byId = new Map((dossiers ?? []).map(d => [d.id, d]))
  return <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 text-vault-cream">
    <header><p className="text-sm text-muted-foreground">Fictional world</p><h1 className="text-3xl break-words">{world.name}</h1></header>
    <p className="whitespace-pre-wrap break-words">{world.bio}</p>
    <Sources urls={world.world_details.sources} />
    <p className="text-sm text-muted-foreground">World membership describes a fictional setting, not account ownership. Listed by editorial order, not popularity.</p>
    <section className="space-y-3"><h2 className="text-xl">Explore the dossiers</h2>
      {error && <p>Dossiers could not load. Please try again later.</p>}
      {!error && !dossiers?.length && <p>No linked dossiers yet.</p>}
      {world.member_vtuber_ids.map(id => { const dossier = byId.get(id); return dossier ? <article key={id} className="rounded-lg border border-border p-4 space-y-2"><Link className="text-vault-gold underline" href={`/vtuber/${encodeURIComponent(id)}`}>{dossier.name}</Link><Sources urls={world.world_details.membership_sources[id]} /></article> : null })}
    </section>
    {!!world.world_details.cast.length && <section className="space-y-3"><h2 className="text-xl">Characters</h2><p className="text-sm text-muted-foreground">Characters can share an account and do not need separate dossiers.</p>{world.world_details.cast.map((character, i) => <article key={i} className="rounded-lg border border-border p-4 space-y-2"><h3 className="text-lg break-words">{character.name}</h3><p className="whitespace-pre-wrap break-words">{character.description}</p><Sources urls={character.sources} /></article>)}</section>}
  </main>
}
