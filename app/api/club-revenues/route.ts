import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { fetchEventLabelForRevenue } from "@/lib/club-revenues/eventLabel";

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
    const guard = await requirePermission(PERMISSIONS.VIEW_INVOICES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const { data: rows, error } = await supabase
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
        updated_at
      `
      )
      .eq("user_id", guard.clubId)
      .order("revenue_date", { ascending: false });

    if (error) {
      console.error("[API][club-revenues][GET]", error.message, error.code, error.details);
      return NextResponse.json(
        {
          error: "Erreur lors du chargement",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    const eventIds = [
      ...new Set(
        (rows || [])
          .map((r: { event_id?: string | null }) => r.event_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];
    const eventsById = new Map<string, { id: string; name: string }>();
    if (eventIds.length > 0) {
      const { data: evRows, error: evErr } = await supabase
        .from("events")
        .select("id, name")
        .in("id", eventIds);
      if (evErr) {
        console.warn("[API][club-revenues][GET] events batch:", evErr.message);
      }
      for (const ev of evRows || []) {
        eventsById.set(ev.id, { id: ev.id, name: ev.name });
      }
    }

    const revenues = (rows || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      amount: Number(row.amount) || 0,
      revenue_date: row.revenue_date,
      description: row.description,
      event_id: row.event_id,
      event: row.event_id ? eventsById.get(row.event_id) ?? null : null,
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
    const guard = await requirePermission(PERMISSIONS.MANAGE_INVOICES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

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

    const eventCheck = await assertEventOwnedByUser(supabase, guard.clubId, eventId ?? null);
    if (!eventCheck.ok) return eventCheck.response;

    const { data: inserted, error } = await supabase
      .from("club_revenues")
      .insert({
        user_id: guard.clubId,
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
        updated_at
      `
      )
      .single();

    if (error || !inserted) {
      console.error("[API][club-revenues][POST] insert failed", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      return NextResponse.json(
        {
          error: "Impossible d'enregistrer le revenu.",
          details: error?.message ?? "Erreur inconnue",
          code: error?.code,
        },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord/produits");
    revalidatePath("/tableau-de-bord/evenements");
    if (inserted.event_id) {
      revalidatePath(`/tableau-de-bord/evenements/${inserted.event_id}`);
    }

    const event = await fetchEventLabelForRevenue(supabase, inserted.event_id);
    const row: any = inserted;
    return NextResponse.json(
      {
        revenue: {
          id: row.id,
          name: row.name,
          amount: Number(row.amount) || 0,
          revenue_date: row.revenue_date,
          description: row.description,
          event_id: row.event_id,
          event,
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
