export const MEETING_TYPES = [
  "committee",
  "general_assembly",
  "coaches",
  "sponsoring",
  "finance",
  "other",
] as const;

export type MeetingType = (typeof MEETING_TYPES)[number];

export const MEETING_STATUSES = ["draft", "validated", "archived"] as const;

export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type ParticipantEntry = {
  clientId?: string | null;
  name: string;
};

export type AgendaItem = {
  text: string;
};

export type DecisionEntry = {
  text: string;
};

export type TaskEntry = {
  description: string;
  responsible: string;
  deadline: string;
  status: TaskStatus;
};

export type MeetingMinutesPayload = {
  title: string;
  meetingDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  meetingType: MeetingType;
  status: MeetingStatus;
  chairman?: string | null;
  secretary?: string | null;
  attendees: ParticipantEntry[];
  excused: ParticipantEntry[];
  absent: ParticipantEntry[];
  agendaItems: AgendaItem[];
  discussionPoints: string;
  decisions: DecisionEntry[];
  tasks: TaskEntry[];
  miscellaneous: string;
  nextMeeting: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function normalizeParticipantEntry(raw: unknown): ParticipantEntry | null {
  if (!isRecord(raw)) return null;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) return null;
  const clientId =
    typeof raw.clientId === "string" && raw.clientId.trim()
      ? raw.clientId.trim()
      : null;
  return { clientId, name };
}

function normalizeParticipants(input: unknown): ParticipantEntry[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(normalizeParticipantEntry)
    .filter((p): p is ParticipantEntry => p != null);
}

function normalizeAgendaItems(input: unknown): AgendaItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw) => {
      if (!isRecord(raw)) return null;
      const text = typeof raw.text === "string" ? raw.text.trim() : "";
      return text ? { text } : null;
    })
    .filter((item): item is AgendaItem => item != null);
}

function normalizeDecisions(input: unknown): DecisionEntry[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw) => {
      if (!isRecord(raw)) return null;
      const text = typeof raw.text === "string" ? raw.text.trim() : "";
      return text ? { text } : null;
    })
    .filter((item): item is DecisionEntry => item != null);
}

function normalizeTaskStatus(raw: unknown): TaskStatus {
  if (raw === "in_progress" || raw === "done") return raw;
  return "todo";
}

function normalizeTasks(input: unknown): TaskEntry[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw) => {
      if (!isRecord(raw)) return null;
      const description =
        typeof raw.description === "string" ? raw.description.trim() : "";
      if (!description) return null;
      return {
        description,
        responsible:
          typeof raw.responsible === "string" ? raw.responsible.trim() : "",
        deadline: typeof raw.deadline === "string" ? raw.deadline.trim() : "",
        status: normalizeTaskStatus(raw.status),
      };
    })
    .filter((item): item is TaskEntry => item != null);
}

export function normalizeMeetingType(raw: unknown): MeetingType | null {
  if (typeof raw === "string" && (MEETING_TYPES as readonly string[]).includes(raw)) {
    return raw as MeetingType;
  }
  return null;
}

export function normalizeMeetingStatus(raw: unknown): MeetingStatus | null {
  if (typeof raw === "string" && (MEETING_STATUSES as readonly string[]).includes(raw)) {
    return raw as MeetingStatus;
  }
  return null;
}

export function parseMeetingMinutesBody(body: unknown): {
  payload: MeetingMinutesPayload | null;
  error: string | null;
} {
  if (!isRecord(body)) {
    return { payload: null, error: "Corps de requête invalide" };
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const meetingDate =
    typeof body.meetingDate === "string" ? body.meetingDate.trim() : "";

  if (!title) {
    return { payload: null, error: "Le titre est requis" };
  }
  if (!meetingDate || !/^\d{4}-\d{2}-\d{2}$/.test(meetingDate)) {
    return { payload: null, error: "Date de séance invalide" };
  }

  const meetingType = normalizeMeetingType(body.meetingType) ?? "other";
  const status = normalizeMeetingStatus(body.status) ?? "draft";

  return {
    payload: {
      title,
      meetingDate,
      startTime:
        typeof body.startTime === "string" ? body.startTime.trim() || null : null,
      endTime: typeof body.endTime === "string" ? body.endTime.trim() || null : null,
      location:
        typeof body.location === "string" ? body.location.trim() || null : null,
      meetingType,
      status,
      chairman:
        typeof body.chairman === "string" ? body.chairman.trim() || null : null,
      secretary:
        typeof body.secretary === "string" ? body.secretary.trim() || null : null,
      attendees: normalizeParticipants(body.attendees),
      excused: normalizeParticipants(body.excused),
      absent: normalizeParticipants(body.absent),
      agendaItems: normalizeAgendaItems(body.agendaItems),
      discussionPoints:
        typeof body.discussionPoints === "string" ? body.discussionPoints : "",
      decisions: normalizeDecisions(body.decisions),
      tasks: normalizeTasks(body.tasks),
      miscellaneous:
        typeof body.miscellaneous === "string" ? body.miscellaneous : "",
      nextMeeting: typeof body.nextMeeting === "string" ? body.nextMeeting : "",
    },
    error: null,
  };
}

export function mapMeetingMinutesRow(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: row.id as string,
    clubId: row.club_id as string,
    title: row.title as string,
    meetingDate: String(row.meeting_date ?? ""),
    startTime: (row.start_time as string | null) ?? null,
    endTime: (row.end_time as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    meetingType: normalizeMeetingType(row.meeting_type) ?? "other",
    status: normalizeMeetingStatus(row.status) ?? "draft",
    chairman: (row.chairman as string | null) ?? null,
    secretary: (row.secretary as string | null) ?? null,
    attendees: normalizeParticipants(row.attendees),
    excused: normalizeParticipants(row.excused),
    absent: normalizeParticipants(row.absent),
    agendaItems: normalizeAgendaItems(row.agenda_items),
    discussionPoints: String(row.discussion_points ?? ""),
    decisions: normalizeDecisions(row.decisions),
    tasks: normalizeTasks(row.tasks),
    miscellaneous: String(row.miscellaneous ?? ""),
    nextMeeting: String(row.next_meeting ?? ""),
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function meetingMinutesToDbPayload(
  payload: MeetingMinutesPayload
): Record<string, unknown> {
  return {
    title: payload.title,
    meeting_date: payload.meetingDate,
    start_time: payload.startTime ?? null,
    end_time: payload.endTime ?? null,
    location: payload.location ?? null,
    meeting_type: payload.meetingType,
    status: payload.status,
    chairman: payload.chairman ?? null,
    secretary: payload.secretary ?? null,
    attendees: payload.attendees,
    excused: payload.excused,
    absent: payload.absent,
    agenda_items: payload.agendaItems,
    discussion_points: payload.discussionPoints,
    decisions: payload.decisions,
    tasks: payload.tasks,
    miscellaneous: payload.miscellaneous,
    next_meeting: payload.nextMeeting,
  };
}

const MEETING_TYPE_LABELS_FR: Record<MeetingType, string> = {
  committee: "Comité",
  general_assembly: "Assemblée générale",
  coaches: "Entraîneurs",
  sponsoring: "Sponsoring",
  finance: "Finance",
  other: "Autre",
};

const MEETING_STATUS_LABELS_FR: Record<MeetingStatus, string> = {
  draft: "Brouillon",
  validated: "Validé",
  archived: "Archivé",
};

const TASK_STATUS_LABELS_FR: Record<TaskStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

export function meetingTypeLabel(
  type: MeetingType,
  locale: "fr" | "en" | "de" = "fr"
): string {
  if (locale === "fr") return MEETING_TYPE_LABELS_FR[type];
  const en: Record<MeetingType, string> = {
    committee: "Committee",
    general_assembly: "General assembly",
    coaches: "Coaches",
    sponsoring: "Sponsoring",
    finance: "Finance",
    other: "Other",
  };
  const de: Record<MeetingType, string> = {
    committee: "Komitee",
    general_assembly: "Generalversammlung",
    coaches: "Trainer",
    sponsoring: "Sponsoring",
    finance: "Finanzen",
    other: "Sonstiges",
  };
  if (locale === "de") return de[type];
  return en[type];
}

export function meetingStatusLabel(
  status: MeetingStatus,
  locale: "fr" | "en" | "de" = "fr"
): string {
  if (locale === "fr") return MEETING_STATUS_LABELS_FR[status];
  const en: Record<MeetingStatus, string> = {
    draft: "Draft",
    validated: "Validated",
    archived: "Archived",
  };
  const de: Record<MeetingStatus, string> = {
    draft: "Entwurf",
    validated: "Validiert",
    archived: "Archiviert",
  };
  if (locale === "de") return de[status];
  return en[status];
}

export function taskStatusLabel(
  status: TaskStatus,
  locale: "fr" | "en" | "de" = "fr"
): string {
  if (locale === "fr") return TASK_STATUS_LABELS_FR[status];
  const en: Record<TaskStatus, string> = {
    todo: "To do",
    in_progress: "In progress",
    done: "Done",
  };
  const de: Record<TaskStatus, string> = {
    todo: "Zu erledigen",
    in_progress: "In Bearbeitung",
    done: "Erledigt",
  };
  if (locale === "de") return de[status];
  return en[status];
}
