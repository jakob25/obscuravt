import { supabaseAdmin } from '@/lib/supabase'
import { SITE_DESCRIPTION, SITE_TAGLINE } from '@/lib/site-copy'

/**
 * Server-rendered "what's here" text and a plain creator directory. Mounted inside
 * <noscript> on JS-only pages (Discover, Search) so readers without JavaScript get real
 * content and links instead of an empty map or a bare loading state.
 */
export async function WhatsHere() {
  let creators: { id: string; name: string | null; handle: string | null }[] = []
  try {
    const { data } = await supabaseAdmin
      .from('vtubers')
      .select('id,name,handle')
      .eq('approved', true)
      .order('name', { ascending: true })
      .limit(500)
    creators = (data ?? []) as typeof creators
  } catch {
    creators = []
  }

  return (
    <section aria-labelledby="whats-here-title" className="container mx-auto px-4 py-8 max-w-3xl">
      <h2 id="whats-here-title" className="text-xl font-bold text-vault-cream">What&apos;s here</h2>
      <p className="text-sm text-muted-foreground mt-2">{SITE_TAGLINE} {SITE_DESCRIPTION}</p>
      <p className="text-sm text-muted-foreground mt-2">
        The maps and search on this page need JavaScript. Without it, you can still open any
        creator&apos;s file below, or browse <a className="underline" href="/clips">clips</a>.
      </p>
      <h3 className="text-base font-semibold text-vault-cream mt-6">Creator directory ({creators.length})</h3>
      {creators.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-2">The directory couldn&apos;t load right now.</p>
      ) : (
        <ul className="mt-2 grid gap-1 sm:grid-cols-2 text-sm">
          {creators.map(c => (
            <li key={c.id}>
              <a className="text-vault-gold underline-offset-2 hover:underline" href={`/vtuber/${c.id}`}>
                {c.name || c.handle || c.id}
              </a>
              {c.handle && c.name && c.handle.toLowerCase() !== c.name.toLowerCase() ? (
                <span className="text-muted-foreground"> · @{c.handle}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
