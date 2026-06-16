import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import {
  mapMeetingMinutesRow,
  meetingMinutesToDbPayload,
  parseMeetingMinutesBody,
} from "@/lib/meeting-minutes";

export const runtime = "nodejs";

const SELECT_FIELDS =
  "id, club_id, title, meeting_date, start_time, end_time, location, meeting_type, status, chairman, secretary, attendees, excused, absent, agenda_items, discussion_points, decisions, tasks, miscellaneous, next_meeting, created_by, created_at, updated_at";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_MEETING_MINUTES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const [{ data: rows, error }, { data: profile }] = await Promise.all([
      supabase
        .from("meeting_minutes")
        .select(SELECT_FIELDS)
        .eq("club_id", guard.clubId)
        .order("meeting_date", { ascending: false })
        .order("updated_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("company_name")
        .eq("user_id", guard.clubId)
        .maybeSingle(),
    ]);

    if (error) {
      console.error("[API][meeting-minutes][GET]", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement des PV", details: error.message },
        { status: 500 }
      );
    }

    const minutes = (rows || [])
      .map((r) => mapMeetingMinutesRow(r as Record<string, unknown>))
      .filter(Boolean);
    const clubName =
      (profile?.company_name as string | undefined)?.trim() || "Votre club";

    return NextResponse.json({ minutes, clubName }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[API][meeting-minutes][GET]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_MEETING_MINUTES);
    if ("error" in guard) return guard.error;

    const body = await request.json();
    const { payload, error: parseError } = parseMeetingMinutesBody(body);
    if (!payload || parseError) {
      return NextResponse.json({ error: parseError || "Données invalides" }, { status: 400 });
    }

    const supabase = await createClient();
    const dbPayload = {
      club_id: guard.clubId,
      created_by: guard.userId,
      ...meetingMinutesToDbPayload(payload),
    };

    const { data, error } = await supabase
      .from("meeting_minutes")
      .insert(dbPayload)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      console.error("[API][meeting-minutes][POST]", error);
      return NextResponse.json(
        { error: "Erreur lors de la création", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord/pv-seances");

    return NextResponse.json(
      { minute: mapMeetingMinutesRow(data as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[API][meeting-minutes][POST]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
