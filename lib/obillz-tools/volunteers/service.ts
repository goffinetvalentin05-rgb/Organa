import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSlotTimeRangeError } from "@/lib/planning/slotTimeRange";
import { isMissingSlotDateColumnError } from "@/lib/planning/slotDateFallback";
import {
  ensureMemberParticipationForPlanning,
  refreshMemberParticipationAfterAssignmentsChange,
} from "@/lib/planning/memberParticipations";
import { ToolError } from "@/lib/obillz-tools/core/errors";

export async function listPlanningsForClub(clubId: string) {
  const supabase = await createClient();
  const { data: plannings, error } = await supabase
    .from("plannings")
    .select(
      `id, name, description, date, status, created_at, updated_at, event_id, events (id, name)`
    )
    .eq("user_id", clubId)
    .order("date", { ascending: false });

  if (error) {
    throw new ToolError(
      "Erreur lors du chargement des plannings",
      "PLANNINGS_LIST_FAILED",
      500
    );
  }
  return plannings || [];
}

export async function createPlanningForClub(params: {
  clubId: string;
  actorUserId: string;
  name: string;
  date: string;
  description?: string;
  eventId?: string;
  slots?: Array<{
    location: string;
    startTime: string;
    endTime: string;
    requiredPeople?: number;
    slotDate?: string;
  }>;
}) {
  if (!params.name?.trim()) {
    throw new ToolError("Le nom du planning est requis", "PLANNING_NAME_REQUIRED");
  }
  if (!params.date) {
    throw new ToolError("La date est requise", "PLANNING_DATE_REQUIRED");
  }

  const supabase = await createClient();
  const { data: newPlanning, error } = await supabase
    .from("plannings")
    .insert({
      user_id: params.clubId,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      date: params.date,
      status: "draft",
      event_id: params.eventId || null,
      created_by: params.actorUserId,
      updated_by: params.actorUserId,
    })
    .select("id, name, description, date, status, event_id")
    .single();

  if (error || !newPlanning) {
    throw new ToolError(
      "Erreur lors de la création du planning",
      "PLANNING_CREATE_FAILED",
      500
    );
  }

  if (params.slots?.length) {
    for (const slot of params.slots) {
      const timeError = getSlotTimeRangeError(slot.startTime, slot.endTime);
      if (timeError) throw new ToolError(timeError, "SLOT_TIME_INVALID");
    }
    const slotsPayload = params.slots.map((slot, index) => ({
      planning_id: newPlanning.id,
      location: slot.location || "Poste",
      slot_date: slot.slotDate || params.date,
      start_time: slot.startTime,
      end_time: slot.endTime,
      required_people: slot.requiredPeople || 1,
      ordre: index,
    }));
    let { error: slotsError } = await supabase.from("planning_slots").insert(slotsPayload);
    if (slotsError && isMissingSlotDateColumnError(slotsError)) {
      const retry = await supabase.from("planning_slots").insert(
        params.slots.map((slot, index) => ({
          planning_id: newPlanning.id,
          location: slot.location || "Poste",
          start_time: slot.startTime,
          end_time: slot.endTime,
          required_people: slot.requiredPeople || 1,
          ordre: index,
        }))
      );
      slotsError = retry.error;
    }
    if (slotsError) {
      throw new ToolError("Erreur création des postes", "SLOTS_CREATE_FAILED", 500);
    }
  }

  return newPlanning;
}

export async function createShiftForClub(params: {
  clubId: string;
  planningId: string;
  location: string;
  startTime: string;
  endTime: string;
  requiredPeople?: number;
  slotDate?: string;
}) {
  const supabase = await createClient();
  const { data: planning, error: planningError } = await supabase
    .from("plannings")
    .select("id, date")
    .eq("id", params.planningId)
    .eq("user_id", params.clubId)
    .single();

  if (planningError || !planning) {
    throw new ToolError("Planning non trouvé", "PLANNING_NOT_FOUND", 404);
  }

  const timeError = getSlotTimeRangeError(params.startTime, params.endTime);
  if (timeError) throw new ToolError(timeError, "SLOT_TIME_INVALID");
  if (!params.location?.trim()) {
    throw new ToolError("Le lieu/rôle est requis", "SLOT_LOCATION_REQUIRED");
  }

  const payload = {
    planning_id: params.planningId,
    location: params.location.trim(),
    slot_date: params.slotDate || planning.date,
    start_time: params.startTime,
    end_time: params.endTime,
    required_people: params.requiredPeople || 1,
  };

  const { data, error } = await supabase
    .from("planning_slots")
    .insert(payload)
    .select("id, location, start_time, end_time, required_people, slot_date")
    .single();

  if (error) {
    throw new ToolError("Erreur lors de la création du créneau", "SLOT_CREATE_FAILED", 500);
  }
  return data;
}

export async function assignVolunteerForClub(params: {
  clubId: string;
  planningId: string;
  slotId: string;
  memberId: string;
}) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: planning, error: planningError } = await supabase
    .from("plannings")
    .select("id")
    .eq("id", params.planningId)
    .eq("user_id", params.clubId)
    .single();
  if (planningError || !planning) {
    throw new ToolError("Planning non trouvé", "PLANNING_NOT_FOUND", 404);
  }

  const { data: slot, error: slotError } = await supabase
    .from("planning_slots")
    .select("id, required_people")
    .eq("id", params.slotId)
    .eq("planning_id", params.planningId)
    .single();
  if (slotError || !slot) {
    throw new ToolError("Créneau non trouvé", "SLOT_NOT_FOUND", 404);
  }

  const { data: member } = await admin
    .from("clients")
    .select("id, nom")
    .eq("id", params.memberId)
    .eq("user_id", params.clubId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) {
    throw new ToolError("Membre non trouvé", "MEMBER_NOT_FOUND", 404);
  }

  const { count } = await supabase
    .from("planning_assignments")
    .select("*", { count: "exact", head: true })
    .eq("slot_id", params.slotId);
  if ((count ?? 0) >= (slot.required_people || 1)) {
    throw new ToolError("Ce créneau est déjà complet", "SLOT_FULL");
  }

  const { data: assignment, error } = await supabase
    .from("planning_assignments")
    .insert({
      slot_id: params.slotId,
      client_id: params.memberId,
      source: "internal_member",
    })
    .select("id, slot_id, client_id")
    .single();

  if (error) {
    throw new ToolError("Erreur d’affectation", "ASSIGN_FAILED", 500);
  }

  await ensureMemberParticipationForPlanning(admin, {
    planningId: params.planningId,
    memberId: params.memberId,
  });
  await refreshMemberParticipationAfterAssignmentsChange(supabase, {
    planningId: params.planningId,
    memberId: params.memberId,
  });

  return assignment;
}

export async function removeVolunteerForClub(params: {
  clubId: string;
  planningId: string;
  assignmentId: string;
}) {
  const supabase = await createClient();
  const { data: planning } = await supabase
    .from("plannings")
    .select("id")
    .eq("id", params.planningId)
    .eq("user_id", params.clubId)
    .maybeSingle();
  if (!planning) {
    throw new ToolError("Planning non trouvé", "PLANNING_NOT_FOUND", 404);
  }

  const { data, error } = await supabase
    .from("planning_assignments")
    .delete()
    .eq("id", params.assignmentId)
    .select("id");

  if (error || !data?.length) {
    throw new ToolError("Affectation introuvable", "ASSIGNMENT_NOT_FOUND", 404);
  }
  return { success: true as const, id: params.assignmentId };
}
