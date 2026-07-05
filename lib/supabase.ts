import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const FALLBACK_URL = 'https://example.supabase.co'
const FALLBACK_ANON_KEY = 'placeholder-anon-key'
const FALLBACK_SERVICE_ROLE_KEY = 'placeholder-service-role-key'

function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '',
  }
}

function looksLikePlaceholder(value: string) {
  return value.length === 0 || value.includes('your-') || value.includes('placeholder') || value.includes('changeme')
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseEnv()

  return Boolean(
    url &&
    anonKey &&
    url.startsWith('http') &&
    !looksLikePlaceholder(url) &&
    !looksLikePlaceholder(anonKey),
  )
}

function createSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function getSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv()
  const resolvedUrl = isSupabaseConfigured() ? url : FALLBACK_URL
  const resolvedKey = isSupabaseConfigured() ? anonKey : FALLBACK_ANON_KEY

  return createSupabaseClient(resolvedUrl, resolvedKey)
}

export function getSupabaseAdminClient(): SupabaseClient {
  const { url, serviceRoleKey } = getSupabaseEnv()
  const resolvedUrl = isSupabaseConfigured() ? url : FALLBACK_URL
  const resolvedKey = isSupabaseConfigured() && serviceRoleKey && !looksLikePlaceholder(serviceRoleKey)
    ? serviceRoleKey
    : FALLBACK_SERVICE_ROLE_KEY

  return createSupabaseClient(resolvedUrl, resolvedKey)
}

export const supabase = getSupabaseClient()
export const supabaseAdmin = getSupabaseAdminClient()
