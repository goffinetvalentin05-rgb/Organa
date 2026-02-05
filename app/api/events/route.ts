import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

/* =========================
   GET : liste des événements avec totaux financiers
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

    // Récupérer les événements avec le type
    const { data: events, error } = await supabase
      .from("events")
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        status,
        created_at,
        updated_at,
        event_type_id,
        event_types (
          id,
          name
        )
      `)
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("[API][events][GET] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement des événements", details: error.message },
        { status: 500 }
      );
    }

    // Récupérer les totaux des revenus (documents liés)
    const { data: documentsData } = await supabase
      .from("documents")
      .select("event_id, total_ttc")
      .eq("user_id", user.id)
      .not("event_id", "is", null);

    // Récupérer les totaux des dépenses (expenses liées)
    const { data: expensesData } = await supabase
      .from("expenses")
      .select("event_id, amount")
      .eq("user_id", user.id)
      .not("event_id", "is", null);

    // Calculer les totaux par événement
    const revenueByEvent: Record<string, number> = {};
    const expensesByEvent: Record<string, number> = {};

    (documentsData || []).forEach((doc: any) => {
      if (doc.event_id) {
        revenueByEvent[doc.event_id] = (revenueByEvent[doc.event_id] || 0) + (Number(doc.total_ttc) || 0);
      }
    });

    (expensesData || []).forEach((exp: any) => {
      if (exp.event_id) {
        expensesByEvent[exp.event_id] = (expensesByEvent[exp.event_id] || 0) + (Number(exp.amount) || 0);
      }
    });

    // Enrichir les événements avec les totaux
    const eventsWithFinancials = (events || []).map((event: any) => ({
      ...event,
      eventType: event.event_types,
      totalRevenue: revenueByEvent[event.id] || 0,
      totalExpenses: expensesByEvent[event.id] || 0,
      netResult: (revenueByEvent[event.id] || 0) - (expensesByEvent[event.id] || 0),
    }));

    return NextResponse.json({ events: eventsWithFinancials }, { status: 200 });
  } catch (error: any) {
    console.error("[API][events][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement", details: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   POST : créer un événement
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

    const body = await request.json();
    const { name, description, startDate, endDate, status, eventTypeId } = body || {};

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom de l'événement est requis" },
        { status: 400 }
      );
    }

    if (!startDate || typeof startDate !== "string") {
      return NextResponse.json(
        { error: "La date de début est requise" },
        { status: 400 }
      );
    }

    // Vérifier le plan et les limites
    const { getPlan } = await import("@/lib/billing/getPlan");
    const { MAX_EVENTS_FREE, getLimitErrorMessage } = await import("@/lib/billing/limits");

    let planResult;
    try {
      planResult = await getPlan();
    } catch (error: any) {
      console.error("[API][events][POST] Erreur récupération plan", error);
      return NextResponse.json(
        { error: "Erreur lors de la vérification du plan" },
        { status: 500 }
      );
    }

    const plan = planResult.plan;

    // Si plan gratuit, vérifier la limite d'événements
    if (plan === "free") {
      const { count, error: countError } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) {
        console.error("[LIMIT][events] Erreur comptage", { user_id: user.id, error: countError });
        return NextResponse.json(
          { error: "Erreur lors de la vérification des limites" },
          { status: 500 }
        );
      }

      const currentCount = count ?? 0;
      console.log(`[LIMIT][events] user=${user.id} plan=${plan} count=${currentCount} max=${MAX_EVENTS_FREE}`);

      if (currentCount >= MAX_EVENTS_FREE) {
        return NextResponse.json(
          {
            error: "LIMIT_REACHED",
            message: getLimitErrorMessage("events", plan),
            limit: MAX_EVENTS_FREE,
            current: currentCount,
            plan: plan,
          },
          { status: 403 }
        );
      }
    }

    const payload = {
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      start_date: startDate,
      end_date: endDate || null,
      status: status === "completed" ? "completed" : "planned",
      event_type_id: eventTypeId || null,
    };

    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        status,
        created_at,
        updated_at,
        event_type_id,
        event_types (
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error("[API][events][POST] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'événement", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/evenements");

    return NextResponse.json(
      {
        event: {
          ...data,
          eventType: data.event_types,
          totalRevenue: 0,
          totalExpenses: 0,
          netResult: 0,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API][events][POST] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création", details: error.message },
      { status: 500 }
    );
  }
}
