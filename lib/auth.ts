import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuthContext, requireAuthContext } from '@/lib/auth/rbac'

/**
 * @deprecated Préférer requireAuthContext() de "@/lib/auth/rbac" qui retourne
 * également les memberships et le club courant.
 *
 * Récupère l'utilisateur actuel.
 * Redirige vers /connexion si non authentifié.
 */
export async function getCurrentUser() {
  const ctx = await requireAuthContext()
  return { user: { id: ctx.user.id, email: ctx.user.email ?? undefined } }
}

/**
 * @deprecated Préférer getAuthContext() de "@/lib/auth/rbac".
 *
 * Récupère l'utilisateur actuel sans redirection.
 * Utile pour les API routes qui veulent renvoyer 401 manuellement.
 */
export async function getCurrentUserOrNull() {
  const ctx = await getAuthContext()
  if (!ctx) {
    return null
  }
  return { user: { id: ctx.user.id, email: ctx.user.email ?? undefined } }
}

/**
 * Vérifie qu'une session existe ET que la session est AAL2 si l'utilisateur
 * a un facteur MFA enrôlé. À utiliser dans les routes API qui touchent à des
 * données sensibles (intégrations, exports, suppression, gestion des membres).
 */
export async function requireAal2(): Promise<{ ok: true } | { ok: false; response: Response }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Impossible de vérifier le niveau d\'authentification' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      ),
    }
  }
  if (data?.currentLevel !== 'aal2') {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: 'Authentification renforcée requise (MFA)',
          required: 'aal2',
          actual: data?.currentLevel ?? 'aal1',
        }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      ),
    }
  }
  return { ok: true }
}
