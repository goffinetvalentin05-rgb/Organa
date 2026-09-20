import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  sumClubRevenues,
  sumInvoiceRevenueFromDocuments,
  totalEventRevenue,
} from "@/lib/financial/eventFinancials";
import { ToolError } from "@/lib/obillz-tools/core/errors";

const EVENT_SELECT = `
  id, name, description, start_date, end_date, status, created_at, updated_at, event_type_id,
  event_types (id, name)
`;

export async function listEventsForClub(clubId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("user_id", clubId)
    .order("start_date", { ascending: false });

  if (error) {
    throw new ToolError(
      "Erreur lors du chargement des événements",
      "EVENTS_LIST_FAILED",
      500
    );
  }

  const { data: documentsData } = await admin
    .from("documents")
    .select("event_id, total_ttc, type")
    .eq("user_id", clubId)
    .eq("type", "invoice")
    .not("event_id", "is", null);

  const { data: clubRevenuesData } = await supabase
    .from("club_revenues")
    .select("event_id, amount")
    .eq("user_id", clubId)
    .not("event_id", "is", null);

  const { data: expensesData } = await supabase
    .from("expenses")
    .select("event_id, amount")
    .eq("user_id", clubId)
    .not("event_id", "is", null);

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
  (clubRevenuesData || []).forEach(
    (row: { event_id?: string | null; amount?: number | string | null }) => {
      if (row.event_id) {
        revenueByEvent[row.event_id] =
          (revenueByEvent[row.event_id] || 0) + Number(row.amount || 0);
      }
    }
  );
  (expensesData || []).forEach(
    (exp: { event_id?: string | null; amount?: number | string | null }) => {
      if (exp.event_id) {
        expensesByEvent[exp.event_id] =
          (expensesByEvent[exp.event_id] || 0) + Number(exp.amount || 0);
      }
    }
  );

  return (events || []).map((event: { id: string; event_types: unknown }) => ({
    ...event,
    eventType: event.event_types,
    totalRevenue: revenueByEvent[event.id] || 0,
    totalExpenses: expensesByEvent[event.id] || 0,
    netResult: (revenueByEvent[event.id] || 0) - (expensesByEvent[event.id] || 0),
  }));
}

export async function getEventForClub(clubId: string, eventId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", eventId)
    .eq("user_id", clubId)
    .single();

  if (error || !event) {
    throw new ToolError("Événement non trouvé", "EVENT_NOT_FOUND", 404);
  }

  const { data: documents } = await admin
    .from("documents")
    .select("id, numero, type, status, total_ttc, date_creation, client_id, clients(id, nom)")
    .eq("user_id", clubId)
    .eq("event_id", eventId)
    .eq("type", "invoice")
    .order("date_creation", { ascending: false });

  const { data: clubRevenuesRows } = await supabase
    .from("club_revenues")
    .select("id, name, amount, revenue_date, description")
    .eq("user_id", clubId)
    .eq("event_id", eventId);

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, description, amount, date, status")
    .eq("user_id", clubId)
    .eq("event_id", eventId);

  const safeClubRevenues = clubRevenuesRows || [];
  const totalRevenue = totalEventRevenue(documents || [], safeClubRevenues);
  const totalExpenses = (expenses || []).reduce(
    (sum: number, exp: { amount?: number | string }) => sum + (Number(exp.amount) || 0),
    0
  );

  return {
    ...event,
    eventType: event.event_types,
    totalRevenue,
    revenueFromInvoices: sumInvoiceRevenueFromDocuments(documents || []),
    revenueFromProducts: sumClubRevenues(safeClubRevenues),
    totalExpenses,
    netResult: totalRevenue - totalExpenses,
  };
}

export async function createEventForClub(params: {
  clubId: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  status?: string;
  eventTypeId?: string | null;
}) {
  if (!params.name?.trim()) {
    throw new ToolError("Le nom de l'événement est requis", "EVENT_NAME_REQUIRED");
  }
  if (!params.startDate) {
    throw new ToolError("La date de début est requise", "EVENT_DATE_REQUIRED");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: params.clubId,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      start_date: params.startDate,
      end_date: params.endDate || null,
      status: params.status === "completed" ? "completed" : "planned",
      event_type_id: params.eventTypeId || null,
    })
    .select(EVENT_SELECT)
    .single();

  if (error) {
    throw new ToolError(
      "Erreur lors de la création de l'événement",
      "EVENT_CREATE_FAILED",
      500
    );
  }

  return {
    ...data,
    eventType: data.event_types,
    totalRevenue: 0,
    totalExpenses: 0,
    netResult: 0,
  };
}

export async function updateEventForClub(params: {
  clubId: string;
  eventId: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  status?: string;
  eventTypeId?: string | null;
}) {
  if (!params.name?.trim()) {
    throw new ToolError("Le nom de l'événement est requis", "EVENT_NAME_REQUIRED");
  }
  if (!params.startDate) {
    throw new ToolError("La date de début est requise", "EVENT_DATE_REQUIRED");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      name: params.name.trim(),
      description: params.description?.trim() || null,
      start_date: params.startDate,
      end_date: params.endDate || null,
      status: params.status === "completed" ? "completed" : "planned",
      event_type_id: params.eventTypeId || null,
    })
    .eq("id", params.eventId)
    .eq("user_id", params.clubId)
    .select(EVENT_SELECT)
    .single();

  if (error || !data) {
    throw new ToolError("Erreur lors de la modification", "EVENT_UPDATE_FAILED", 500);
  }

  return { ...data, eventType: data.event_types };
}
