import { z } from 'zod'

// Evidence is linked, never fetched here. Untrusted URLs cannot trigger requests.
export const sourceUrl = z.string().trim().url().max(2048).refine(value => {
  const url = new URL(value)
  return url.protocol === 'https:' && !url.username && !url.password
}, 'Use a public HTTPS source link.')
const sources = z.array(sourceUrl).min(1, 'Add a public source.').max(20)
export const worldInput = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens.'),
  name: z.string().trim().min(1).max(160),
  bio: z.string().trim().max(10000),
  member_vtuber_ids: z.array(z.string().min(1).max(200)).max(500).refine(ids => new Set(ids).size === ids.length, 'Duplicate dossiers.'),
  world_details: z.object({
    sources,
    membership_sources: z.record(sources),
    cast: z.array(z.object({ name: z.string().trim().min(1).max(160), description: z.string().trim().max(3000), sources })).max(500),
  }).strict(),
}).strict().superRefine((world, ctx) => {
  for (const id of world.member_vtuber_ids) {
    if (!world.world_details.membership_sources[id]?.length) ctx.addIssue({code: 'custom', message: `Add a membership source for dossier ${id}.`, path: ['world_details', 'membership_sources', id]})
  }
  for (const id of Object.keys(world.world_details.membership_sources)) {
    if (!world.member_vtuber_ids.includes(id)) ctx.addIssue({code: 'custom', message: 'Source references an unselected dossier.', path: ['world_details', 'membership_sources', id]})
  }
})
export type WorldInput = z.infer<typeof worldInput>
