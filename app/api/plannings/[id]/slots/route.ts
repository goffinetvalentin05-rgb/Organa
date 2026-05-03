import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isMissingSlotDateColumnError } from "@/lib/planning/slotDateFallback";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";

/* =========================
   POST : créer un créneau horaire
   ========================= */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const { id: planningId } = await params;
    const supabase = await createClient();

    // Vérifier que le planning appartient au club courant
    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("id, date")
      .eq("id", planningId)
      .eq("user_id", guard.clubId)
      .single();

    if (planningError || !planning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    const planningDate = planning.date as string;

    const body = await request.json();
    const { location, slotDate, startTime, endTime, requiredPeople, notes } = body || {};

    // Validation
    if (!location || typeof location !== "string" || location.trim().length === 0) {
      return NextResponse.json(
        { error: "Le lieu/rôle est requis" },
        { status: 400 }
      );
    }

    if (!slotDate || typeof slotDate !== "string") {
      return NextResponse.json(
        { error: "La date du créneau est requise" },
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
      slot_date: slotDate,
      start_time: startTime,
      end_time: endTime,
      required_people: requiredPeople || 1,
      notes: notes?.trim() || null,
      ordre: maxOrdre + 1,
    };

    let newSlot: Record<string, unknown> | null = null;
    let insertError = null as { message?: string; code?: string } | null;

    const insertResult = await supabase
      .from("planning_slots")
      .insert(payload)
      .select()
      .single();

    newSlot = insertResult.data as Record<string, unknown> | null;
    insertError = insertResult.error;

    if (insertError && isMissingSlotDateColumnError(insertError)) {
      const legacyPayload = {
        planning_id: planningId,
        location: location.trim(),
        start_time: startTime,
        end_time: endTime,
        required_people: requiredPeople || 1,
        notes: notes?.trim() || null,
        ordre: maxOrdre + 1,
      };
      const legacy = await supabase
        .from("planning_slots")
        .insert(legacyPayload)
        .select()
        .single();
      newSlot = legacy.data as Record<string, unknown> | null;
      insertError = legacy.error;
    }

    if (insertError || !newSlot) {
      console.error("[API][slots][POST] Erreur Supabase:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la création du créneau", details: insertError?.message },
        { status: 500 }
      );
    }

    const slotDateOut =
      newSlot.slot_date != null && String(newSlot.slot_date).trim() !== ""
        ? String(newSlot.slot_date)
        : slotDate || planningDate;

    revalidatePath(`/tableau-de-bord/plannings/${planningId}`);

    return NextResponse.json({
      slot: {
        id: newSlot.id,
        location: newSlot.location,
        slotDate: slotDateOut,
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
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const { id: planningId } = await params;
    const supabase = await createClient();

    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("id, date")
      .eq("id", planningId)
      .eq("user_id", guard.clubId)
      .single();

    if (planningError || !planning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    const planningDate = planning.date as string;

    const body = await request.json();
    const { slotId, location, slotDate, startTime, endTime, requiredPeople, notes } = body || {};

    if (!slotId) {
      return NextResponse.json(
        { error: "L'ID du créneau est requis" },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {};
    if (location !== undefined) updatePayload.location = location.trim();
    if (slotDate !== undefined) updatePayload.slot_date = slotDate;
    if (startTime !== undefined) updatePayload.start_time = startTime;
    if (endTime !== undefined) updatePayload.end_time = endTime;
    if (requiredPeople !== undefined) updatePayload.required_people = requiredPeople;
    if (notes !== undefined) updatePayload.notes = notes?.trim() || null;

    let { data: updatedSlot, error } = await supabase
      .from("planning_slots")
      .update(updatePayload)
      .eq("id", slotId)
      .eq("planning_id", planningId)
      .select()
      .single();

    if (
      error &&
      isMissingSlotDateColumnError(error) &&
      updatePayload.slot_date !== undefined
    ) {
      const { slot_date: _omit, ...rest } = updatePayload;
      if (Object.keys(rest).length > 0) {
        const retry = await supabase
          .from("planning_slots")
          .update(rest)
          .eq("id", slotId)
          .eq("planning_id", planningId)
          .select()
          .single();
        updatedSlot = retry.data;
        error = retry.error;
      } else {
        const current = await supabase
          .from("planning_slots")
          .select("*")
          .eq("id", slotId)
          .eq("planning_id", planningId)
          .single();
        updatedSlot = current.data;
        error = current.error;
      }
    }

    if (error || !updatedSlot) {
      console.error("[API][slots][PUT] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour", details: error?.message },
        { status: 500 }
      );
    }

    const row = updatedSlot as {
      id: string;
      location: string;
      slot_date?: string | null;
      start_time: string;
      end_time: string;
      required_people: number;
      notes?: string | null;
      ordre: number;
    };

    const slotDateOut =
      row.slot_date != null && String(row.slot_date).trim() !== ""
        ? String(row.slot_date)
        : typeof slotDate === "string" && slotDate.trim() !== ""
          ? slotDate.trim()
          : planningDate;

    revalidatePath(`/tableau-de-bord/plannings/${planningId}`);

    return NextResponse.json({
      slot: {
        id: row.id,
        location: row.location,
        slotDate: slotDateOut,
        startTime: row.start_time,
        endTime: row.end_time,
        requiredPeople: row.required_people,
        notes: row.notes,
        ordre: row.ordre,
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
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const { id: planningId } = await params;
    const supabase = await createClient();

    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", planningId)
      .eq("user_id", guard.clubId)
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
