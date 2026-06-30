import { createClient } from '@supabase/supabase-js'

const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing Supabase env var: NEXT_PUBLIC_SUPABASE_URL is required.')
  }

  return supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : createBrowserClient()
}

const lazyClient = <T extends object>(factory: () => T): T =>
  new Proxy({} as T, {
    get(target, prop, receiver) {
      const instance = (target as any).__instance || ((target as any).__instance = factory())
      const value = Reflect.get(instance, prop, receiver)
      return typeof value === 'function' ? (value as Function).bind(instance) : value
    },
    set(target, prop, value, receiver) {
      const instance = (target as any).__instance || ((target as any).__instance = factory())
      return Reflect.set(instance, prop, value, receiver)
    },
    has(target, prop) {
      const instance = (target as any).__instance || ((target as any).__instance = factory())
      return Reflect.has(instance, prop)
    },
    ownKeys(target) {
      const instance = (target as any).__instance || ((target as any).__instance = factory())
      return Reflect.ownKeys(instance)
    },
    getOwnPropertyDescriptor(target, prop) {
      const instance = (target as any).__instance || ((target as any).__instance = factory())
      return Reflect.getOwnPropertyDescriptor(instance, prop)
    },
  })

export function getSupabase() {
  return createBrowserClient()
}

export function getSupabaseAdmin() {
  return createAdminClient()
}

export const supabase = lazyClient(createBrowserClient)
export const supabaseAdmin = lazyClient(createAdminClient)
