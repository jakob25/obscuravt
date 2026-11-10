/**
 * Clean a creator's own About / description for the nomination bio.
 * Keeps their wording, but drops email addresses, day-and-time schedule
 * listings, and sponsor / affiliate / promo-code phrases. An empty result
 * means the bio should be left blank.
 */
const BIO_MAX = 300

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

const DAY = '(?:mon(?:day)?s?|tue(?:s(?:day)?)?s?|wed(?:nesday)?s?|thu(?:rs(?:day)?)?s?|fri(?:day)?s?|sat(?:urday)?s?|sun(?:day)?s?)'
const DAYS = `${DAY}(?:\\s*(?:[,/&]|and)\\s*${DAY})*`
const TZ = '(?:utc|gmt|est|edt|cst|cdt|mst|mdt|pst|pdt|jst|aest|bst|kst|cet|cest|[a-z]{2,4}t)'
// Require minutes, am/pm, a timezone, or an "at <hour>" so years like 2020 stay put.
const TIME = `(?:(?:[01]?\\d|2[0-3]):[0-5]\\d(?:\\s*(?:a\\.?m\\.?|p\\.?m\\.?))?(?:\\s*${TZ})?|(?:[01]?\\d|2[0-3])\\s*(?:a\\.?m\\.?|p\\.?m\\.?)(?:\\s*${TZ})?|(?:[01]?\\d|2[0-3])\\s*${TZ}|at\\s+(?:[01]?\\d|2[0-3])(?::[0-5]\\d)?(?:\\s*(?:a\\.?m\\.?|p\\.?m\\.?))?(?:\\s*${TZ})?)`

const DAY_THEN_TIME = new RegExp(
  `\\b(?:(?:this|next|every|each)\\s+)?${DAYS}\\s*(?:at\\s+)?${TIME}\\b`,
  'gi',
)
const TIME_THEN_DAY = new RegExp(
  `\\b${TIME}\\s+(?:on\\s+)?(?:(?:this|next|every|each)\\s+)?${DAYS}\\b`,
  'gi',
)

const SCHEDULE_HEADING = /^\s*(?:(?:stream(?:ing)?\s*)?schedule)\s*:?\s*/i

const PROMO_RE = [
  /\b(?:official\s+)?(?:sponsors?(?:\s*:|\s+by)|sponsored\s+by)\s+[^\n.,;]+/gi,
  /\b(?:my\s+)?affiliate(?:\s+(?:link|code|partner|program))?s?(?:\s*:\s*)?(?:\s+https?:\/\/\S+)?/gi,
  /\b(?:promo|discount|coupon)\s+codes?\s*:?\s*[A-Za-z0-9][A-Za-z0-9_-]*/gi,
  /\b(?:use|using)\s+(?:my\s+)?(?:promo\s+|discount\s+)?codes?\s+[A-Za-z0-9][A-Za-z0-9_-]*/gi,
  /\bcodes?\s*:\s*[A-Za-z0-9][A-Za-z0-9_-]{2,}\b/gi,
]

function stripSchedulePhrases(line: string): string {
  return line.replace(DAY_THEN_TIME, '').replace(TIME_THEN_DAY, '')
}

function hasDayAndTime(line: string): boolean {
  DAY_THEN_TIME.lastIndex = 0
  TIME_THEN_DAY.lastIndex = 0
  return DAY_THEN_TIME.test(line) || TIME_THEN_DAY.test(line)
}

function isScheduleListing(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  if (hasDayAndTime(t)) return true
  return /^(?:mon|tue|wed|thu|fri|sat|sun)\b/i.test(t) && /\d/.test(t) && /(?:a\.?m\.?|p\.?m\.?|:)/i.test(t)
}

function isMostlySchedule(line: string): boolean {
  const stripped = stripSchedulePhrases(line).replace(/[\s,./&:!()'’-]+/g, ' ').trim()
  if (!stripped) return true
  const words = stripped.split(/\s+/).filter(w => !/^(and|or|at|on|the|a)$/i.test(w))
  return words.length === 0
}

export function sanitizeVtuberBio(raw: string | null | undefined): string {
  if (typeof raw !== 'string') return ''
  let text = raw.replace(/\r\n/g, '\n').replace(EMAIL_RE, '')

  const kept: string[] = []
  let skippingSchedule = false
  for (const line of text.split('\n')) {
    if (SCHEDULE_HEADING.test(line)) {
      const rest = line.replace(SCHEDULE_HEADING, '')
      if (rest && !isScheduleListing(rest) && !isMostlySchedule(rest)) {
        skippingSchedule = false
        kept.push(stripSchedulePhrases(rest))
      } else {
        skippingSchedule = true
      }
      continue
    }
    if (skippingSchedule && (isScheduleListing(line) || !line.trim())) {
      continue
    }
    skippingSchedule = false
    if (isScheduleListing(line) && isMostlySchedule(line)) continue
    kept.push(stripSchedulePhrases(line))
  }

  text = kept.join('\n')
  for (const re of PROMO_RE) {
    text = text.replace(re, '')
  }

  text = text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]*,(?:[ \t]*,)+/g, ',')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]+([.,;!?])/g, '$1')
    .replace(/\.{2,}/g, '.')
    .replace(/,{2,}/g, ',')
    .trim()

  if (!text) return ''
  if (text.length <= BIO_MAX) return text
  return text.slice(0, BIO_MAX).trimEnd()
}
