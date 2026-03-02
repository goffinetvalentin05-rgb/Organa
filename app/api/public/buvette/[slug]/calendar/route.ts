import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMonthBounds } from "@/lib/buvette/calendar";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Erreur serveur");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const month = url.searchParams.get("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Paramètre month invalide (YYYY-MM)" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("buvette_slug", slug)
      .maybeSingle();

    if (!profile?.user_id) {
      return NextResponse.json({ error: "Club introuvable" }, { status: 404 });
    }

    const { start, end } = getMonthBounds(month);
    const { data: slots, error } = await supabase
      .from("buvette_slots")
      .select("slot_date, status")
      .eq("user_id", profile.user_id)
      .gte("slot_date", start)
      .lte("slot_date", end);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const days: Record<string, "available" | "occupied" | "reserved"> = {};
    for (const slot of slots || []) {
      if (slot.status === "reserved") {
        days[slot.slot_date] = "reserved";
      } else {
        days[slot.slot_date] = "occupied";
      }
    }

    return NextResponse.json({ month, days }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
