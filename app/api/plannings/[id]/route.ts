import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

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
        event_id,
        events (
          id,
          name
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !planning) {
      console.error("[API][plannings][GET] Planning non trouvé:", error);
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les slots
    const { data: slots } = await supabase
      .from("planning_slots")
      .select(`
        id,
        location,
        start_time,
        end_time,
        required_people,
        notes,
        ordre
      `)
      .eq("planning_id", id)
      .order("ordre", { ascending: true });

    // Récupérer les affectations avec les infos membres
    const slotIds = (slots || []).map((s: any) => s.id);
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

    // Structurer les slots avec leurs affectations
    const slotsWithAssignments = (slots || []).map((slot: any) => {
      const slotAssignments = assignments
        .filter((a: any) => a.slot_id === slot.id)
        .map((a: any) => ({
          id: a.id,
          clientId: a.client_id,
          member: a.clients,
          notifiedAt: a.notified_at,
          createdAt: a.created_at,
        }));

      return {
        id: slot.id,
        location: slot.location,
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, date, status, eventId } = body || {};

    // Vérifier que le planning appartient à l'utilisateur
    const { data: existingPlanning, error: fetchError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingPlanning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (description !== undefined) updatePayload.description = description?.trim() || null;
    if (date !== undefined) updatePayload.date = date;
    if (status !== undefined) updatePayload.status = status;
    if (eventId !== undefined) updatePayload.event_id = eventId || null;

    const { data: updatedPlanning, error } = await supabase
      .from("plannings")
      .update(updatePayload)
      .eq("id", id)
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le planning appartient à l'utilisateur
    const { data: existingPlanning, error: fetchError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
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
      .eq("id", id);

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
