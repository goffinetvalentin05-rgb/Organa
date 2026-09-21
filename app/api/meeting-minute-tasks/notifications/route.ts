import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import {
  backfillValidatedMinuteTasks,
  mapTaskRow,
  notificationKindForUrgency,
  taskNotificationKey,
  taskUrgency,
  todayIsoDate,
} from "@/lib/meeting-minute-tasks";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_MEETING_MINUTES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    try {
      await backfillValidatedMinuteTasks(supabase, guard.clubId, guard.userId);
    } catch {
      /* table absente */
    }

    const { data: rows, error } = await supabase
      .from("meeting_minute_tasks")
      .select("*")
      .eq("club_id", guard.clubId)
      .eq("is_active", true)
      .neq("status", "done")
      .neq("status", "cancelled")
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(40);

    if (error) {
      if (error.code === "42P01" || /meeting_minute_tasks/i.test(error.message)) {
        return NextResponse.json({ notifications: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const tasks = (rows || []).map((row) => mapTaskRow(row as Record<string, unknown>));
    if (tasks.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    const today = todayIsoDate();
    const candidates = tasks.map((task) => {
      const urgency = taskUrgency(task.deadline, today);
      const kind = notificationKindForUrgency(urgency);
      return {
        task,
        kind,
        id: taskNotificationKey(task.id, kind, task.deadline),
        urgency,
      };
    });

    const keys = candidates.map((item) => item.id);
    const seen = new Set<string>();
    const { data: seenRows } = await supabase
      .from("feature_announcements_seen")
      .select("announcement_key")
      .eq("user_id", guard.userId)
      .eq("club_id", guard.clubId)
      .in("announcement_key", keys);
    for (const row of seenRows || []) seen.add(row.announcement_key);

    const notifications = candidates.slice(0, 20).map((item) => {
      const deadlineLabel = item.task.deadline
        ? new Date(`${item.task.deadline}T00:00:00`).toLocaleDateString("fr-CH")
        : "";
      const responsible = item.task.responsible_name || "";
      let title = "Nouvelle tâche";
      let message = item.task.description;
      if (item.kind === "overdue") {
        title = "Tâche en retard";
        message = deadlineLabel
          ? `${item.task.description} — échéance dépassée (${deadlineLabel}).`
          : item.task.description;
      } else if (item.kind === "today") {
        title = "Tâche à réaliser aujourd’hui";
        message = item.task.description;
      } else if (item.kind === "soon") {
        title = "Tâche à réaliser bientôt";
        message = deadlineLabel
          ? `${item.task.description} — échéance le ${deadlineLabel}.`
          : item.task.description;
      } else {
        message = responsible
          ? `${item.task.description} — responsable : ${responsible}.`
          : item.task.description;
        if (deadlineLabel) message += ` Échéance : ${deadlineLabel}.`;
      }

      return {
        id: item.id,
        title,
        message,
        cta: "Voir",
        href: `/tableau-de-bord/a-faire?highlight=${item.task.id}`,
        date: deadlineLabel || undefined,
        icon: "users" as const,
        read: seen.has(item.id),
      };
    });

    return NextResponse.json({ notifications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
