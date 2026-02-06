import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

export const runtime = "nodejs";

/* =========================
   GET : liste des plannings avec slots et affectations
   ========================= */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les plannings avec les événements liés
    const { data: plannings, error } = await supabase
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
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("[API][plannings][GET] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement des plannings", details: error.message },
        { status: 500 }
      );
    }

    // Pour chaque planning, récupérer les stats des slots et affectations
    const planningIds = (plannings || []).map((p: any) => p.id);
    
    let slotsStats: any[] = [];
    let assignmentsStats: any[] = [];

    if (planningIds.length > 0) {
      // Récupérer les slots
      const { data: slots } = await supabase
        .from("planning_slots")
        .select("id, planning_id, required_people")
        .in("planning_id", planningIds);

      slotsStats = slots || [];

      // Récupérer les affectations
      const slotIds = slotsStats.map((s: any) => s.id);
      if (slotIds.length > 0) {
        const { data: assignments } = await supabase
          .from("planning_assignments")
          .select("slot_id")
          .in("slot_id", slotIds);
        
        assignmentsStats = assignments || [];
      }
    }

    // Calculer les stats par planning
    const planningsWithStats = (plannings || []).map((planning: any) => {
      const planningSlots = slotsStats.filter((s: any) => s.planning_id === planning.id);
      const totalRequired = planningSlots.reduce((sum: number, s: any) => sum + (s.required_people || 0), 0);
      const slotIds = planningSlots.map((s: any) => s.id);
      const totalAssigned = assignmentsStats.filter((a: any) => slotIds.includes(a.slot_id)).length;

      return {
        ...planning,
        event: planning.events,
        slotsCount: planningSlots.length,
        totalRequired,
        totalAssigned,
        fillRate: totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0,
      };
    });

    return NextResponse.json({ plannings: planningsWithStats }, { status: 200 });
  } catch (error: any) {
    console.error("[API][plannings][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement", details: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   POST : créer un planning
   ========================= */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier l'accès en écriture (trial actif ou abonnement)
    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) {
      return accessCheck.response;
    }

    const body = await request.json();
    const { name, description, date, status, eventId, slots } = body || {};

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du planning est requis" },
        { status: 400 }
      );
    }

    if (!date || typeof date !== "string") {
      return NextResponse.json(
        { error: "La date est requise" },
        { status: 400 }
      );
    }

    const payload = {
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      date: date,
      status: status || "draft",
      event_id: eventId || null,
    };

    const { data: newPlanning, error } = await supabase
      .from("plannings")
      .insert(payload)
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
      console.error("[API][plannings][POST] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création du planning", details: error.message },
        { status: 500 }
      );
    }

    // Créer les slots si fournis
    if (slots && Array.isArray(slots) && slots.length > 0) {
      const slotsPayload = slots.map((slot: any, index: number) => ({
        planning_id: newPlanning.id,
        location: slot.location || "Poste",
        start_time: slot.startTime,
        end_time: slot.endTime,
        required_people: slot.requiredPeople || 1,
        notes: slot.notes || null,
        ordre: index,
      }));

      const { error: slotsError } = await supabase
        .from("planning_slots")
        .insert(slotsPayload);

      if (slotsError) {
        console.error("[API][plannings][POST] Erreur création slots:", slotsError);
      }
    }

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/plannings");

    return NextResponse.json(
      {
        planning: {
          ...newPlanning,
          event: newPlanning.events,
          slotsCount: slots?.length || 0,
          totalRequired: slots?.reduce((sum: number, s: any) => sum + (s.requiredPeople || 1), 0) || 0,
          totalAssigned: 0,
          fillRate: 0,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API][plannings][POST] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création", details: error.message },
      { status: 500 }
    );
  }
}
