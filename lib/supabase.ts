import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Safe dummy client so builds don't crash when env vars are missing (common during initial Vercel setup)
function createDummyClient() {
  const handler = {
    get() {
      return () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        eq: function (this: any) { return this },
        single: () => Promise.resolve({ data: null, error: null }),
        then: (resolve: any) => resolve({ data: [], error: null }),
      })
    }
  }
  return new Proxy({}, handler) as any
}

let supabase: any
let supabaseAdmin: any

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    : supabase
} else {
  // During build / preview without env vars, use dummy to allow clean builds
  if (process.env.NODE_ENV === 'production') {
    console.warn('[supabase] Missing Supabase env vars. Using safe dummy client for build.')
  }
  supabase = createDummyClient()
  supabaseAdmin = createDummyClient()
}

export { supabase, supabaseAdmin }
