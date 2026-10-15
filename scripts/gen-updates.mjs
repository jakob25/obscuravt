// Builds lib/generated-updates.json from "Update:" lines in commit messages on HEAD.
// Always writes the file; writes nulls if git history is unavailable (e.g. shallow clone).
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'generated-updates.json')
const empty = { version: null, title: null, body: [] }
let result = empty

try {
  const SEP = '\x1e'
  const raw = execSync(`git log HEAD -n 200 --format=%cI%x1f%B${SEP}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  for (const entry of raw.split(SEP)) {
    const [date, msg] = entry.trim().split('\x1f')
    if (!date || !msg) continue
    const lines = msg
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('Update:'))
      .map((l) => l.slice('Update:'.length).trim())
      .filter(Boolean)
    if (lines.length) {
      result = { version: date.slice(0, 10).replace(/-/g, '.'), title: "What's New on the Vault", body: lines }
      break
    }
  }
} catch {
  result = empty
}

writeFileSync(out, JSON.stringify(result, null, 2) + '\n')
console.log(`gen-updates: ${result.version ? `${result.body.length} update(s) for ${result.version}` : 'no updates found, using fallback'}`)
