import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapMeetingMinutesRow,
  type MeetingPoint,
  type MeetingStatus,
  type TaskEntry,
  type TaskStatus,
} from "@/lib/meeting-minutes";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type OperationalTaskStatus = TaskStatus | "cancelled";

export type TaskUrgency = "overdue" | "today" | "soon" | "normal" | "none";

export type MeetingMinuteTaskRow = {
  id: string;
  club_id: string;
  meeting_minutes_id: string;
  point_index: number;
  point_title: string;
  description: string;
  responsible_name: string;
  responsible_client_id: string | null;
  deadline: string | null;
  status: OperationalTaskStatus;
  is_active: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetingMinuteTaskDto = {
  id: string;
  meetingMinutesId: string;
  meetingTitle: string;
  meetingDate: string;
  meetingType: string;
  pointIndex: number;
  pointTitle: string;
  description: string;
  responsibleName: string;
  responsibleClientId: string | null;
  deadline: string | null;
  status: OperationalTaskStatus;
  isActive: boolean;
  completedAt: string | null;
  urgency: TaskUrgency;
};

export function isTaskUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysUntilDeadline(
  deadline: string | null | undefined,
  today = todayIsoDate()
): number | null {
  if (!deadline) return null;
  const due = new Date(`${deadline}T00:00:00`);
  const start = new Date(`${today}T00:00:00`);
  if (Number.isNaN(due.getTime()) || Number.isNaN(start.getTime())) return null;
  return Math.round((due.getTime() - start.getTime()) / 86_400_000);
}

export type RelativeDeadline =
  | { kind: "none" }
  | { kind: "today" }
  | { kind: "tomorrow" }
  | { kind: "inDays"; count: number }
  | { kind: "overdue"; count: number };

export function relativeDeadline(
  deadline: string | null | undefined,
  today = todayIsoDate()
): RelativeDeadline {
  const days = daysUntilDeadline(deadline, today);
  if (days === null) return { kind: "none" };
  if (days < 0) return { kind: "overdue", count: Math.abs(days) };
  if (days === 0) return { kind: "today" };
  if (days === 1) return { kind: "tomorrow" };
  return { kind: "inDays", count: days };
}

export function taskUrgency(deadline: string | null | undefined, today = todayIsoDate()): TaskUrgency {
  const diffDays = daysUntilDeadline(deadline, today);
  if (diffDays === null) return "none";
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 3) return "soon";
  return "normal";
}

const URGENCY_RANK: Record<TaskUrgency, number> = {
  overdue: 0,
  today: 1,
  soon: 2,
  normal: 3,
  none: 4,
};

export function compareActiveTasks(a: MeetingMinuteTaskDto, b: MeetingMinuteTaskDto): number {
  const urgencyDiff = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
  if (urgencyDiff !== 0) return urgencyDiff;
  if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
  if (a.deadline) return -1;
  if (b.deadline) return 1;
  return a.description.localeCompare(b.description, "fr");
}

export function ensureTaskIds(points: MeetingPoint[]): MeetingPoint[] {
  return points.map((point) => ({
    ...point,
    tasks: point.tasks.map((task) => ({
      ...task,
      id: task.id && isTaskUuid(task.id) ? task.id : crypto.randomUUID(),
    })),
  }));
}

export function rowToTaskEntry(row: MeetingMinuteTaskRow): TaskEntry {
  return {
    id: row.id,
    description: row.description,
    responsible: row.responsible_name,
    responsibleClientId: row.responsible_client_id,
    deadline: row.deadline || "",
    status: row.status === "cancelled" ? "todo" : row.status,
    completedAt: row.completed_at,
  };
}

export function overlayTasksOnPoints(
  points: MeetingPoint[],
  rows: MeetingMinuteTaskRow[]
): MeetingPoint[] {
  const live = rows.filter((row) => row.status !== "cancelled");
  if (live.length === 0 && rows.length === 0) return points;

  const byPoint = new Map<number, MeetingMinuteTaskRow[]>();
  for (const row of live) {
    const list = byPoint.get(row.point_index) ?? [];
    list.push(row);
    byPoint.set(row.point_index, list);
  }

  return points.map((point, index) => {
    const forPoint = byPoint.get(index);
    if (!forPoint) {
      return live.length === 0 ? point : { ...point, tasks: [] };
    }
    return { ...point, tasks: forPoint.map(rowToTaskEntry) };
  });
}

export function markTaskDoneInPoints(
  points: MeetingPoint[],
  taskId: string,
  completedAt: string
): MeetingPoint[] {
  return points.map((point) => ({
    ...point,
    tasks: point.tasks.map((task) =>
      task.id === taskId
        ? { ...task, status: "done" as const, completedAt }
        : task
    ),
  }));
}

export type TaskNotificationKind = "assigned" | "soon" | "today" | "overdue";

export function taskNotificationKey(
  taskId: string,
  kind: TaskNotificationKind,
  deadline?: string | null
): string {
  if (kind === "assigned") return `pv_task_assigned_${taskId}`;
  const day = deadline || "none";
  if (kind === "soon") return `pv_task_due_soon_${taskId}_${day}`;
  if (kind === "today") return `pv_task_due_today_${taskId}_${day}`;
  return `pv_task_overdue_${taskId}_${day}`;
}

export function notificationKindForUrgency(urgency: TaskUrgency): TaskNotificationKind {
  if (urgency === "overdue") return "overdue";
  if (urgency === "today") return "today";
  if (urgency === "soon") return "soon";
  return "assigned";
}

export function mapTaskRow(raw: Record<string, unknown>): MeetingMinuteTaskRow {
  return {
    id: String(raw.id),
    club_id: String(raw.club_id),
    meeting_minutes_id: String(raw.meeting_minutes_id),
    point_index: Number(raw.point_index) || 0,
    point_title: typeof raw.point_title === "string" ? raw.point_title : "",
    description: String(raw.description ?? ""),
    responsible_name: typeof raw.responsible_name === "string" ? raw.responsible_name : "",
    responsible_client_id:
      typeof raw.responsible_client_id === "string" ? raw.responsible_client_id : null,
    deadline: typeof raw.deadline === "string" ? raw.deadline : null,
    status: (raw.status as OperationalTaskStatus) || "todo",
    is_active: Boolean(raw.is_active),
    completed_at: typeof raw.completed_at === "string" ? raw.completed_at : null,
    completed_by: typeof raw.completed_by === "string" ? raw.completed_by : null,
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  };
}

export function toTaskDto(
  row: MeetingMinuteTaskRow,
  meeting: { title: string; meetingDate: string; meetingType: string },
  today = todayIsoDate()
): MeetingMinuteTaskDto {
  return {
    id: row.id,
    meetingMinutesId: row.meeting_minutes_id,
    meetingTitle: meeting.title,
    meetingDate: meeting.meetingDate,
    meetingType: meeting.meetingType,
    pointIndex: row.point_index,
    pointTitle: row.point_title,
    description: row.description,
    responsibleName: row.responsible_name,
    responsibleClientId: row.responsible_client_id,
    deadline: row.deadline,
    status: row.status,
    isActive: row.is_active,
    completedAt: row.completed_at,
    urgency: row.status === "done" ? "none" : taskUrgency(row.deadline, today),
  };
}

type DbClient = SupabaseClient;

export async function fetchTasksForMinute(
  supabase: DbClient,
  clubId: string,
  meetingMinutesId: string
): Promise<MeetingMinuteTaskRow[]> {
  const { data, error } = await supabase
    .from("meeting_minute_tasks")
    .select("*")
    .eq("club_id", clubId)
    .eq("meeting_minutes_id", meetingMinutesId)
    .order("point_index", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => mapTaskRow(row as Record<string, unknown>));
}

export async function attachTasksToMinute<T extends { id: string; points: MeetingPoint[] }>(
  supabase: DbClient,
  clubId: string,
  minute: T
): Promise<T> {
  const rows = await fetchTasksForMinute(supabase, clubId, minute.id);
  if (rows.length === 0) return minute;
  return { ...minute, points: overlayTasksOnPoints(minute.points, rows) };
}

export async function syncMeetingMinuteTasks(options: {
  supabase: DbClient;
  clubId: string;
  userId: string;
  meetingMinutesId: string;
  pvStatus: MeetingStatus;
  points: MeetingPoint[];
}): Promise<MeetingPoint[]> {
  const points = ensureTaskIds(options.points);
  const incoming: Array<{ task: TaskEntry; pointIndex: number; pointTitle: string }> = [];
  points.forEach((point, pointIndex) => {
    for (const task of point.tasks) {
      incoming.push({ task, pointIndex, pointTitle: point.title });
    }
  });

  const existing = await fetchTasksForMinute(
    options.supabase,
    options.clubId,
    options.meetingMinutesId
  );
  const existingById = new Map(existing.map((row) => [row.id, row]));
  const seenIds = new Set<string>();
  const now = new Date().toISOString();
  const pvActive = options.pvStatus === "validated";

  const upserts = incoming.map(({ task, pointIndex, pointTitle }) => {
    const id = task.id as string;
    seenIds.add(id);
    const prev = existingById.get(id);
    const wasDone = prev?.status === "done";
    const isDone = wasDone || task.status === "done";

    let completed_at = prev?.completed_at ?? task.completedAt ?? null;
    let completed_by = prev?.completed_by ?? null;
    if (isDone && !wasDone) {
      completed_at = completed_at || now;
      completed_by = completed_by || options.userId;
    }
    if (!isDone) {
      completed_at = null;
      completed_by = null;
    }

    return {
      id,
      club_id: options.clubId,
      meeting_minutes_id: options.meetingMinutesId,
      point_index: pointIndex,
      point_title: pointTitle,
      description: task.description,
      responsible_name: task.responsible,
      responsible_client_id: task.responsibleClientId || null,
      deadline: task.deadline || null,
      status: isDone ? "done" : task.status,
      is_active: pvActive && !isDone,
      completed_at,
      completed_by,
    };
  });

  if (upserts.length > 0) {
    const { error } = await options.supabase
      .from("meeting_minute_tasks")
      .upsert(upserts, { onConflict: "id" });
    if (error) throw error;
  }

  const missing = existing.filter((row) => !seenIds.has(row.id) && row.status !== "cancelled");
  for (const row of missing) {
    if (pvActive || row.is_active) {
      const { error } = await options.supabase
        .from("meeting_minute_tasks")
        .update({ status: "cancelled", is_active: false })
        .eq("id", row.id)
        .eq("club_id", options.clubId);
      if (error) throw error;
    } else {
      const { error } = await options.supabase
        .from("meeting_minute_tasks")
        .delete()
        .eq("id", row.id)
        .eq("club_id", options.clubId);
      if (error) throw error;
    }
  }

  const upsertById = new Map(upserts.map((row) => [row.id, row]));
  return points.map((point) => ({
    ...point,
    tasks: point.tasks.map((task) => {
      const row = upsertById.get(task.id || "");
      if (!row) return task;
      return {
        ...task,
        status: row.status,
        completedAt: row.completed_at,
      };
    }),
  }));
}

export async function backfillValidatedMinuteTasks(
  supabase: DbClient,
  clubId: string,
  userId: string
): Promise<void> {
  const { data: minutes, error } = await supabase
    .from("meeting_minutes")
    .select(
      "id, club_id, title, meeting_date, start_time, end_time, location, meeting_type, status, chairman, secretary, attendees, excused, absent, points, agenda_items, discussion_points, decisions, tasks, miscellaneous, next_meeting, created_by, created_at, updated_at"
    )
    .eq("club_id", clubId)
    .eq("status", "validated");
  if (error) throw error;
  if (!minutes?.length) return;

  const { data: existing, error: existingError } = await supabase
    .from("meeting_minute_tasks")
    .select("meeting_minutes_id")
    .eq("club_id", clubId);
  if (existingError) throw existingError;

  const hasRows = new Set((existing || []).map((row) => String(row.meeting_minutes_id)));

  for (const raw of minutes) {
    const id = String((raw as { id: string }).id);
    if (hasRows.has(id)) continue;
    const mapped = mapMeetingMinutesRow(raw as Record<string, unknown>);
    if (!mapped) continue;
    const hasTasks = mapped.points.some((point) => point.tasks.length > 0);
    if (!hasTasks) continue;
    const syncedPoints = await syncMeetingMinuteTasks({
      supabase,
      clubId,
      userId,
      meetingMinutesId: id,
      pvStatus: "validated",
      points: mapped.points,
    });
    await supabase
      .from("meeting_minutes")
      .update({ points: syncedPoints })
      .eq("id", id)
      .eq("club_id", clubId);
  }
}

export async function completeMeetingMinuteTask(
  supabase: DbClient,
  options: { clubId: string; userId: string; taskId: string }
): Promise<MeetingMinuteTaskRow> {
  const { data: row, error } = await supabase
    .from("meeting_minute_tasks")
    .select("*")
    .eq("id", options.taskId)
    .eq("club_id", options.clubId)
    .maybeSingle();
  if (error) throw error;
  if (!row) {
    throw new Error("Tâche introuvable");
  }

  const mapped = mapTaskRow(row as Record<string, unknown>);
  if (mapped.status === "cancelled") {
    throw new Error("Tâche introuvable");
  }

  const completedAt = mapped.completed_at || new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("meeting_minute_tasks")
    .update({
      status: "done",
      is_active: false,
      completed_at: completedAt,
      completed_by: mapped.completed_by || options.userId,
    })
    .eq("id", options.taskId)
    .eq("club_id", options.clubId)
    .select("*")
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updated) throw new Error("Tâche introuvable");

  const { data: minute, error: minuteError } = await supabase
    .from("meeting_minutes")
    .select("id, points, agenda_items, discussion_points, decisions, tasks")
    .eq("id", mapped.meeting_minutes_id)
    .eq("club_id", options.clubId)
    .maybeSingle();
  if (!minuteError && minute) {
    const current = mapMeetingMinutesRow({
      ...(minute as Record<string, unknown>),
      club_id: options.clubId,
      title: "",
      meeting_date: "",
      meeting_type: "other",
      status: "validated",
    });
    if (current) {
      const nextPoints = markTaskDoneInPoints(current.points, options.taskId, completedAt);
      await supabase
        .from("meeting_minutes")
        .update({ points: nextPoints })
        .eq("id", mapped.meeting_minutes_id)
        .eq("club_id", options.clubId);
    }
  }

  return mapTaskRow(updated as Record<string, unknown>);
}
