import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMonthBounds } from "@/lib/buvette/calendar";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Erreur serveur");

export async function GET(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_PLANNINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const month = request.nextUrl.searchParams.get("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Paramètre month invalide (YYYY-MM)" }, { status: 400 });
    }

    const { start, end } = getMonthBounds(month);

    const { data: slots, error: slotsError } = await supabase
      .from("buvette_slots")
      .select("slot_date, status, source, reason, request_id")
      .eq("user_id", guard.clubId)
      .gte("slot_date", start)
      .lte("slot_date", end);

    if (slotsError) {
      return NextResponse.json({ error: slotsError.message }, { status: 500 });
    }

    const { data: requests, error: reqError } = await supabase
      .from("buvette_requests")
      .select("id, reservation_date, status, first_name, last_name, event_type")
      .eq("user_id", guard.clubId)
      .gte("reservation_date", start)
      .lte("reservation_date", end);

    if (reqError) {
      return NextResponse.json({ error: reqError.message }, { status: 500 });
    }

    const byDate: Record<
      string,
      {
        status: "available" | "occupied" | "reserved";
        reason?: string | null;
        source?: string | null;
        request?: {
          id: string;
          status: string;
          name: string;
          eventType: string;
        } | null;
      }
    > = {};

    for (const slot of slots || []) {
      const key = slot.slot_date;
      if (slot.status === "reserved") {
        byDate[key] = { status: "reserved", reason: slot.reason, source: slot.source };
      } else {
        byDate[key] = { status: "occupied", reason: slot.reason, source: slot.source };
      }
    }

    for (const req of requests || []) {
      const key = req.reservation_date;
      if (!byDate[key] && req.status === "pending") {
        byDate[key] = { status: "occupied", source: "external" };
      }
      if (byDate[key]) {
        byDate[key].request = {
          id: req.id,
          status: req.status,
          name: `${req.first_name} ${req.last_name}`,
          eventType: req.event_type,
        };
      }
    }

    return NextResponse.json({ month, days: byDate }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
