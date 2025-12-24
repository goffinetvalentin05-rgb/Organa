import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Vérification temporaire pour le développement
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Variables Supabase non configurées. Vérifiez votre fichier .env.local')
    console.warn('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configuré' : '❌ Manquant')
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configuré' : '❌ Manquant')
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Variables Supabase manquantes. ' +
      'Veuillez configurer NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

