import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import {
  ensureMemberParticipationForPlanning,
  refreshMemberParticipationAfterAssignmentsChange,
} from "@/lib/planning/memberParticipations";

export const runtime = "nodejs";

/**
 * PATCH : rattacher une inscription publique (ou ambiguë) à un membre du club.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const { id: planningId, assignmentId } = await params;
    const supabase = await createClient();

    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", planningId)
      .eq("user_id", guard.clubId)
      .single();

    if (planningError || !planning) {
      return NextResponse.json({ error: "Planning non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const clientId = typeof body?.clientId === "string" ? body.clientId.trim() : "";
    if (!clientId) {
      return NextResponse.json({ error: "L'ID du membre est requis" }, { status: 400 });
    }

    const { data: assignment, error: aErr } = await supabase
      .from("planning_assignments")
      .select(
        `
        id,
        slot_id,
        client_id,
        source,
        planning_slots!inner (
          planning_id
        )
      `
      )
      .eq("id", assignmentId)
      .single();

    if (aErr || !assignment) {
      return NextResponse.json({ error: "Affectation non trouvée" }, { status: 404 });
    }

    const slotMeta = assignment.planning_slots as { planning_id?: string } | { planning_id?: string }[];
    const slotPlanningId = Array.isArray(slotMeta)
      ? slotMeta[0]?.planning_id
      : slotMeta?.planning_id;
    if (slotPlanningId !== planningId) {
      return NextResponse.json({ error: "Affectation non trouvée" }, { status: 404 });
    }

    if (assignment.source !== "public_signup") {
      return NextResponse.json(
        { error: "Seules les inscriptions publiques peuvent être rattachées ainsi" },
        { status: 400 }
      );
    }

    const previousClientId = assignment.client_id as string | null;

    const { data: memberRow, error: mErr } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("user_id", guard.clubId)
      .maybeSingle();

    if (mErr || !memberRow) {
      return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
    }

    const { data: existingSameSlot } = await supabase
      .from("planning_assignments")
      .select("id")
      .eq("slot_id", assignment.slot_id)
      .eq("client_id", clientId)
      .neq("id", assignmentId)
      .maybeSingle();

    if (existingSameSlot) {
      return NextResponse.json(
        { error: "Ce membre est déjà inscrit sur ce créneau" },
        { status: 400 }
      );
    }

    const { data: updated, error: uErr } = await supabase
      .from("planning_assignments")
      .update({
        client_id: clientId,
        member_link_status: "linked",
      })
      .eq("id", assignmentId)
      .select(
        `
        id,
        slot_id,
        client_id,
        source,
        public_name,
        member_link_status,
        clients ( id, nom, email, telephone, role, category )
      `
      )
      .single();

    if (uErr || !updated) {
      console.error("[API][assignments][PATCH] update", uErr);
      return NextResponse.json(
        { error: "Erreur lors du rattachement", details: uErr?.message },
        { status: 500 }
      );
    }

    await ensureMemberParticipationForPlanning(supabase, {
      clientId,
      planningId,
    });

    if (previousClientId && previousClientId !== clientId) {
      await refreshMemberParticipationAfterAssignmentsChange(supabase, {
        clientId: previousClientId,
        planningId,
      });
    }

    revalidatePath(`/tableau-de-bord/plannings/${planningId}`);
    revalidatePath(`/tableau-de-bord/clients/${clientId}`);
    if (previousClientId && previousClientId !== clientId) {
      revalidatePath(`/tableau-de-bord/clients/${previousClientId}`);
    }

    const relRaw = updated.clients;
    const rel = Array.isArray(relRaw) ? relRaw[0] : relRaw;

    return NextResponse.json(
      {
        assignment: {
          id: updated.id,
          clientId: updated.client_id,
          source: updated.source,
          memberLinkStatus: updated.member_link_status,
          member: rel
            ? {
                id: rel.id,
                nom: rel.nom || updated.public_name || "Membre",
                email: rel.email ?? null,
                telephone: rel.telephone ?? null,
                role: rel.role,
                category: rel.category,
                status: "member",
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur";
    console.error("[API][assignments][PATCH]", error);
    return NextResponse.json({ error: "Erreur lors du rattachement", details: message }, { status: 500 });
  }
}
