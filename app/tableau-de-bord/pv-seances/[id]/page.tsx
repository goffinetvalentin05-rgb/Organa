"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Edit, Download, ClipboardList } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import { PageLayout, PageHeader, GlassCard, SectionCard } from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import type {
  MeetingMinutesPayload,
  MeetingStatus,
  MeetingType,
} from "@/lib/meeting-minutes";

type Minute = MeetingMinutesPayload & {
  id: string;
  updatedAt: string;
};

export default function PvSeanceDetailPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";

  const [minute, setMinute] = useState<Minute | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/meeting-minutes/${id}`, { cache: "no-store" });
      if (!res.ok) {
        router.replace("/tableau-de-bord/pv-seances");
        return;
      }
      const data = await res.json();
      setMinute(data.minute);
    } catch {
      router.replace("/tableau-de-bord/pv-seances");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const formatDate = (value: string) => {
    if (!value) return "—";
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(localeToIntl[locale]);
  };

  const formatDateTime = (value: string) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(localeToIntl[locale], {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const typeLabel = (type: MeetingType) => t(`dashboard.meetingMinutes.types.${type}`);
  const statusLabel = (status: MeetingStatus) =>
    t(`dashboard.meetingMinutes.status.${status}`);

  const statusClass = (status: MeetingStatus) => {
    if (status === "validated") return "badge-success";
    if (status === "draft") return "badge-info";
    if (status === "archived") return "bg-slate-500/20 text-slate-300";
    return "bg-slate-100 text-slate-600";
  };

  const handleDelete = async () => {
    if (!minute || !confirm(t("dashboard.meetingMinutes.deleteConfirm"))) return;
    const res = await fetch(`/api/meeting-minutes/${minute.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(t("dashboard.meetingMinutes.deleteError"));
      return;
    }
    router.push("/tableau-de-bord/pv-seances");
  };

  const downloadPdfUrl = `/api/pdf/pv-seance/download?id=${id}&locale=${locale}`;

  if (loading || !minute) {
    return (
      <PageLayout maxWidth="3xl">
        <GlassCard className="p-10 text-center text-slate-500">{t("dashboard.common.loading")}</GlassCard>
      </PageLayout>
    );
  }

  const timeRange =
    minute.startTime && minute.endTime
      ? `${minute.startTime} – ${minute.endTime}`
      : minute.startTime || minute.endTime || "—";

  const renderParticipants = (list: { name: string }[]) =>
    list.length ? list.map((p) => p.name).join(", ") : "—";

  return (
    <PageLayout maxWidth="3xl">
      <div>
        <Link
          href="/tableau-de-bord/pv-seances"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("dashboard.meetingMinutes.backToList")}
        </Link>
        <PageHeader
          title={minute.title}
          subtitle={t("dashboard.meetingMinutes.detail.subtitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <DashboardPrimaryButton
                href={`/tableau-de-bord/pv-seances/${minute.id}/modifier`}
                icon="none"
                className="inline-flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                {t("dashboard.common.edit")}
              </DashboardPrimaryButton>
              <DashboardPrimaryButton
                href={downloadPdfUrl}
                icon="none"
                className="inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t("dashboard.meetingMinutes.downloadPdf")}
              </DashboardPrimaryButton>
            </div>
          }
        />
      </div>

      <SectionCard title={t("dashboard.meetingMinutes.form.general")} icon={ClipboardList}>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.meetingDate")}
            </dt>
            <dd className="mt-1 text-white/90">{formatDate(minute.meetingDate)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.startTime")}
            </dt>
            <dd className="mt-1 text-white/90">{timeRange}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.meetingType")}
            </dt>
            <dd className="mt-1 text-white/90">{typeLabel(minute.meetingType)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.common.status")}
            </dt>
            <dd className="mt-1">
              <span className={`badge-obillz ${statusClass(minute.status)}`}>
                {statusLabel(minute.status)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.location")}
            </dt>
            <dd className="mt-1 text-white/90">{minute.location || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.columns.updated")}
            </dt>
            <dd className="mt-1 text-white/90">{formatDateTime(minute.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.chairman")}
            </dt>
            <dd className="mt-1 text-white/90">{minute.chairman || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.secretary")}
            </dt>
            <dd className="mt-1 text-white/90">{minute.secretary || "—"}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title={t("dashboard.meetingMinutes.form.participants")} icon={ClipboardList}>
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.attendees")}
            </dt>
            <dd className="mt-1 text-white/90">{renderParticipants(minute.attendees)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.excused")}
            </dt>
            <dd className="mt-1 text-white/90">{renderParticipants(minute.excused)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.absent")}
            </dt>
            <dd className="mt-1 text-white/90">{renderParticipants(minute.absent)}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title={t("dashboard.meetingMinutes.form.content")} icon={ClipboardList}>
        <div className="space-y-6 text-sm text-white/90">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.agenda")}
            </h3>
            {minute.agendaItems.length ? (
              <ol className="list-decimal space-y-1 pl-5">
                {minute.agendaItems.map((item, i) => (
                  <li key={i}>{item.text}</li>
                ))}
              </ol>
            ) : (
              <p className="text-white/50">—</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.discussion")}
            </h3>
            <p className="whitespace-pre-wrap">{minute.discussionPoints.trim() || "—"}</p>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.decisions")}
            </h3>
            {minute.decisions.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {minute.decisions.map((item, i) => (
                  <li key={i}>{item.text}</li>
                ))}
              </ul>
            ) : (
              <p className="text-white/50">—</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.tasks")}
            </h3>
            {minute.tasks.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                      <th className="py-2 pr-3">{t("dashboard.meetingMinutes.form.taskDescription")}</th>
                      <th className="py-2 pr-3">{t("dashboard.meetingMinutes.form.taskResponsible")}</th>
                      <th className="py-2 pr-3">{t("dashboard.meetingMinutes.form.taskDeadline")}</th>
                      <th className="py-2">{t("dashboard.meetingMinutes.form.taskStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {minute.tasks.map((task, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-2 pr-3">{task.description}</td>
                        <td className="py-2 pr-3">{task.responsible || "—"}</td>
                        <td className="py-2 pr-3">
                          {task.deadline ? formatDate(task.deadline) : "—"}
                        </td>
                        <td className="py-2">{t(`dashboard.meetingMinutes.taskStatus.${task.status}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white/50">—</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.miscellaneous")}
            </h3>
            <p className="whitespace-pre-wrap">{minute.miscellaneous.trim() || "—"}</p>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("dashboard.meetingMinutes.form.nextMeeting")}
            </h3>
            <p className="whitespace-pre-wrap">{minute.nextMeeting.trim() || "—"}</p>
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleDelete()}
          className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          {t("dashboard.common.delete")}
        </button>
      </div>
    </PageLayout>
  );
}
