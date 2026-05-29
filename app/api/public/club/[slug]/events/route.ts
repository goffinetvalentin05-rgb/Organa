import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicClubEvent } from "@/lib/public-page/types";

export const runtime = "nodejs";

const UPCOMING_LIMIT = 20;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const normalized = slug.trim().toLowerCase();
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("public_page_slug", normalized)
      .eq("public_page_enabled", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (!profile?.user_id) {
      return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: events, error } = await supabase
      .from("events")
      .select(
        `
        id,
        name,
        description,
        start_date,
        end_date,
        status,
        event_types ( name )
      `
      )
      .eq("user_id", profile.user_id)
      .gte("start_date", today)
      .eq("status", "planned")
      .order("start_date", { ascending: true })
      .limit(UPCOMING_LIMIT);

    if (error) {
      return NextResponse.json({ error: "Impossible de charger les événements" }, { status: 500 });
    }

    const items: PublicClubEvent[] = (events || []).map((row: Record<string, unknown>) => {
      const eventTypes = row.event_types as { name?: string } | { name?: string }[] | null;
      const typeName = Array.isArray(eventTypes)
        ? eventTypes[0]?.name
        : eventTypes?.name;

      return {
        id: String(row.id),
        name: String(row.name || ""),
        description: typeof row.description === "string" ? row.description : null,
        startDate: String(row.start_date || ""),
        endDate: typeof row.end_date === "string" ? row.end_date : null,
        eventTypeName: typeName || null,
      };
    });

    return NextResponse.json({ events: items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
