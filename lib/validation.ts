import { z } from 'zod'

const HTML_TAG_PATTERN = /<[^>]*>/g
const SCRIPT_PROTOCOL_PATTERN = /\b(?:javascript|data|vbscript):/gi
const EVENT_HANDLER_PATTERN = /\bon\w+\s*=\s*/gi
const NULL_BYTE_PATTERN = /\u0000/g
const WHITESPACE_PATTERN = /\s{2,}/g

// ── Sanitize text input — strip HTML, trim, normalize whitespace ──────────────
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(HTML_TAG_PATTERN, '')
    .replace(SCRIPT_PROTOCOL_PATTERN, '')
    .replace(EVENT_HANDLER_PATTERN, '')
    .replace(NULL_BYTE_PATTERN, '')
    .replace(WHITESPACE_PATTERN, ' ')
}

export function sanitizeUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    const protocol = url.protocol.toLowerCase()

    if (protocol !== 'http:' && protocol !== 'https:') return null

    const hostname = url.hostname.toLowerCase()
    if (!hostname) return null

    return url.toString()
  } catch {
    return null
  }
}

// ── Common field validators ───────────────────────────────────────────────────

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')

export const bioSchema = z
  .string()
  .max(300, 'Bio must be at most 300 characters')
  .transform(sanitizeText)
  .optional()

export const titleSchema = z
  .string()
  .min(3, 'Title must be at least 3 characters')
  .max(120, 'Title must be at most 120 characters')
  .transform(sanitizeText)

export const contentSchema = z
  .string()
  .min(1, 'Content cannot be empty')
  .max(280, 'Content must be at most 280 characters')
  .transform(sanitizeText)

export const urlSchema = z
  .string()
  .url('Must be a valid URL')
  .max(2048, 'URL too long')
  .refine(url => {
    try {
      const u = new URL(url)
      return ['http:', 'https:'].includes(u.protocol)
    } catch { return false }
  }, 'URL must use http or https')

export const amountSchema = z
  .number()
  .int('Amount must be a whole number')
  .min(1, 'Amount must be at least 1')
  .max(1_000_000, 'Amount too large')

// ── Route-specific schemas ────────────────────────────────────────────────────

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(128),
})

export const betSchema = z.object({
  title: titleSchema,
  description: z.string().max(500).transform(sanitizeText).optional(),
  vtuber_name: z.string().max(100).transform(sanitizeText).optional(),
  category: z.string().max(50),
  options: z.array(z.string().min(1).max(80).transform(sanitizeText)).min(2).max(6),
})

export const placeBetSchema = z.object({
  bet_id: z.string().uuid('Invalid bet ID'),
  option: z.string().min(1).max(80).transform(sanitizeText),
  amount: amountSchema,
})

export const voteSchema = z.object({
  bet_id: z.string().uuid('Invalid bet ID'),
  option: z.string().min(1).max(80),
})

export const clipSchema = z.object({
  profile_id: z.string().optional(),
  title: titleSchema,
  url: urlSchema,
  description: z.string().max(300).transform(sanitizeText).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

export const cmdmiIdeaSchema = z.object({
  profile_id: z.string().min(1),
  title: titleSchema,
  description: z.string().max(300).transform(sanitizeText).optional(),
})

export const forumPostSchema = z.object({
  constellation_id: z.string().min(1).max(50),
  content: contentSchema,
  vtuber_id: z.string().optional(),
})

export const vtuberSubmitSchema = z.object({
  name: z.string().min(2).max(80).transform(sanitizeText),
  handle: z.string().max(50).transform(sanitizeText).optional(),
  platform: z.string().max(50).optional(),
  link: urlSchema.optional(),
  bio: bioSchema,
  tags: z.array(z.string().max(50)).max(20).optional(),
})

export const photoSchema = z.object({
  vtuber_id: z.string().min(1),
  url: urlSchema,
  caption: z.string().max(120).transform(sanitizeText).optional(),
})

// ── Helper: parse request body with a schema ─────────────────────────────────
export async function parseBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: string; status: 400 }> {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      const message = result.error.errors.map(e => e.message).join('. ')
      return { error: message, status: 400 }
    }
    return { data: result.data }
  } catch {
    return { error: 'Invalid JSON body.', status: 400 }
  }
}
