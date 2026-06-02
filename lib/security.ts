import { NextRequest, NextResponse } from 'next/server'

export function addSecurityHeaders(res: NextResponse): NextResponse {
  // Prevent clickjacking
  res.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS protection (legacy browsers)
  res.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy — disable unused browser features
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')

  // HSTS — force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    // Scripts — self + Next.js inline scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Styles — self + Google Fonts + inline
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts — Google Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Images — self + common photo platforms + DiceBear avatars
    [
      "img-src 'self' data: blob:",
      "https://api.dicebear.com",
      "https://i.imgur.com",
      "https://pbs.twimg.com",
      "https://live.staticflickr.com",
      "https://*.staticflickr.com",
      "https://glass.photo",
      "https://*.glass.photo",
      "https://supabase.co",
      "https://*.supabase.co",
    ].join(' '),
    // Media
    "media-src 'self' https://www.youtube.com https://clips.twitch.tv https://player.twitch.tv",
    // Frames — YouTube and Twitch embeds
    "frame-src https://www.youtube.com https://clips.twitch.tv https://player.twitch.tv",
    // Connect — Supabase API calls
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com",
    // Object/embed
    "object-src 'none'",
    // Base URI
    "base-uri 'self'",
    // Form actions
    "form-action 'self'",
  ].join('; ')

  res.headers.set('Content-Security-Policy', csp)

  return res
}

// CSRF check for state-changing requests
// Verifies the Origin header matches our domain
export function checkOrigin(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true // skip in dev

  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  if (!origin || !host) return false

  try {
    const originHost = new URL(origin).host
    return originHost === host
  } catch {
    return false
  }
}
