import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Safe dummy client so builds don't crash when env vars are missing (common during initial Vercel setup)
function createDummyClient() {
  const dummyResponse = { data: [], error: null };

  const createChain = () => {
    const chain: any = {
      select: () => Promise.resolve(dummyResponse),
      insert: () => Promise.resolve(dummyResponse),
      update: () => Promise.resolve(dummyResponse),
      delete: () => Promise.resolve(dummyResponse),
      eq: () => chain,
      neq: () => chain,
      gt: () => chain,
      gte: () => chain,
      lt: () => chain,
      lte: () => chain,
      like: () => chain,
      ilike: () => chain,
      is: () => chain,
      in: () => chain,
      contains: () => chain,
      containedBy: () => chain,
      range: () => chain,
      order: () => chain,
      limit: () => chain,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve(dummyResponse),
    };
    return chain;
  };

  const handler = {
    get() {
      return () => createChain();
    }
  };

  return new Proxy({}, handler) as any;
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
