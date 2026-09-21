import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import {
  backfillValidatedMinuteTasks,
  compareActiveTasks,
  mapTaskRow,
  toTaskDto,
  type MeetingMinuteTaskDto,
} from "@/lib/meeting-minute-tasks";

export const runtime = "nodejs";

type MinuteMeta = {
  id: string;
  title: string;
  meeting_date: string;
  meeting_type: string;
};

export async function GET(request: Request) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_MEETING_MINUTES);
    if ("error" in guard) return guard.error;

    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get("filter") || "active").toLowerCase();

    const supabase = await createClient();
    try {
      await backfillValidatedMinuteTasks(supabase, guard.clubId, guard.userId);
    } catch {
      /* table absente ou PV déjà à jour */
    }

    const { data: rows, error } = await supabase
      .from("meeting_minute_tasks")
      .select("*")
      .eq("club_id", guard.clubId)
      .neq("status", "cancelled");
    if (error) {
      if (error.code === "42P01" || /meeting_minute_tasks/i.test(error.message)) {
        return NextResponse.json({
          tasks: [],
          summary: { overdue: 0, today: 0, upcoming: 0, total: 0 },
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const taskRows = (rows || []).map((row) => mapTaskRow(row as Record<string, unknown>));
    const pvIds = [...new Set(taskRows.map((row) => row.meeting_minutes_id))];
    const minutesById = new Map<string, MinuteMeta>();

    if (pvIds.length > 0) {
      const { data: minutes } = await supabase
        .from("meeting_minutes")
        .select("id, title, meeting_date, meeting_type")
        .eq("club_id", guard.clubId)
        .in("id", pvIds);
      for (const minute of minutes || []) {
        const meta = minute as MinuteMeta;
        minutesById.set(meta.id, meta);
      }
    }

    const allTasks: MeetingMinuteTaskDto[] = taskRows.map((row) => {
      const minute = minutesById.get(row.meeting_minutes_id);
      return toTaskDto(row, {
        title: minute?.title || "",
        meetingDate: String(minute?.meeting_date ?? ""),
        meetingType: minute?.meeting_type || "other",
      });
    });

    const active = allTasks.filter((task) => task.isActive && task.status !== "done");
    const summary = {
      overdue: active.filter((task) => task.urgency === "overdue").length,
      today: active.filter((task) => task.urgency === "today").length,
      upcoming: active.filter(
        (task) => task.urgency === "soon" || task.urgency === "normal" || task.urgency === "none"
      ).length,
      total: active.length,
    };

    let tasks: MeetingMinuteTaskDto[];
    if (filter === "done") {
      tasks = allTasks.filter((task) => task.status === "done");
      tasks.sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
    } else {
      tasks = active;
      if (filter === "overdue") {
        tasks = tasks.filter((task) => task.urgency === "overdue");
      } else if (filter === "upcoming") {
        tasks = tasks.filter((task) => task.urgency !== "overdue");
      }
      tasks.sort(compareActiveTasks);
    }

    return NextResponse.json({ tasks, summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
