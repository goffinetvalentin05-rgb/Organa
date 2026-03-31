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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("club_revenues")
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
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    const row: any = data;
    return NextResponse.json({
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
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

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

    const { data: existing } = await supabase
      .from("club_revenues")
      .select("event_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data, error } = await supabase
      .from("club_revenues")
      .update({
        name: name.trim(),
        amount: amountNum,
        revenue_date: revenueDate,
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        event_id: eventId || null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
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
      console.error("[API][club-revenues][PUT]", error);
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
    }

    revalidatePath("/tableau-de-bord/produits");
    revalidatePath("/tableau-de-bord/evenements");
    const oldEventId = (existing as { event_id?: string } | null)?.event_id;
    const newEventId = (data as { event_id?: string }).event_id;
    if (oldEventId) revalidatePath(`/tableau-de-bord/evenements/${oldEventId}`);
    if (newEventId) revalidatePath(`/tableau-de-bord/evenements/${newEventId}`);

    const row: any = data;
    return NextResponse.json({
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
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: existing } = await supabase
      .from("club_revenues")
      .select("event_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = await supabase.from("club_revenues").delete().eq("id", id).eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }

    revalidatePath("/tableau-de-bord/produits");
    revalidatePath("/tableau-de-bord/evenements");
    const ev = (existing as { event_id?: string } | null)?.event_id;
    if (ev) revalidatePath(`/tableau-de-bord/evenements/${ev}`);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
