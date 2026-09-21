import { describe, expect, it } from "vitest";
import {
  compareActiveTasks,
  markTaskDoneInPoints,
  notificationKindForUrgency,
  overlayTasksOnPoints,
  relativeDeadline,
  taskNotificationKey,
  taskUrgency,
  type MeetingMinuteTaskDto,
  type MeetingMinuteTaskRow,
} from "@/lib/meeting-minute-tasks";
import type { MeetingPoint } from "@/lib/meeting-minutes";

const baseDto = (over: Partial<MeetingMinuteTaskDto>): MeetingMinuteTaskDto => ({
  id: "a",
  meetingMinutesId: "pv",
  meetingTitle: "PV",
  meetingDate: "2026-09-21",
  meetingType: "committee",
  pointIndex: 0,
  pointTitle: "Point",
  description: "Tâche",
  responsibleName: "Lucas",
  responsibleClientId: null,
  deadline: null,
  status: "todo",
  isActive: true,
  completedAt: null,
  urgency: "none",
  ...over,
});

describe("relativeDeadline", () => {
  it("décrit l'échéance de façon relative", () => {
    expect(relativeDeadline(null, "2026-09-21")).toEqual({ kind: "none" });
    expect(relativeDeadline("2026-09-18", "2026-09-21")).toEqual({ kind: "overdue", count: 3 });
    expect(relativeDeadline("2026-09-21", "2026-09-21")).toEqual({ kind: "today" });
    expect(relativeDeadline("2026-09-22", "2026-09-21")).toEqual({ kind: "tomorrow" });
    expect(relativeDeadline("2026-09-24", "2026-09-21")).toEqual({ kind: "inDays", count: 3 });
  });
});

describe("taskUrgency", () => {
  it("classe les échéances", () => {
    expect(taskUrgency(null, "2026-09-21")).toBe("none");
    expect(taskUrgency("2026-09-18", "2026-09-21")).toBe("overdue");
    expect(taskUrgency("2026-09-21", "2026-09-21")).toBe("today");
    expect(taskUrgency("2026-09-23", "2026-09-21")).toBe("soon");
    expect(taskUrgency("2026-10-01", "2026-09-21")).toBe("normal");
  });
});

describe("compareActiveTasks", () => {
  it("trie retard > aujourd'hui > bientôt > autres > sans date", () => {
    const list = [
      baseDto({ id: "none", urgency: "none", deadline: null }),
      baseDto({ id: "soon", urgency: "soon", deadline: "2026-09-23" }),
      baseDto({ id: "over", urgency: "overdue", deadline: "2026-09-18" }),
      baseDto({ id: "today", urgency: "today", deadline: "2026-09-21" }),
    ].sort(compareActiveTasks);
    expect(list.map((item) => item.id)).toEqual(["over", "today", "soon", "none"]);
  });
});

describe("taskNotificationKey", () => {
  it("est idempotente par tâche et type", () => {
    expect(taskNotificationKey("abc", "assigned")).toBe("pv_task_assigned_abc");
    expect(taskNotificationKey("abc", "soon", "2026-09-23")).toBe(
      "pv_task_due_soon_abc_2026-09-23"
    );
    expect(notificationKindForUrgency("overdue")).toBe("overdue");
    expect(notificationKindForUrgency("normal")).toBe("assigned");
  });
});

describe("overlayTasksOnPoints", () => {
  it("garde le JSON si la table est vide", () => {
    const points: MeetingPoint[] = [
      {
        title: "A",
        discussion: "",
        decisions: [],
        tasks: [{ description: "Legacy", responsible: "X", deadline: "", status: "todo" }],
      },
    ];
    expect(overlayTasksOnPoints(points, [])).toEqual(points);
  });

  it("remplace par les lignes de la table, hors cancelled", () => {
    const points: MeetingPoint[] = [
      { title: "A", discussion: "", decisions: [], tasks: [] },
    ];
    const rows: MeetingMinuteTaskRow[] = [
      {
        id: "t1",
        club_id: "c",
        meeting_minutes_id: "pv",
        point_index: 0,
        point_title: "A",
        description: "Budget",
        responsible_name: "Lucas",
        responsible_client_id: "m1",
        deadline: "2026-09-30",
        status: "todo",
        is_active: true,
        completed_at: null,
        completed_by: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "t2",
        club_id: "c",
        meeting_minutes_id: "pv",
        point_index: 0,
        point_title: "A",
        description: "Annulée",
        responsible_name: "",
        responsible_client_id: null,
        deadline: null,
        status: "cancelled",
        is_active: false,
        completed_at: null,
        completed_by: null,
        created_at: "",
        updated_at: "",
      },
    ];
    const overlayed = overlayTasksOnPoints(points, rows);
    expect(overlayed[0].tasks).toHaveLength(1);
    expect(overlayed[0].tasks[0].description).toBe("Budget");
    expect(overlayed[0].tasks[0].responsibleClientId).toBe("m1");
  });
});

describe("markTaskDoneInPoints", () => {
  it("synchronise le statut done dans le PV", () => {
    const points: MeetingPoint[] = [
      {
        title: "A",
        discussion: "",
        decisions: [],
        tasks: [
          { id: "t1", description: "Budget", responsible: "Lucas", deadline: "", status: "todo" },
        ],
      },
    ];
    const next = markTaskDoneInPoints(points, "t1", "2026-09-25T10:00:00.000Z");
    expect(next[0].tasks[0].status).toBe("done");
    expect(next[0].tasks[0].completedAt).toBe("2026-09-25T10:00:00.000Z");
  });
});
