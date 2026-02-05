import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

/* =========================
   GET : détail d'un événement avec données financières
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

    if (!id) {
      return NextResponse.json({ error: "ID de l'événement requis" }, { status: 400 });
    }

    // Récupérer l'événement
    const { data: event, error } = await supabase
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
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !event) {
      console.error("[API][events][GET] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les documents (revenus) liés
    const { data: documents } = await supabase
      .from("documents")
      .select(`
        id,
        numero,
        type,
        status,
        total_ttc,
        date_creation,
        client_id,
        clients (
          id,
          nom
        )
      `)
      .eq("user_id", user.id)
      .eq("event_id", id)
      .order("date_creation", { ascending: false });

    // Récupérer les dépenses liées
    const { data: expenses } = await supabase
      .from("expenses")
      .select("id, description, amount, date, status")
      .eq("user_id", user.id)
      .eq("event_id", id)
      .order("date", { ascending: false });

    // Calculer les totaux
    const totalRevenue = (documents || []).reduce(
      (sum: number, doc: any) => sum + (Number(doc.total_ttc) || 0),
      0
    );
    const totalExpenses = (expenses || []).reduce(
      (sum: number, exp: any) => sum + (Number(exp.amount) || 0),
      0
    );

    return NextResponse.json({
      event: {
        ...event,
        eventType: event.event_types,
        totalRevenue,
        totalExpenses,
        netResult: totalRevenue - totalExpenses,
        documents: (documents || []).map((doc: any) => ({
          ...doc,
          client: doc.clients,
        })),
        expenses: expenses || [],
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("[API][events][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement", details: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   PUT : modifier un événement
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

    if (!id) {
      return NextResponse.json({ error: "ID de l'événement requis" }, { status: 400 });
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

    const payload = {
      name: name.trim(),
      description: description?.trim() || null,
      start_date: startDate,
      end_date: endDate || null,
      status: status === "completed" ? "completed" : "planned",
      event_type_id: eventTypeId || null,
    };

    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id)
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
      console.error("[API][events][PUT] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la modification", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/evenements");
    revalidatePath(`/tableau-de-bord/evenements/${id}`);

    return NextResponse.json({
      event: {
        ...data,
        eventType: data.event_types,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("[API][events][PUT] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification", details: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE : supprimer un événement
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

    if (!id) {
      return NextResponse.json({ error: "ID de l'événement requis" }, { status: 400 });
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[API][events][DELETE] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/evenements");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API][events][DELETE] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: error.message },
      { status: 500 }
    );
  }
}
