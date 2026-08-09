import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { withIdempotency } from "@/lib/api/idempotency";

export const runtime = "nodejs";

/* =========================
   GET : liste des événements avec totaux financiers
   ========================= */
export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_EXPENSES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

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
      .eq("user_id", guard.clubId)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("[API][events][GET] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement des événements", details: error.message },
        { status: 500 }
      );
    }

    // Revenus factures (invoices) liés aux événements
    const { data: documentsData } = await supabase
      .from("documents")
      .select("event_id, total_ttc, type")
      .eq("user_id", guard.clubId)
      .eq("type", "invoice")
      .not("event_id", "is", null);

    // Revenus simples (club_revenues) liés aux événements
    const { data: clubRevenuesData, error: clubRevenuesError } = await supabase
      .from("club_revenues")
      .select("event_id, amount")
      .eq("user_id", guard.clubId)
      .not("event_id", "is", null);
    if (clubRevenuesError) {
      console.warn("[API][events][GET] club_revenues:", clubRevenuesError.message);
    }

    // Récupérer les totaux des dépenses (expenses liées)
    const { data: expensesData } = await supabase
      .from("expenses")
      .select("event_id, amount")
      .eq("user_id", guard.clubId)
      .not("event_id", "is", null);

    // Calculer les totaux par événement
    const revenueByEvent: Record<string, number> = {};
    const expensesByEvent: Record<string, number> = {};

    (documentsData || []).forEach(
      (doc: { event_id?: string | null; type?: string | null; total_ttc?: number | string | null }) => {
        if (doc.event_id && doc.type === "invoice") {
          revenueByEvent[doc.event_id] =
            (revenueByEvent[doc.event_id] || 0) + Number(doc.total_ttc || 0);
        }
      }
    );

    if (!clubRevenuesError) {
      (clubRevenuesData || []).forEach(
        (row: { event_id?: string | null; amount?: number | string | null }) => {
          if (row.event_id) {
            revenueByEvent[row.event_id] =
              (revenueByEvent[row.event_id] || 0) + Number(row.amount || 0);
          }
        }
      );
    }

    (expensesData || []).forEach(
      (exp: { event_id?: string | null; amount?: number | string | null }) => {
        if (exp.event_id) {
          expensesByEvent[exp.event_id] =
            (expensesByEvent[exp.event_id] || 0) + Number(exp.amount || 0);
        }
      }
    );

    // Enrichir les événements avec les totaux
    const eventsWithFinancials = (events || []).map((event: Record<string, unknown> & { id: string; event_types: unknown }) => ({
      ...event,
      eventType: event.event_types,
      totalRevenue: revenueByEvent[event.id] || 0,
      totalExpenses: expensesByEvent[event.id] || 0,
      netResult: (revenueByEvent[event.id] || 0) - (expensesByEvent[event.id] || 0),
    }));

    return NextResponse.json({ events: eventsWithFinancials }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API][events][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement", details: message },
      { status: 500 }
    );
  }
}

/* =========================
   POST : créer un événement
   ========================= */
export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_EXPENSES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const accessCheck = await requireWriteAccess(guard.clubId);
    if (accessCheck.response) {
      return accessCheck.response;
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
      user_id: guard.clubId,
      name: name.trim(),
      description: description?.trim() || null,
      start_date: startDate,
      end_date: endDate || null,
      status: status === "completed" ? "completed" : "planned",
      event_type_id: eventTypeId || null,
    };

    const idempotencyResult = await withIdempotency<Record<string, unknown>>({
      request,
      clubId: guard.clubId,
      idempotencyKey: request.headers.get("Idempotency-Key"),
      resourceType: "event",
      operation: async () => {
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
          return {
            status: 500,
            body: {
              error: "Erreur lors de la création de l'événement",
              details: error.message,
            },
            resourceId: null,
          };
        }

        revalidatePath("/tableau-de-bord");
        revalidatePath("/tableau-de-bord/evenements");

        return {
          status: 201,
          body: {
            event: {
              ...data,
              eventType: data.event_types,
              totalRevenue: 0,
              totalExpenses: 0,
              netResult: 0,
            },
          },
          resourceId: String(data.id),
        };
      },
    });

    return NextResponse.json(idempotencyResult.body, {
      status: idempotencyResult.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API][events][POST] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création", details: message },
      { status: 500 }
    );
  }
}
