import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";

/* =========================
   GET : détail d'un planning avec slots et affectations
   ========================= */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guard = await requirePermission(PERMISSIONS.VIEW_PLANNINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    // Récupérer le planning
    const { data: planning, error } = await supabase
      .from("plannings")
      .select(`
        id,
        name,
        description,
        date,
        status,
        created_at,
        updated_at,
        created_by,
        updated_by,
        event_id,
        events (
          id,
          name
        )
      `)
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .single();

    if (error || !planning) {
      console.error("[API][plannings][GET] Planning non trouvé:", error);
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les slots (avec slot_date si la migration est appliquée)
    const { data: slots, error: slotsError } = await supabase
      .from("planning_slots")
      .select(`
        id,
        location,
        slot_date,
        start_time,
        end_time,
        required_people,
        notes,
        ordre
      `)
      .eq("planning_id", id)
      .order("slot_date", { ascending: true })
      .order("ordre", { ascending: true });

    let slotsRows: any[];

    // Si la colonne slot_date n'existe pas encore ou autre erreur schéma : requête compatible ancienne base
    if (!slotsError && Array.isArray(slots)) {
      slotsRows = slots;
    } else {
      console.warn("[API][plannings][GET] slots (avec slot_date):", slotsError?.message || "no data");
      const { data: legacySlots, error: legacyError } = await supabase
        .from("planning_slots")
        .select("id, location, start_time, end_time, required_people, notes, ordre")
        .eq("planning_id", id)
        .order("ordre", { ascending: true });

      if (legacyError) {
        console.error("[API][plannings][GET] slots (fallback):", legacyError.message);
        slotsRows = [];
      } else {
        slotsRows = legacySlots || [];
      }
    }

    // Récupérer les affectations avec les infos membres
    const slotIds = (slotsRows || []).map((s: any) => s.id);
    let assignments: any[] = [];

    if (slotIds.length > 0) {
      const { data: assignmentsData } = await supabase
        .from("planning_assignments")
        .select(`
          id,
          slot_id,
          client_id,
          notified_at,
          created_at,
          source,
          public_name,
          public_email,
          public_phone,
          member_link_status,
          clients (
            id,
            nom,
            email,
            telephone,
            role,
            category
          )
        `)
        .in("slot_id", slotIds);

      assignments = assignmentsData || [];
    }

    const slotsWithAssignments = (slotsRows || []).map((slot: any) => {
      const slotAssignments = assignments
        .filter((a: any) => a.slot_id === slot.id)
        .map((a: any) => {
          const relRaw = a.clients;
          const rel = Array.isArray(relRaw) ? relRaw[0] : relRaw;
          const isPublic = a.source === "public_signup";
          const memberLinkStatus =
            a.member_link_status ||
            (isPublic ? (a.client_id ? "linked" : "unlinked") : null);

          return {
            id: a.id,
            slotId: a.slot_id,
            clientId: a.client_id,
            source: a.source || "internal_member",
            memberLinkStatus,
            member:
              isPublic && a.client_id && rel
                ? {
                    id: rel.id,
                    nom: rel.nom || a.public_name || "Bénévole",
                    email: rel.email ?? a.public_email ?? null,
                    telephone: rel.telephone ?? a.public_phone ?? null,
                    role: rel.role || "Bénévole",
                    category: rel.category || "public",
                    status: "member",
                  }
                : isPublic
                  ? {
                      id: `public-${a.id}`,
                      nom: a.public_name || "Bénévole",
                      email: a.public_email || null,
                      telephone: a.public_phone || null,
                      role: "Bénévole public",
                      category: "public",
                      status: "public",
                    }
                  : {
                      ...(rel || {}),
                      status: "member",
                    },
            notifiedAt: a.notified_at,
            createdAt: a.created_at,
          };
        });

      return {
        id: slot.id,
        location: slot.location,
        slotDate: slot.slot_date != null && String(slot.slot_date).trim() !== ""
          ? slot.slot_date
          : planning.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        requiredPeople: slot.required_people,
        notes: slot.notes,
        ordre: slot.ordre,
        assignments: slotAssignments,
        assignedCount: slotAssignments.length,
        isFull: slotAssignments.length >= slot.required_people,
      };
    });

    const totalRequired = slotsWithAssignments.reduce((sum: number, s: any) => sum + s.requiredPeople, 0);
    const totalAssigned = slotsWithAssignments.reduce((sum: number, s: any) => sum + s.assignedCount, 0);

    return NextResponse.json({
      planning: {
        ...planning,
        event: planning.events,
        slots: slotsWithAssignments,
        totalRequired,
        totalAssigned,
        fillRate: totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("[API][plannings][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement", details: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   PUT : mettre à jour un planning
   ========================= */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const user = guard.ctx.user;

    const body = await request.json();
    const { name, description, date, status, eventId } = body || {};

    // Vérifier que le planning appartient au club
    const { data: existingPlanning, error: fetchError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .single();

    if (fetchError || !existingPlanning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    const updatePayload: any = { updated_by: user.id };
    if (name !== undefined) updatePayload.name = name.trim();
    if (description !== undefined) updatePayload.description = description?.trim() || null;
    if (date !== undefined) updatePayload.date = date;
    if (status !== undefined) updatePayload.status = status;
    if (eventId !== undefined) updatePayload.event_id = eventId || null;

    const { data: updatedPlanning, error } = await supabase
      .from("plannings")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .select(`
        id,
        name,
        description,
        date,
        status,
        created_at,
        updated_at,
        event_id,
        events (
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error("[API][plannings][PUT] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord/plannings");
    revalidatePath(`/tableau-de-bord/plannings/${id}`);

    return NextResponse.json({
      planning: {
        ...updatedPlanning,
        event: updatedPlanning.events,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("[API][plannings][PUT] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour", details: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE : supprimer un planning
   ========================= */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    // Vérifier que le planning appartient au club
    const { data: existingPlanning, error: fetchError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .single();

    if (fetchError || !existingPlanning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le planning (les slots et affectations seront supprimés en cascade)
    const { error } = await supabase
      .from("plannings")
      .delete()
      .eq("id", id)
      .eq("user_id", guard.clubId);

    if (error) {
      console.error("[API][plannings][DELETE] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord/plannings");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API][plannings][DELETE] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: error.message },
      { status: 500 }
    );
  }
}
