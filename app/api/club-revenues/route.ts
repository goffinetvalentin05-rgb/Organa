import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

export const runtime = "nodejs";

async function assertEventOwnedByUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  eventId: string | null | undefined
) {
  if (!eventId) return { ok: true as const };
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) {
    return { ok: false as const, response: NextResponse.json({ error: "Événement introuvable" }, { status: 400 }) };
  }
  return { ok: true as const };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: rows, error } = await supabase
      .from("club_revenues")
      .select(`
        id,
        name,
        amount,
        revenue_date,
        description,
        event_id,
        created_at,
        updated_at,
        events (
          id,
          name
        )
      `)
      .eq("user_id", user.id)
      .order("revenue_date", { ascending: false });

    if (error) {
      console.error("[API][club-revenues][GET]", error);
      return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
    }

    const revenues = (rows || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      amount: Number(row.amount) || 0,
      revenue_date: row.revenue_date,
      description: row.description,
      event_id: row.event_id,
      event: row.events
        ? { id: row.events.id, name: row.events.name }
        : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ revenues }, { status: 200 });
  } catch (e: any) {
    console.error("[API][club-revenues][GET]", e);
    return NextResponse.json({ error: e?.message || "Erreur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) {
      return accessCheck.response;
    }

    const body = await request.json();
    const { name, amount, revenueDate, description, eventId } = body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }
    if (revenueDate === undefined || revenueDate === null || typeof revenueDate !== "string") {
      return NextResponse.json({ error: "La date est requise" }, { status: 400 });
    }
    const amountNum = Number(amount);
    if (Number.isNaN(amountNum) || amountNum < 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const eventCheck = await assertEventOwnedByUser(supabase, user.id, eventId ?? null);
    if (!eventCheck.ok) return eventCheck.response;

    const { data, error } = await supabase
      .from("club_revenues")
      .insert({
        user_id: user.id,
        name: name.trim(),
        amount: amountNum,
        revenue_date: revenueDate,
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        event_id: eventId || null,
      })
      .select(
        `
        id,
        name,
        amount,
        revenue_date,
        description,
        event_id,
        created_at,
        updated_at,
        events (
          id,
          name
        )
      `
      )
      .single();

    if (error || !data) {
      console.error("[API][club-revenues][POST]", error);
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
    }

    revalidatePath("/tableau-de-bord/produits");
    revalidatePath("/tableau-de-bord/evenements");
    if (data.event_id) {
      revalidatePath(`/tableau-de-bord/evenements/${data.event_id}`);
    }

    const row: any = data;
    return NextResponse.json(
      {
        revenue: {
          id: row.id,
          name: row.name,
          amount: Number(row.amount) || 0,
          revenue_date: row.revenue_date,
          description: row.description,
          event_id: row.event_id,
          event: row.events ? { id: row.events.id, name: row.events.name } : null,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("[API][club-revenues][POST]", e);
    return NextResponse.json({ error: e?.message || "Erreur" }, { status: 500 });
  }
}
