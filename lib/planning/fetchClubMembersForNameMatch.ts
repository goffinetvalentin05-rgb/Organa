import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClubMemberForMatch } from "@/lib/planning/matchPublicNameToMember";

/**
 * Charge les membres du club pour le matching d’inscription publique.
 * Colonnes clients : `id, nom` ; `deleted_at` si présent.
 */
export async function fetchClubMembersForNameMatch(
  supabase: SupabaseClient,
  clubId: string
): Promise<{ members: ClubMemberForMatch[]; selectUsed: string; error?: string }> {
  const selectAttempts = [
    "id, nom, deleted_at",
    "id, nom",
  ];

  for (const sel of selectAttempts) {
    const { data, error } = await supabase.from("clients").select(sel).eq("user_id", clubId);

    if (error) {
      continue;
    }

    const rows = (data || []) as unknown as Record<string, unknown>[];
    const members: ClubMemberForMatch[] = rows
      .filter((r) => {
        const del = r.deleted_at;
        return del == null || del === "";
      })
      .map((r) => ({
        id: String(r.id),
        nom: (r.nom as string | null | undefined) ?? null,
        name: (r.name as string | null | undefined) ?? null,
        first_name: (r.first_name as string | null | undefined) ?? null,
        last_name: (r.last_name as string | null | undefined) ?? null,
      }));

    return { members, selectUsed: sel };
  }

  return {
    members: [],
    selectUsed: "(none)",
    error: "Impossible de charger les membres du club pour le matching",
  };
}
