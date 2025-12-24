/**
 * Source unique de vérité pour récupérer le plan de l'utilisateur
 * 
 * Cette fonction garantit que:
 * - Le plan vient UNIQUEMENT de public.profiles.plan
 * - Si aucun profil n'existe, il est créé avec plan='free'
 * - Retourne toujours 'free' ou 'pro'
 */

import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

export interface PlanResult {
  plan: Plan;
}

/**
 * Récupère le plan de l'utilisateur authentifié
 * 
 * @returns PlanResult avec le plan de l'utilisateur
 * @throws Error si l'utilisateur n'est pas authentifié
 */
export async function getPlan(): Promise<PlanResult> {
  const supabase = await createClient();

  // 1. Récupérer l'utilisateur authentifié
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[BILLING][getPlan] Utilisateur non authentifié", { error: userError });
    throw new Error("Utilisateur non authentifié");
  }

  // 2. Lire le plan depuis profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  // 3. Si aucun profil existe, le créer avec plan='free'
  if (!profile) {
    console.log(`[BILLING][getPlan] Profil inexistant pour user_id=${user.id}, création avec plan=free`);
    
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        plan: "free",
      });

    if (insertError) {
      console.error("[BILLING][getPlan] Erreur lors de la création du profil", insertError);
      // En cas d'erreur, retourner 'free' par défaut pour ne pas bloquer
      return { plan: "free" };
    }

    // Profil créé, retourner 'free'
    return { plan: "free" };
  }

  if (profileError) {
    console.error("[BILLING][getPlan] Erreur lors de la lecture du profil", profileError);
    // En cas d'erreur, retourner 'free' par défaut
    return { plan: "free" };
  }

  // 4. Valider et retourner le plan
  const plan = profile?.plan === "pro" ? "pro" : "free";
  
  console.log(`[BILLING][getPlan] user_id=${user.id} plan=${plan}`);
  
  return { plan };
}

