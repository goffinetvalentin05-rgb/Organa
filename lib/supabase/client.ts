import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Variables Supabase non configurées. Vérifiez votre fichier .env.local')
      console.warn('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configuré' : '❌ Manquant')
      console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configuré' : '❌ Manquant')
    }
    return createMockClient()
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

function createMockClient(): SupabaseClient {
  return {
    auth: {
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as unknown as SupabaseClient
}

