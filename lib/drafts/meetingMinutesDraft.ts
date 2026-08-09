import {
  createEmptyMeetingPoint,
  MEETING_STATUSES,
  MEETING_TYPES,
  TASK_STATUSES,
  type MeetingPoint,
  type MeetingStatus,
  type MeetingType,
  type ParticipantEntry,
  type TaskEntry,
  type TaskStatus,
} from "@/lib/meeting-minutes";
import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const MEETING_MINUTES_DRAFT_VERSION = 1 as const;

export type MeetingMinutesDraftData = {
  title: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  chairman: string;
  secretary: string;
  attendees: ParticipantEntry[];
  excused: ParticipantEntry[];
  absent: ParticipantEntry[];
  points: MeetingPoint[];
  miscellaneous: string;
  nextMeeting: string;
};

export function emptyMeetingMinutesDraftData(
  overrides: Partial<MeetingMinutesDraftData> = {}
): MeetingMinutesDraftData {
  return {
    title: "",
    meetingDate: "",
    startTime: "",
    endTime: "",
    location: "",
    meetingType: "committee",
    status: "draft",
    chairman: "",
    secretary: "",
    attendees: [],
    excused: [],
    absent: [],
    points: [createEmptyMeetingPoint()],
    miscellaneous: "",
    nextMeeting: "",
    ...overrides,
  };
}

function normalizeParticipant(raw: unknown): ParticipantEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const name = typeof p.name === "string" ? p.name.trim() : "";
  if (!name) return null;
  return {
    name,
    clientId: typeof p.clientId === "string" ? p.clientId : null,
  };
}

function normalizeTask(raw: unknown): TaskEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const status: TaskStatus =
    typeof t.status === "string" &&
    (TASK_STATUSES as readonly string[]).includes(t.status)
      ? (t.status as TaskStatus)
      : "todo";
  return {
    description: typeof t.description === "string" ? t.description : "",
    responsible: typeof t.responsible === "string" ? t.responsible : "",
    deadline: typeof t.deadline === "string" ? t.deadline : "",
    status,
  };
}

function normalizePoint(raw: unknown): MeetingPoint | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const decisions = Array.isArray(p.decisions)
    ? p.decisions.filter((d): d is string => typeof d === "string")
    : [];
  const tasks = Array.isArray(p.tasks)
    ? p.tasks.map(normalizeTask).filter((task): task is TaskEntry => task !== null)
    : [];
  return {
    title: typeof p.title === "string" ? p.title : "",
    discussion: typeof p.discussion === "string" ? p.discussion : "",
    decisions,
    tasks,
  };
}

export function normalizeMeetingMinutesDraftData(
  raw: unknown
): MeetingMinutesDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  const meetingType: MeetingType =
    typeof d.meetingType === "string" &&
    (MEETING_TYPES as readonly string[]).includes(d.meetingType)
      ? (d.meetingType as MeetingType)
      : "committee";

  const status: MeetingStatus =
    typeof d.status === "string" &&
    (MEETING_STATUSES as readonly string[]).includes(d.status)
      ? (d.status as MeetingStatus)
      : "draft";

  const attendees = Array.isArray(d.attendees)
    ? d.attendees
        .map(normalizeParticipant)
        .filter((p): p is ParticipantEntry => p !== null)
    : [];
  const excused = Array.isArray(d.excused)
    ? d.excused
        .map(normalizeParticipant)
        .filter((p): p is ParticipantEntry => p !== null)
    : [];
  const absent = Array.isArray(d.absent)
    ? d.absent
        .map(normalizeParticipant)
        .filter((p): p is ParticipantEntry => p !== null)
    : [];

  const pointsRaw = Array.isArray(d.points) ? d.points : [];
  const points = pointsRaw
    .map(normalizePoint)
    .filter((p): p is MeetingPoint => p !== null);
  const safePoints = points.length > 0 ? points : [createEmptyMeetingPoint()];

  return {
    title: typeof d.title === "string" ? d.title : "",
    meetingDate: typeof d.meetingDate === "string" ? d.meetingDate : "",
    startTime: typeof d.startTime === "string" ? d.startTime : "",
    endTime: typeof d.endTime === "string" ? d.endTime : "",
    location: typeof d.location === "string" ? d.location : "",
    meetingType,
    status,
    chairman: typeof d.chairman === "string" ? d.chairman : "",
    secretary: typeof d.secretary === "string" ? d.secretary : "",
    attendees,
    excused,
    absent,
    points: safePoints,
    miscellaneous: typeof d.miscellaneous === "string" ? d.miscellaneous : "",
    nextMeeting: typeof d.nextMeeting === "string" ? d.nextMeeting : "",
  };
}

export function isMeaningfulMeetingMinutesDraft(
  data: MeetingMinutesDraftData
): boolean {
  if (data.title.trim()) return true;
  if (data.meetingDate) return true;
  if (data.startTime.trim()) return true;
  if (data.endTime.trim()) return true;
  if (data.location.trim()) return true;
  if (data.chairman.trim()) return true;
  if (data.secretary.trim()) return true;
  if (data.miscellaneous.trim()) return true;
  if (data.nextMeeting.trim()) return true;
  if (data.meetingType !== "committee") return true;
  if (data.status !== "draft") return true;
  if (data.attendees.length > 0) return true;
  if (data.excused.length > 0) return true;
  if (data.absent.length > 0) return true;
  if (data.points.length > 1) return true;
  return data.points.some(
    (p) =>
      p.title.trim() ||
      p.discussion.trim() ||
      p.decisions.some((dec) => dec.trim()) ||
      p.tasks.some(
        (t) =>
          t.description.trim() ||
          t.responsible.trim() ||
          t.deadline.trim() ||
          t.status !== "todo"
      )
  );
}

export const meetingMinutesDraftStore =
  createLocalDraftStore<MeetingMinutesDraftData>({
    version: MEETING_MINUTES_DRAFT_VERSION,
    product: "sport",
    formType: "meeting-minutes",
    isMeaningful: isMeaningfulMeetingMinutesDraft,
    normalize: normalizeMeetingMinutesDraftData,
  });
