import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import {
  mapMeetingMinutesRow,
  meetingMinutesToDbPayload,
  normalizeMeetingStatus,
  normalizeMeetingType,
  parseMeetingMinutesBody,
} from "@/lib/meeting-minutes";

export const runtime = "nodejs";

const SELECT_FIELDS =
  "id, club_id, title, meeting_date, start_time, end_time, location, meeting_type, status, chairman, secretary, attendees, excused, absent, points, agenda_items, discussion_points, decisions, tasks, miscellaneous, next_meeting, created_by, created_at, updated_at";

async function readId(params: Promise<{ id: string }> | { id: string }): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_MEETING_MINUTES);
    if ("error" in guard) return guard.error;

    const id = await readId(context.params);
    const supabase = await createClient();

    const [{ data, error }, { data: profile }] = await Promise.all([
      supabase
        .from("meeting_minutes")
        .select(SELECT_FIELDS)
        .eq("id", id)
        .eq("club_id", guard.clubId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("company_name")
        .eq("user_id", guard.clubId)
        .maybeSingle(),
    ]);

    if (error) {
      console.error("[API][meeting-minutes/[id]][GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "PV introuvable" }, { status: 404 });
    }

    const clubName =
      (profile?.company_name as string | undefined)?.trim() || "Votre club";

    return NextResponse.json(
      { minute: mapMeetingMinutesRow(data as Record<string, unknown>), clubName },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_MEETING_MINUTES);
    if ("error" in guard) return guard.error;

    const id = await readId(context.params);
    const body = await request.json();

    const supabase = await createClient();

    const { data: existing, error: existingError } = await supabase
      .from("meeting_minutes")
      .select(SELECT_FIELDS)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "PV introuvable" }, { status: 404 });
    }

    const current = mapMeetingMinutesRow(existing as Record<string, unknown>);
    if (!current) {
      return NextResponse.json({ error: "PV introuvable" }, { status: 404 });
    }

    const merged = {
      title: body?.title !== undefined ? body.title : current.title,
      meetingDate:
        body?.meetingDate !== undefined ? body.meetingDate : current.meetingDate,
      startTime: body?.startTime !== undefined ? body.startTime : current.startTime,
      endTime: body?.endTime !== undefined ? body.endTime : current.endTime,
      location: body?.location !== undefined ? body.location : current.location,
      meetingType:
        body?.meetingType !== undefined ? body.meetingType : current.meetingType,
      status: body?.status !== undefined ? body.status : current.status,
      chairman: body?.chairman !== undefined ? body.chairman : current.chairman,
      secretary:
        body?.secretary !== undefined ? body.secretary : current.secretary,
      attendees: body?.attendees !== undefined ? body.attendees : current.attendees,
      excused: body?.excused !== undefined ? body.excused : current.excused,
      absent: body?.absent !== undefined ? body.absent : current.absent,
      points: body?.points !== undefined ? body.points : current.points,
      miscellaneous:
        body?.miscellaneous !== undefined ? body.miscellaneous : current.miscellaneous,
      nextMeeting:
        body?.nextMeeting !== undefined ? body.nextMeeting : current.nextMeeting,
    };

    const { payload, error: parseError } = parseMeetingMinutesBody(merged);
    if (!payload || parseError) {
      return NextResponse.json({ error: parseError || "Données invalides" }, { status: 400 });
    }

    const updates = meetingMinutesToDbPayload(payload);

    if (body?.meetingType !== undefined && !normalizeMeetingType(body.meetingType)) {
      return NextResponse.json({ error: "Type de séance invalide" }, { status: 400 });
    }
    if (body?.status !== undefined && !normalizeMeetingStatus(body.status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("meeting_minutes")
      .update(updates)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .select(SELECT_FIELDS)
      .maybeSingle();

    if (error) {
      console.error("[API][meeting-minutes/[id]][PATCH]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "PV introuvable" }, { status: 404 });
    }

    revalidatePath("/tableau-de-bord/pv-seances");
    revalidatePath(`/tableau-de-bord/pv-seances/${id}`);

    return NextResponse.json(
      { minute: mapMeetingMinutesRow(data as Record<string, unknown>) },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_MEETING_MINUTES);
    if ("error" in guard) return guard.error;

    const id = await readId(context.params);
    const supabase = await createClient();

    const { error } = await supabase
      .from("meeting_minutes")
      .delete()
      .eq("id", id)
      .eq("club_id", guard.clubId);

    if (error) {
      console.error("[API][meeting-minutes/[id]][DELETE]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/tableau-de-bord/pv-seances");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
