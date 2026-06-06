import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const CONFIG_ERROR =
  'Configuration Supabase manquante. Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local, puis redémarrez le serveur de développement.'

function authConfigError() {
  return {
    data: { user: null, session: null },
    error: { message: CONFIG_ERROR, name: 'AuthConfigError', status: 500 } as never,
  }
}

function createMockClient(): SupabaseClient {
  return {
    auth: {
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => authConfigError(),
      signUp: async () => authConfigError(),
      signInWithOtp: async () => authConfigError(),
      resetPasswordForEmail: async () => authConfigError(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as unknown as SupabaseClient
}

export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

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
