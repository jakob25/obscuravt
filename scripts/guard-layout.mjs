#!/usr/bin/env node
/**
 * Static guards for the site layout shell.
 * Catches regressions like isolate+transparent body, negative backdrop z-index,
 * and global overflow:hidden that clipped the viewport (Jun 2026 incident).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const errors = []

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

function fail(msg) {
  errors.push(msg)
}

const layout = read('app/layout.tsx')
const globals = read('app/globals.css')

// ── app/layout.tsx ──────────────────────────────────────────────────────────

if (/\bbody\s+className="[^"]*\bisolate\b/.test(layout)) {
  fail('app/layout.tsx: remove `isolate` from <body> — it breaks site-backdrop stacking')
}

if (!/\bbody\s+className="[^"]*\bbg-vault-deep\b/.test(layout)) {
  fail('app/layout.tsx: <body> must include `bg-vault-deep` (fallback behind backdrop)')
}

if (!layout.includes('relative z-10 flex min-h-screen flex-col')) {
  fail('app/layout.tsx: app content must be wrapped in `relative z-10 flex min-h-screen flex-col`')
}

if (!layout.includes('<SiteBackdrop')) {
  fail('app/layout.tsx: SiteBackdrop must remain a direct child of <body>')
}

// ── app/globals.css ─────────────────────────────────────────────────────────

const backdropBlock = globals.match(/\.site-backdrop\s*\{[^}]+\}/s)
if (!backdropBlock) {
  fail('app/globals.css: missing `.site-backdrop` rule')
} else if (/z-index:\s*-\d+/.test(backdropBlock[0])) {
  fail('app/globals.css: `.site-backdrop` must not use negative z-index')
}

if (/html\s*\{[^}]*overflow:\s*hidden/s.test(globals)) {
  fail('app/globals.css: do not set overflow:hidden on html')
}

if (/@layer base[\s\S]*?body\s*\{[^}]*overflow:\s*hidden/s.test(globals)) {
  fail('app/globals.css: do not set overflow:hidden on body in @layer base')
}

if (/\.nav-rgb-shell\s*\{[^}]*overflow:\s*hidden/s.test(globals)) {
  fail('app/globals.css: do not set overflow:hidden on .nav-rgb-shell (clips page edges)')
}

const globalsLines = globals.split('\n').length
if (globalsLines < 900) {
  fail(
    `app/globals.css: file is only ${globalsLines} lines — suspected mass deletion (expected ~1100+). Restore before merging.`,
  )
}

// ── report ──────────────────────────────────────────────────────────────────

if (errors.length) {
  console.error('Layout guard failed:\n')
  for (const e of errors) console.error(`  • ${e}`)
  process.exit(1)
}

console.log('Layout guard passed.')