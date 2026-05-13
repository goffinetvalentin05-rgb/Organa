import type { SupabaseClient } from "@supabase/supabase-js";

export type { MemberParticipationStatus } from "@/lib/planning/participationStatus";
export { MEMBER_PARTICIPATION_STATUSES, participationStatusLabelFr } from "@/lib/planning/participationStatus";

/**
 * Crée ou réactive une participation (inscription liée au membre).
 * Met à jour titre / date / event si la ligne existait déjà (ex. statut cancelled).
 */
export async function ensureMemberParticipationForPlanning(
  supabase: SupabaseClient,
  params: {
    memberId: string;
    planningId: string;
    /** Utilisateur staff ayant déclenché l’action ; null pour le lien public */
    createdBy?: string | null;
  }
): Promise<void> {
  const { data: planning, error: pErr } = await supabase
    .from("plannings")
    .select("id, name, date, event_id, user_id")
    .eq("id", params.planningId)
    .maybeSingle();

  if (pErr || !planning) {
    console.error("[memberParticipations] planning introuvable", pErr?.message);
    return;
  }

  const clubId = planning.user_id as string;
  const eventTitle = (planning.name as string)?.trim() || "Planning";
  const eventDate = (planning.date as string) || null;
  const eventId = (planning.event_id as string | null) ?? null;

  const { data: existing, error: exErr } = await supabase
    .from("member_participations")
    .select("id, status, created_by")
    .eq("planning_id", params.planningId)
    .eq("member_id", params.memberId)
    .maybeSingle();

  if (exErr) {
    console.error("[memberParticipations] lecture existant", exErr.message);
    return;
  }

  const now = new Date().toISOString();

  if (existing?.id) {
    const { error: upErr } = await supabase
      .from("member_participations")
      .update({
        event_title: eventTitle,
        event_date: eventDate,
        event_id: eventId,
        club_id: clubId,
        status: "registered",
        updated_at: now,
      })
      .eq("id", existing.id);

    if (upErr) {
      console.error("[memberParticipations] update", upErr.message);
    }
    return;
  }

  const insertRow: Record<string, unknown> = {
    club_id: clubId,
    member_id: params.memberId,
    planning_id: params.planningId,
    event_id: eventId,
    event_title: eventTitle,
    event_date: eventDate,
    status: "registered",
    created_by: params.createdBy ?? null,
    created_at: now,
    updated_at: now,
  };

  const { error: insErr } = await supabase.from("member_participations").insert(insertRow);

  if (insErr && insErr.code !== "23505") {
    console.error("[memberParticipations] insert", insErr.message);
  }
}

/**
 * Après suppression d’une affectation : si plus aucune inscription liée pour ce membre
 * sur ce planning → participation en « cancelled » (conservée en base).
 * Sinon, s’assure que la ligne reflète toujours le planning (registered).
 */
export async function refreshMemberParticipationAfterAssignmentsChange(
  supabase: SupabaseClient,
  params: { memberId: string | null; planningId: string }
): Promise<void> {
  if (!params.memberId) return;

  const { data: slots, error: sErr } = await supabase
    .from("planning_slots")
    .select("id")
    .eq("planning_id", params.planningId);

  if (sErr) {
    console.error("[memberParticipations] slots", sErr.message);
    return;
  }

  const slotIds = (slots || []).map((s) => s.id);
  let count = 0;
  if (slotIds.length > 0) {
    const { count: c, error: cErr } = await supabase
      .from("planning_assignments")
      .select("*", { count: "exact", head: true })
      .in("slot_id", slotIds)
      .eq("client_id", params.memberId);

    if (cErr) {
      console.error("[memberParticipations] count assignments", cErr.message);
      return;
    }
    count = c ?? 0;
  }

  if (count === 0) {
    const { error: cancelErr } = await supabase
      .from("member_participations")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("planning_id", params.planningId)
      .eq("member_id", params.memberId);

    if (cancelErr) {
      console.error("[memberParticipations] cancel", cancelErr.message);
    }
    return;
  }

  await ensureMemberParticipationForPlanning(supabase, {
    memberId: params.memberId,
    planningId: params.planningId,
    createdBy: null,
  });
}

/**
 * Quand un planning est modifié : aligner titre et événement des participations liées.
 * La date affichée côté membre reste celle connue à l’inscription (`event_date`) : la
 * « date générale » du planning ne doit pas réécrire les dates des créneaux ni
 * déplacer arbitrairement les métadonnées calendaires des bénévoles.
 */
export async function syncMemberParticipationsWithPlanning(
  supabase: SupabaseClient,
  params: { planningId: string; name: string; eventId: string | null }
): Promise<void> {
  const eventTitle = params.name?.trim() || "Planning";
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("member_participations")
    .update({
      event_title: eventTitle,
      event_id: params.eventId,
      updated_at: now,
    })
    .eq("planning_id", params.planningId);

  if (error) {
    console.error("[memberParticipations] sync planning edit", error.message);
  }
}
