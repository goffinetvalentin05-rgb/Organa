import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

/* =========================
   POST : créer un créneau horaire
   ========================= */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planningId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le planning appartient à l'utilisateur
    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", planningId)
      .eq("user_id", user.id)
      .single();

    if (planningError || !planning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { location, startTime, endTime, requiredPeople, notes } = body || {};

    // Validation
    if (!location || typeof location !== "string" || location.trim().length === 0) {
      return NextResponse.json(
        { error: "Le lieu/rôle est requis" },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Les heures de début et fin sont requises" },
        { status: 400 }
      );
    }

    // Récupérer l'ordre max actuel
    const { data: maxOrdreData } = await supabase
      .from("planning_slots")
      .select("ordre")
      .eq("planning_id", planningId)
      .order("ordre", { ascending: false })
      .limit(1);

    const maxOrdre = maxOrdreData?.[0]?.ordre ?? -1;

    const payload = {
      planning_id: planningId,
      location: location.trim(),
      start_time: startTime,
      end_time: endTime,
      required_people: requiredPeople || 1,
      notes: notes?.trim() || null,
      ordre: maxOrdre + 1,
    };

    const { data: newSlot, error } = await supabase
      .from("planning_slots")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[API][slots][POST] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création du créneau", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath(`/tableau-de-bord/plannings/${planningId}`);

    return NextResponse.json({
      slot: {
        id: newSlot.id,
        location: newSlot.location,
        startTime: newSlot.start_time,
        endTime: newSlot.end_time,
        requiredPeople: newSlot.required_people,
        notes: newSlot.notes,
        ordre: newSlot.ordre,
        assignments: [],
        assignedCount: 0,
        isFull: false,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("[API][slots][POST] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création", details: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   PUT : mettre à jour un créneau
   ========================= */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planningId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le planning appartient à l'utilisateur
    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", planningId)
      .eq("user_id", user.id)
      .single();

    if (planningError || !planning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { slotId, location, startTime, endTime, requiredPeople, notes } = body || {};

    if (!slotId) {
      return NextResponse.json(
        { error: "L'ID du créneau est requis" },
        { status: 400 }
      );
    }

    const updatePayload: any = {};
    if (location !== undefined) updatePayload.location = location.trim();
    if (startTime !== undefined) updatePayload.start_time = startTime;
    if (endTime !== undefined) updatePayload.end_time = endTime;
    if (requiredPeople !== undefined) updatePayload.required_people = requiredPeople;
    if (notes !== undefined) updatePayload.notes = notes?.trim() || null;

    const { data: updatedSlot, error } = await supabase
      .from("planning_slots")
      .update(updatePayload)
      .eq("id", slotId)
      .eq("planning_id", planningId)
      .select()
      .single();

    if (error) {
      console.error("[API][slots][PUT] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath(`/tableau-de-bord/plannings/${planningId}`);

    return NextResponse.json({
      slot: {
        id: updatedSlot.id,
        location: updatedSlot.location,
        startTime: updatedSlot.start_time,
        endTime: updatedSlot.end_time,
        requiredPeople: updatedSlot.required_people,
        notes: updatedSlot.notes,
        ordre: updatedSlot.ordre,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("[API][slots][PUT] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour", details: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE : supprimer un créneau
   ========================= */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planningId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le planning appartient à l'utilisateur
    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", planningId)
      .eq("user_id", user.id)
      .single();

    if (planningError || !planning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get("slotId");

    if (!slotId) {
      return NextResponse.json(
        { error: "L'ID du créneau est requis" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("planning_slots")
      .delete()
      .eq("id", slotId)
      .eq("planning_id", planningId);

    if (error) {
      console.error("[API][slots][DELETE] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath(`/tableau-de-bord/plannings/${planningId}`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API][slots][DELETE] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: error.message },
      { status: 500 }
    );
  }
}
