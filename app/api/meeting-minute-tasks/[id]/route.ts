import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import { completeMeetingMinuteTask, toTaskDto } from "@/lib/meeting-minute-tasks";

export const runtime = "nodejs";

async function readId(params: Promise<{ id: string }> | { id: string }): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_MEETING_MINUTES);
    if ("error" in guard) return guard.error;

    const id = await readId(context.params);
    const body = await request.json().catch(() => ({}));
    const status = body?.status;

    if (status !== "done") {
      return NextResponse.json({ error: "Action non supportée" }, { status: 400 });
    }

    const supabase = await createClient();
    const row = await completeMeetingMinuteTask(supabase, {
      clubId: guard.clubId,
      userId: guard.userId,
      taskId: id,
    });

    const { data: minute } = await supabase
      .from("meeting_minutes")
      .select("title, meeting_date, meeting_type")
      .eq("id", row.meeting_minutes_id)
      .eq("club_id", guard.clubId)
      .maybeSingle();

    revalidatePath("/tableau-de-bord/a-faire");
    revalidatePath("/tableau-de-bord");
    revalidatePath(`/tableau-de-bord/pv-seances/${row.meeting_minutes_id}`);

    return NextResponse.json({
      task: toTaskDto(row, {
        title: (minute?.title as string) || "",
        meetingDate: String(minute?.meeting_date ?? ""),
        meetingType: (minute?.meeting_type as string) || "other",
      }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "Tâche introuvable" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
