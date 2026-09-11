import type { SupabaseClient } from "@supabase/supabase-js";
import { DPA_VERSION, TERMS_VERSION } from "@/lib/legal/versions";

export async function recordClubLegalAcceptance(
  admin: SupabaseClient,
  input: { clubId: string; userId: string }
): Promise<{ error: string | null }> {
  const { error } = await admin.from("legal_acceptances").upsert(
    {
      club_id: input.clubId,
      user_id: input.userId,
      terms_version: TERMS_VERSION,
      dpa_version: DPA_VERSION,
    },
    {
      onConflict: "club_id,user_id,terms_version,dpa_version",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    console.error("[legal] Échec d’enregistrement de l’acceptation:", error.message);
    return { error: error.message };
  }
  return { error: null };
}
