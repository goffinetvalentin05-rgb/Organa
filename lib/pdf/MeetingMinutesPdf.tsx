import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import {
  clubDocumentPdfStyles as styles,
  formatPdfDateLong,
  pdfHyphenationCallback,
} from "@/lib/pdf/clubPdfLayout";
import type {
  AgendaItem,
  DecisionEntry,
  MeetingStatus,
  MeetingType,
  ParticipantEntry,
  TaskEntry,
} from "@/lib/meeting-minutes";
import {
  meetingStatusLabel,
  meetingTypeLabel,
  taskStatusLabel,
} from "@/lib/meeting-minutes";

export type MeetingMinutesPdfLocale = "fr" | "en" | "de";

type CompanyBlock = {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
};

export type MeetingMinutesPdfProps = {
  company: CompanyBlock;
  primaryColor?: string;
  minute: {
    title: string;
    meetingDate: string;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    meetingType: MeetingType;
    status: MeetingStatus;
    chairman: string | null;
    secretary: string | null;
    attendees: ParticipantEntry[];
    excused: ParticipantEntry[];
    absent: ParticipantEntry[];
    agendaItems: AgendaItem[];
    discussionPoints: string;
    decisions: DecisionEntry[];
    tasks: TaskEntry[];
    miscellaneous: string;
    nextMeeting: string;
    generatedAt: string;
  };
  locale: MeetingMinutesPdfLocale;
};

const L = {
  fr: {
    docTitle: "PROCÈS-VERBAL DE SÉANCE",
    date: "Date",
    time: "Horaire",
    location: "Lieu",
    type: "Type de séance",
    status: "Statut",
    chairman: "Président de séance",
    secretary: "Rédacteur du PV",
    attendees: "Présents",
    excused: "Excusés",
    absent: "Absents",
    agenda: "Ordre du jour",
    discussion: "Points discutés",
    decisions: "Décisions prises",
    tasks: "Tâches à faire",
    taskDescription: "Tâche",
    taskResponsible: "Responsable",
    taskDeadline: "Délai",
    taskStatus: "Statut",
    miscellaneous: "Divers",
    nextMeeting: "Prochaine séance",
    generated: "Document généré le",
    none: "—",
    noItems: "Aucun élément",
  },
  en: {
    docTitle: "MEETING MINUTES",
    date: "Date",
    time: "Time",
    location: "Location",
    type: "Meeting type",
    status: "Status",
    chairman: "Chair",
    secretary: "Secretary",
    attendees: "Present",
    excused: "Excused",
    absent: "Absent",
    agenda: "Agenda",
    discussion: "Discussion points",
    decisions: "Decisions",
    tasks: "Action items",
    taskDescription: "Task",
    taskResponsible: "Owner",
    taskDeadline: "Deadline",
    taskStatus: "Status",
    miscellaneous: "Miscellaneous",
    nextMeeting: "Next meeting",
    generated: "Generated on",
    none: "—",
    noItems: "No items",
  },
  de: {
    docTitle: "SITZUNGSPROTOKOLL",
    date: "Datum",
    time: "Uhrzeit",
    location: "Ort",
    type: "Sitzungstyp",
    status: "Status",
    chairman: "Sitzungsleitung",
    secretary: "Protokollführer",
    attendees: "Anwesend",
    excused: "Entschuldigt",
    absent: "Abwesend",
    agenda: "Tagesordnung",
    discussion: "Besprochene Punkte",
    decisions: "Beschlüsse",
    tasks: "Aufgaben",
    taskDescription: "Aufgabe",
    taskResponsible: "Verantwortlich",
    taskDeadline: "Frist",
    taskStatus: "Status",
    miscellaneous: "Verschiedenes",
    nextMeeting: "Nächste Sitzung",
    generated: "Erstellt am",
    none: "—",
    noItems: "Keine Einträge",
  },
} as const;

function formatTimeRange(
  start: string | null,
  end: string | null,
  none: string
): string {
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return none;
}

function participantNames(list: ParticipantEntry[]): string {
  if (!list.length) return "";
  return list.map((p) => p.name).join(", ");
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function TextSection({ title, content, none }: { title: string; content: string; none: string }) {
  const trimmed = content.trim();
  return (
    <View style={styles.notesSection}>
      <SectionTitle>{title}</SectionTitle>
      <Text style={styles.contractBodyText} hyphenationCallback={pdfHyphenationCallback}>
        {trimmed || none}
      </Text>
    </View>
  );
}

function ParticipantBlock({
  title,
  list,
  none,
  noItems,
}: {
  title: string;
  list: ParticipantEntry[];
  none: string;
  noItems: string;
}) {
  const names = participantNames(list);
  return (
    <View style={{ marginBottom: 10 }}>
      <SectionTitle>{title}</SectionTitle>
      <View style={styles.clientBox}>
        <Text style={styles.wrapText} hyphenationCallback={pdfHyphenationCallback}>
          {names || noItems}
        </Text>
      </View>
    </View>
  );
}

export function MeetingMinutesPdf({ company, primaryColor, minute, locale }: MeetingMinutesPdfProps) {
  const labels = L[locale];
  const accent = primaryColor || "#1A23FF";
  const timeLabel = formatTimeRange(minute.startTime, minute.endTime, labels.none);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.companyBlock}>
              <View style={styles.companyTop}>
                {company.logoUrl ? (
                  <Image src={company.logoUrl} style={styles.logo} />
                ) : null}
                <View>
                  <Text style={styles.companyName}>{company.name || labels.none}</Text>
                  {company.address ? (
                    <Text style={styles.companyDetails}>{company.address}</Text>
                  ) : null}
                  {company.email || company.phone ? (
                    <Text style={styles.companyDetails}>
                      {[company.email, company.phone].filter(Boolean).join(" · ")}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={styles.documentBlock}>
              <Text style={[styles.documentType, { color: accent }]}>{labels.docTitle}</Text>
              <View style={styles.metaBox}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{labels.date}</Text>
                  <Text>{formatPdfDateLong(minute.meetingDate)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{labels.time}</Text>
                  <Text>{timeLabel}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{labels.type}</Text>
                  <Text>{meetingTypeLabel(minute.meetingType, locale)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{labels.status}</Text>
                  <Text>{meetingStatusLabel(minute.status, locale)}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              marginBottom: 14,
              color: "#0F172A",
            }}
          >
            {minute.title}
          </Text>

          <View style={styles.clientSection}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <SectionTitle>{labels.location}</SectionTitle>
                <Text style={styles.wrapText}>{minute.location?.trim() || labels.none}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <SectionTitle>{labels.chairman}</SectionTitle>
                <Text style={styles.wrapText}>{minute.chairman?.trim() || labels.none}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <SectionTitle>{labels.secretary}</SectionTitle>
                <Text style={styles.wrapText}>{minute.secretary?.trim() || labels.none}</Text>
              </View>
            </View>
          </View>

          <ParticipantBlock
            title={labels.attendees}
            list={minute.attendees}
            none={labels.none}
            noItems={labels.noItems}
          />
          <ParticipantBlock
            title={labels.excused}
            list={minute.excused}
            none={labels.none}
            noItems={labels.noItems}
          />
          <ParticipantBlock
            title={labels.absent}
            list={minute.absent}
            none={labels.none}
            noItems={labels.noItems}
          />

          <View style={styles.notesSection}>
            <SectionTitle>{labels.agenda}</SectionTitle>
            {minute.agendaItems.length ? (
              minute.agendaItems.map((item, i) => (
                <Text
                  key={`agenda-${i}`}
                  style={[styles.contractBodyText, { marginBottom: 4 }]}
                  hyphenationCallback={pdfHyphenationCallback}
                >
                  {i + 1}. {item.text}
                </Text>
              ))
            ) : (
              <Text style={styles.contractBodyText}>{labels.noItems}</Text>
            )}
          </View>

          <TextSection title={labels.discussion} content={minute.discussionPoints} none={labels.noItems} />

          <View style={styles.notesSection}>
            <SectionTitle>{labels.decisions}</SectionTitle>
            {minute.decisions.length ? (
              minute.decisions.map((item, i) => (
                <Text
                  key={`decision-${i}`}
                  style={[styles.contractBodyText, { marginBottom: 4 }]}
                  hyphenationCallback={pdfHyphenationCallback}
                >
                  • {item.text}
                </Text>
              ))
            ) : (
              <Text style={styles.contractBodyText}>{labels.noItems}</Text>
            )}
          </View>

          <View style={styles.notesSection}>
            <SectionTitle>{labels.tasks}</SectionTitle>
            {minute.tasks.length ? (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: "40%" }]}>
                    {labels.taskDescription}
                  </Text>
                  <Text style={[styles.tableHeaderCell, { width: "22%" }]}>
                    {labels.taskResponsible}
                  </Text>
                  <Text style={[styles.tableHeaderCell, { width: "18%" }]}>
                    {labels.taskDeadline}
                  </Text>
                  <Text style={[styles.tableHeaderCell, { width: "20%", textAlign: "right" }]}>
                    {labels.taskStatus}
                  </Text>
                </View>
                {minute.tasks.map((task, i) => (
                  <View key={`task-${i}`} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: "40%" }]}>{task.description}</Text>
                    <Text style={[styles.tableCell, { width: "22%" }]}>
                      {task.responsible || labels.none}
                    </Text>
                    <Text style={[styles.tableCell, { width: "18%" }]}>
                      {task.deadline
                        ? formatPdfDateLong(task.deadline)
                        : labels.none}
                    </Text>
                    <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
                      {taskStatusLabel(task.status, locale)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.contractBodyText}>{labels.noItems}</Text>
            )}
          </View>

          <TextSection title={labels.miscellaneous} content={minute.miscellaneous} none={labels.noItems} />
          <TextSection title={labels.nextMeeting} content={minute.nextMeeting} none={labels.noItems} />
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText} hyphenationCallback={pdfHyphenationCallback}>
            {labels.generated} {formatPdfDateLong(minute.generatedAt)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
