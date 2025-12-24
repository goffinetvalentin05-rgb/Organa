import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Récupère l'utilisateur actuel (sans organisation)
 * Redirige vers /connexion si non authentifié
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.log("[AUTH][getCurrentUser] Aucun utilisateur authentifié", {
      error,
    })
    redirect('/connexion')
  }

  console.log("[AUTH][getCurrentUser] Utilisateur authentifié", {
    id: user.id,
    email: user.email,
  })

  return { user }
}

/**
 * Récupère l'utilisateur actuel sans redirection (sans organisation)
 * Utile pour les API routes
 */
export async function getCurrentUserOrNull() {
  const supabase = await createClient()
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user) {
    console.log("[AUTH][getCurrentUserOrNull] Aucun utilisateur authentifié", {
      error,
    })
    return null
  }

  console.log("[AUTH][getCurrentUserOrNull] Utilisateur authentifié", {
    id: user.id,
    email: user.email,
  })

  return { user }
}
