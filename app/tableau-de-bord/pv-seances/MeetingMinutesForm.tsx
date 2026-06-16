"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/components/I18nProvider";
import {
  SectionCard,
  ActionButton,
  dashboardInputClass,
  dashboardSelectClass,
  dashboardLabelClass,
  dashboardHintClass,
  dashboardInnerPanelClass,
} from "@/components/ui";
import { FileText, Users, Plus, Trash, ClipboardList } from "@/lib/icons";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import type {
  MeetingMinutesPayload,
  MeetingPoint,
  MeetingStatus,
  MeetingType,
  ParticipantEntry,
  TaskEntry,
  TaskStatus,
} from "@/lib/meeting-minutes";
import {
  MEETING_TYPES,
  TASK_STATUSES,
  createEmptyMeetingPoint,
} from "@/lib/meeting-minutes";

export type MeetingMinutesFormValues = {
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

const defaultForm: MeetingMinutesFormValues = {
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
};

type ClubMember = {
  id: string;
  nom: string;
};

type Props = {
  defaultValues?: Partial<MeetingMinutesFormValues>;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (payload: MeetingMinutesPayload) => Promise<void>;
};

function ParticipantListEditor({
  label,
  list,
  members,
  memberSearch,
  onMemberSearchChange,
  freeText,
  onFreeTextChange,
  selectedMemberId,
  onSelectedMemberIdChange,
  onAddMember,
  onAddFreeText,
  onRemove,
  t,
}: {
  label: string;
  list: ParticipantEntry[];
  members: ClubMember[];
  memberSearch: string;
  onMemberSearchChange: (v: string) => void;
  freeText: string;
  onFreeTextChange: (v: string) => void;
  selectedMemberId: string;
  onSelectedMemberIdChange: (v: string) => void;
  onAddMember: () => void;
  onAddFreeText: () => void;
  onRemove: (index: number) => void;
  t: (key: string) => string;
}) {
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return m.nom.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-white/90">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.fromMembers")}</label>
          <input
            type="search"
            className={`${dashboardInputClass} mb-2`}
            placeholder={t("dashboard.meetingMinutes.form.searchMember")}
            value={memberSearch}
            onChange={(e) => onMemberSearchChange(e.target.value)}
          />
          <select
            className={dashboardSelectClass}
            value={selectedMemberId}
            onChange={(e) => onSelectedMemberIdChange(e.target.value)}
          >
            <option value="">{t("dashboard.meetingMinutes.form.selectMember")}</option>
            {filteredMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>
        <ActionButton type="button" className="shrink-0" onClick={onAddMember}>
          <Plus className="h-4 w-4" />
          {t("dashboard.meetingMinutes.form.addMember")}
        </ActionButton>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.freeText")}</label>
          <input
            className={dashboardInputClass}
            value={freeText}
            onChange={(e) => onFreeTextChange(e.target.value)}
            placeholder={t("dashboard.meetingMinutes.form.freeTextPlaceholder")}
          />
        </div>
        <ActionButton type="button" className="shrink-0" onClick={onAddFreeText}>
          <Plus className="h-4 w-4" />
          {t("dashboard.meetingMinutes.form.addFreeText")}
        </ActionButton>
      </div>
      {list.length > 0 ? (
        <ul className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          {list.map((p, i) => (
            <li key={`${p.name}-${i}`} className="flex items-center justify-between gap-2 text-sm text-white/90">
              <span>{p.name}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="rounded-lg p-1.5 text-red-300 transition hover:bg-red-500/10"
                title={t("dashboard.common.delete")}
              >
                <Trash className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={dashboardHintClass}>{t("dashboard.meetingMinutes.form.noParticipants")}</p>
      )}
    </div>
  );
}

export default function MeetingMinutesForm({
  defaultValues,
  submitLabel,
  savingLabel,
  onSubmit,
}: Props) {
  const { t } = useI18n();
  const [values, setValues] = useState<MeetingMinutesFormValues>({
    ...defaultForm,
    ...defaultValues,
  });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<ClubMember[]>([]);

  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [excusedSearch, setExcusedSearch] = useState("");
  const [absentSearch, setAbsentSearch] = useState("");
  const [attendeeMemberId, setAttendeeMemberId] = useState("");
  const [excusedMemberId, setExcusedMemberId] = useState("");
  const [absentMemberId, setAbsentMemberId] = useState("");
  const [attendeeFree, setAttendeeFree] = useState("");
  const [excusedFree, setExcusedFree] = useState("");
  const [absentFree, setAbsentFree] = useState("");

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/clients", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list = (data?.clients || []) as Array<{ id: string; nom?: string; name?: string }>;
        setMembers(
          list.map((c) => ({
            id: c.id,
            nom: (c.nom || c.name || "").trim() || t("dashboard.common.unknownClient"),
          }))
        );
      }
    } catch {
      /* silencieux */
    }
  }, [t]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const setField = <K extends keyof MeetingMinutesFormValues>(
    key: K,
    value: MeetingMinutesFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const addParticipant = (
    key: "attendees" | "excused" | "absent",
    entry: ParticipantEntry
  ) => {
    const name = entry.name.trim();
    if (!name) return;
    setValues((prev) => {
      const exists = prev[key].some(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) return prev;
      return { ...prev, [key]: [...prev[key], { clientId: entry.clientId ?? null, name }] };
    });
  };

  const removeParticipant = (key: "attendees" | "excused" | "absent", index: number) => {
    setValues((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const buildPayload = (status: MeetingStatus): MeetingMinutesPayload => ({
    title: values.title.trim(),
    meetingDate: values.meetingDate,
    startTime: values.startTime.trim() || null,
    endTime: values.endTime.trim() || null,
    location: values.location.trim() || null,
    meetingType: values.meetingType,
    status,
    chairman: values.chairman.trim() || null,
    secretary: values.secretary.trim() || null,
    attendees: values.attendees,
    excused: values.excused,
    absent: values.absent,
    points: values.points
      .map((point) => ({
        title: point.title.trim(),
        discussion: point.discussion,
        decisions: point.decisions.map((d) => d.trim()).filter(Boolean),
        tasks: point.tasks.filter((task) => task.description.trim()),
      }))
      .filter(
        (point) =>
          point.title ||
          point.discussion.trim() ||
          point.decisions.length > 0 ||
          point.tasks.length > 0
      ),
    miscellaneous: values.miscellaneous,
    nextMeeting: values.nextMeeting,
  });

  const updatePoint = (index: number, patch: Partial<MeetingPoint>) => {
    setValues((prev) => {
      const next = [...prev.points];
      next[index] = { ...next[index], ...patch };
      return { ...prev, points: next };
    });
  };

  const removePoint = (index: number) => {
    setValues((prev) => ({
      ...prev,
      points:
        prev.points.length > 1
          ? prev.points.filter((_, i) => i !== index)
          : [createEmptyMeetingPoint()],
    }));
  };

  const handleSave = async (status: MeetingStatus) => {
    if (!values.title.trim()) {
      toast.error(t("dashboard.meetingMinutes.form.validationTitle"));
      return;
    }
    if (!values.meetingDate) {
      toast.error(t("dashboard.meetingMinutes.form.validationDate"));
      return;
    }

    setSaving(true);
    try {
      await onSubmit(buildPayload(status));
    } catch {
      /* toast côté parent */
    } finally {
      setSaving(false);
    }
  };

  const meetingTypeLabel = (type: MeetingType) =>
    t(`dashboard.meetingMinutes.types.${type}`);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave(values.status === "validated" ? "validated" : "draft");
      }}
      className="space-y-8"
    >
      <SectionCard title={t("dashboard.meetingMinutes.form.general")} icon={FileText}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.title")} *</span>
            <input
              className={dashboardInputClass}
              value={values.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.meetingDate")} *</span>
            <input
              type="date"
              className={dashboardInputClass}
              value={values.meetingDate}
              onChange={(e) => setField("meetingDate", e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.meetingType")}</span>
            <select
              className={dashboardSelectClass}
              value={values.meetingType}
              onChange={(e) => setField("meetingType", e.target.value as MeetingType)}
            >
              {MEETING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {meetingTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.startTime")}</span>
            <input
              type="time"
              className={dashboardInputClass}
              value={values.startTime}
              onChange={(e) => setField("startTime", e.target.value)}
            />
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.endTime")}</span>
            <input
              type="time"
              className={dashboardInputClass}
              value={values.endTime}
              onChange={(e) => setField("endTime", e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.location")}</span>
            <input
              className={dashboardInputClass}
              value={values.location}
              onChange={(e) => setField("location", e.target.value)}
            />
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.chairman")}</span>
            <input
              className={dashboardInputClass}
              value={values.chairman}
              onChange={(e) => setField("chairman", e.target.value)}
            />
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.secretary")}</span>
            <input
              className={dashboardInputClass}
              value={values.secretary}
              onChange={(e) => setField("secretary", e.target.value)}
            />
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>{t("dashboard.common.status")}</span>
            <select
              className={dashboardSelectClass}
              value={values.status}
              onChange={(e) => setField("status", e.target.value as MeetingStatus)}
            >
              <option value="draft">{t("dashboard.meetingMinutes.status.draft")}</option>
              <option value="validated">{t("dashboard.meetingMinutes.status.validated")}</option>
              <option value="archived">{t("dashboard.meetingMinutes.status.archived")}</option>
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard title={t("dashboard.meetingMinutes.form.participants")} icon={Users}>
        <div className="space-y-8">
          <ParticipantListEditor
            label={t("dashboard.meetingMinutes.form.attendees")}
            list={values.attendees}
            members={members}
            memberSearch={attendeeSearch}
            onMemberSearchChange={setAttendeeSearch}
            freeText={attendeeFree}
            onFreeTextChange={setAttendeeFree}
            selectedMemberId={attendeeMemberId}
            onSelectedMemberIdChange={setAttendeeMemberId}
            onAddMember={() => {
              const m = members.find((x) => x.id === attendeeMemberId);
              if (!m) return;
              addParticipant("attendees", { clientId: m.id, name: m.nom });
              setAttendeeMemberId("");
            }}
            onAddFreeText={() => {
              addParticipant("attendees", { name: attendeeFree });
              setAttendeeFree("");
            }}
            onRemove={(i) => removeParticipant("attendees", i)}
            t={t}
          />
          <ParticipantListEditor
            label={t("dashboard.meetingMinutes.form.excused")}
            list={values.excused}
            members={members}
            memberSearch={excusedSearch}
            onMemberSearchChange={setExcusedSearch}
            freeText={excusedFree}
            onFreeTextChange={setExcusedFree}
            selectedMemberId={excusedMemberId}
            onSelectedMemberIdChange={setExcusedMemberId}
            onAddMember={() => {
              const m = members.find((x) => x.id === excusedMemberId);
              if (!m) return;
              addParticipant("excused", { clientId: m.id, name: m.nom });
              setExcusedMemberId("");
            }}
            onAddFreeText={() => {
              addParticipant("excused", { name: excusedFree });
              setExcusedFree("");
            }}
            onRemove={(i) => removeParticipant("excused", i)}
            t={t}
          />
          <ParticipantListEditor
            label={t("dashboard.meetingMinutes.form.absent")}
            list={values.absent}
            members={members}
            memberSearch={absentSearch}
            onMemberSearchChange={setAbsentSearch}
            freeText={absentFree}
            onFreeTextChange={setAbsentFree}
            selectedMemberId={absentMemberId}
            onSelectedMemberIdChange={setAbsentMemberId}
            onAddMember={() => {
              const m = members.find((x) => x.id === absentMemberId);
              if (!m) return;
              addParticipant("absent", { clientId: m.id, name: m.nom });
              setAbsentMemberId("");
            }}
            onAddFreeText={() => {
              addParticipant("absent", { name: absentFree });
              setAbsentFree("");
            }}
            onRemove={(i) => removeParticipant("absent", i)}
            t={t}
          />
        </div>
      </SectionCard>

      <SectionCard
        title={t("dashboard.meetingMinutes.form.pvPoints")}
        icon={ClipboardList}
        headerRight={
          <ActionButton
            type="button"
            onClick={() =>
              setField("points", [...values.points, createEmptyMeetingPoint()])
            }
          >
            <Plus className="h-4 w-4" />
            {t("dashboard.meetingMinutes.form.addPoint")}
          </ActionButton>
        }
      >
        <div className="space-y-5">
          {values.points.map((point, pointIndex) => (
            <div key={`point-${pointIndex}`} className={`${dashboardInnerPanelClass} space-y-4 p-4 sm:p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white">
                  {t("dashboard.meetingMinutes.form.pointLabel", { n: pointIndex + 1 })}
                </h3>
                {values.points.length > 1 ? (
                  <ActionButton
                    type="button"
                    variant="dangerSoft"
                    onClick={() => removePoint(pointIndex)}
                  >
                    <Trash className="h-4 w-4" />
                    {t("dashboard.meetingMinutes.form.removePoint")}
                  </ActionButton>
                ) : null}
              </div>

              <label className="block">
                <span className={dashboardLabelClass}>
                  {t("dashboard.meetingMinutes.form.pointTitle")}
                </span>
                <input
                  className={dashboardInputClass}
                  value={point.title}
                  onChange={(e) => updatePoint(pointIndex, { title: e.target.value })}
                  placeholder={t("dashboard.meetingMinutes.form.pointTitlePlaceholder")}
                />
              </label>

              <label className="block">
                <span className={dashboardLabelClass}>
                  {t("dashboard.meetingMinutes.form.discussion")}
                </span>
                <textarea
                  className={`${dashboardInputClass} min-h-[120px]`}
                  value={point.discussion}
                  onChange={(e) => updatePoint(pointIndex, { discussion: e.target.value })}
                  placeholder={t("dashboard.meetingMinutes.form.discussionPlaceholder")}
                />
              </label>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className={dashboardLabelClass}>
                    {t("dashboard.meetingMinutes.form.decisions")}
                  </span>
                  <ActionButton
                    type="button"
                    onClick={() =>
                      updatePoint(pointIndex, {
                        decisions: [...point.decisions, ""],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    {t("dashboard.meetingMinutes.form.addDecision")}
                  </ActionButton>
                </div>
                {point.decisions.length === 0 ? (
                  <p className={dashboardHintClass}>{t("dashboard.meetingMinutes.form.noDecisions")}</p>
                ) : (
                  <div className="space-y-2">
                    {point.decisions.map((decision, decisionIndex) => (
                      <div key={`decision-${decisionIndex}`} className="flex gap-2">
                        <input
                          className={dashboardInputClass}
                          value={decision}
                          onChange={(e) => {
                            const next = [...point.decisions];
                            next[decisionIndex] = e.target.value;
                            updatePoint(pointIndex, { decisions: next });
                          }}
                          placeholder={t("dashboard.meetingMinutes.form.decisionPlaceholder")}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updatePoint(pointIndex, {
                              decisions: point.decisions.filter((_, j) => j !== decisionIndex),
                            })
                          }
                          className="rounded-lg p-2 text-red-300 hover:bg-red-500/10"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className={dashboardLabelClass}>
                    {t("dashboard.meetingMinutes.form.tasks")}
                  </span>
                  <ActionButton
                    type="button"
                    onClick={() =>
                      updatePoint(pointIndex, {
                        tasks: [
                          ...point.tasks,
                          { description: "", responsible: "", deadline: "", status: "todo" },
                        ],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    {t("dashboard.meetingMinutes.form.addTask")}
                  </ActionButton>
                </div>
                {point.tasks.length === 0 ? (
                  <p className={dashboardHintClass}>{t("dashboard.meetingMinutes.form.noTasks")}</p>
                ) : (
                  <div className="space-y-3">
                    {point.tasks.map((task, taskIndex) => (
                      <div
                        key={`task-${taskIndex}`}
                        className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2"
                      >
                        <label className="block sm:col-span-2">
                          <span className={dashboardLabelClass}>
                            {t("dashboard.meetingMinutes.form.taskDescription")}
                          </span>
                          <input
                            className={dashboardInputClass}
                            value={task.description}
                            onChange={(e) => {
                              const next = [...point.tasks];
                              next[taskIndex] = { ...task, description: e.target.value };
                              updatePoint(pointIndex, { tasks: next });
                            }}
                          />
                        </label>
                        <label className="block">
                          <span className={dashboardLabelClass}>
                            {t("dashboard.meetingMinutes.form.taskResponsible")}
                          </span>
                          <input
                            className={dashboardInputClass}
                            value={task.responsible}
                            onChange={(e) => {
                              const next = [...point.tasks];
                              next[taskIndex] = { ...task, responsible: e.target.value };
                              updatePoint(pointIndex, { tasks: next });
                            }}
                          />
                        </label>
                        <label className="block">
                          <span className={dashboardLabelClass}>
                            {t("dashboard.meetingMinutes.form.taskDeadline")}
                          </span>
                          <input
                            type="date"
                            className={dashboardInputClass}
                            value={task.deadline}
                            onChange={(e) => {
                              const next = [...point.tasks];
                              next[taskIndex] = { ...task, deadline: e.target.value };
                              updatePoint(pointIndex, { tasks: next });
                            }}
                          />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className={dashboardLabelClass}>
                            {t("dashboard.meetingMinutes.form.taskStatus")}
                          </span>
                          <select
                            className={dashboardSelectClass}
                            value={task.status}
                            onChange={(e) => {
                              const next = [...point.tasks];
                              next[taskIndex] = {
                                ...task,
                                status: e.target.value as TaskStatus,
                              };
                              updatePoint(pointIndex, { tasks: next });
                            }}
                          >
                            {TASK_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {t(`dashboard.meetingMinutes.taskStatus.${s}`)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="sm:col-span-2">
                          <ActionButton
                            type="button"
                            variant="dangerSoft"
                            onClick={() =>
                              updatePoint(pointIndex, {
                                tasks: point.tasks.filter((_, j) => j !== taskIndex),
                              })
                            }
                          >
                            <Trash className="h-4 w-4" />
                            {t("dashboard.common.delete")}
                          </ActionButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t("dashboard.meetingMinutes.form.closing")} icon={FileText}>
        <div className="space-y-6">
          <label className="block">
            <span className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.miscellaneous")}</span>
            <textarea
              className={`${dashboardInputClass} min-h-[80px]`}
              value={values.miscellaneous}
              onChange={(e) => setField("miscellaneous", e.target.value)}
            />
          </label>

          <label className="block">
            <span className={dashboardLabelClass}>{t("dashboard.meetingMinutes.form.nextMeeting")}</span>
            <textarea
              className={`${dashboardInputClass} min-h-[80px]`}
              value={values.nextMeeting}
              onChange={(e) => setField("nextMeeting", e.target.value)}
            />
          </label>
        </div>
      </SectionCard>

      <div className="flex flex-wrap gap-3">
        <DashboardPrimaryButton
          type="button"
          disabled={saving}
          icon="none"
          onClick={() => void handleSave("draft")}
        >
          {saving ? savingLabel : t("dashboard.meetingMinutes.form.saveDraft")}
        </DashboardPrimaryButton>
        <DashboardPrimaryButton
          type="button"
          disabled={saving}
          icon="none"
          onClick={() => void handleSave("validated")}
        >
          {saving ? savingLabel : t("dashboard.meetingMinutes.form.validate")}
        </DashboardPrimaryButton>
        <DashboardPrimaryButton type="submit" disabled={saving} icon="none">
          {saving ? savingLabel : submitLabel}
        </DashboardPrimaryButton>
      </div>
    </form>
  );
}
