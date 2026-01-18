import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase admin avec SERVICE_ROLE_KEY
 * Bypasse les RLS (Row Level Security)
 * 
 * ⚠️ À utiliser UNIQUEMENT côté serveur dans des routes API sécurisées
 * où l'authentification utilisateur est vérifiée manuellement
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Variables Supabase admin manquantes. ' +
      'Veuillez configurer NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans les variables d\'environnement'
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}











