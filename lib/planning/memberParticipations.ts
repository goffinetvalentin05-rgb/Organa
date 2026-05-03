import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Crée une participation membre/planning si absent (idempotent).
 * À appeler après une affectation avec client_id défini.
 */
export async function ensureMemberParticipationForPlanning(
  supabase: SupabaseClient,
  params: { clientId: string; planningId: string }
): Promise<void> {
  const { data: planning, error: pErr } = await supabase
    .from("plannings")
    .select("event_id")
    .eq("id", params.planningId)
    .maybeSingle();

  if (pErr || !planning) {
    console.error("[memberParticipations] planning introuvable", pErr?.message);
    return;
  }

  const { error } = await supabase.from("member_participations").insert({
    client_id: params.clientId,
    planning_id: params.planningId,
    event_id: planning.event_id ?? null,
  });

  if (error && error.code !== "23505") {
    console.error("[memberParticipations] insert", error.message);
  }
}

/**
 * Supprime la ligne de participation si le membre n'a plus aucune affectation
 * (tous créneaux confondus) sur ce planning.
 */
export async function refreshMemberParticipationAfterAssignmentsChange(
  supabase: SupabaseClient,
  params: { clientId: string | null; planningId: string }
): Promise<void> {
  if (!params.clientId) return;

  const { data: slots, error: sErr } = await supabase
    .from("planning_slots")
    .select("id")
    .eq("planning_id", params.planningId);

  if (sErr || !slots?.length) {
    await supabase
      .from("member_participations")
      .delete()
      .eq("planning_id", params.planningId)
      .eq("client_id", params.clientId);
    return;
  }

  const slotIds = slots.map((s) => s.id);
  const { count, error: cErr } = await supabase
    .from("planning_assignments")
    .select("*", { count: "exact", head: true })
    .in("slot_id", slotIds)
    .eq("client_id", params.clientId);

  if (cErr) {
    console.error("[memberParticipations] count assignments", cErr.message);
    return;
  }

  if ((count ?? 0) === 0) {
    await supabase
      .from("member_participations")
      .delete()
      .eq("planning_id", params.planningId)
      .eq("client_id", params.clientId);
  }
}
