"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Edit, Trash, Download, ClipboardList } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  EmptyState,
  GlassCard,
  ActionButton,
  EntityCard,
  EntityCardGrid,
  EntityMetaRow,
} from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import type { MeetingStatus, MeetingType } from "@/lib/meeting-minutes";

type MinuteRow = {
  id: string;
  title: string;
  meetingDate: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  updatedAt: string;
};

export default function PvSeancesPage() {
  const { t, locale } = useI18n();
  const [minutes, setMinutes] = useState<MinuteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/meeting-minutes", { cache: "no-store" });
      if (!res.ok) throw new Error(t("dashboard.meetingMinutes.loadError"));
      const data = await res.json();
      setMinutes(data.minutes || []);
    } catch (e: unknown) {
      setErrorMessage(
        e instanceof Error ? e.message : t("dashboard.meetingMinutes.loadError")
      );
      setMinutes([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

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

  const handleDelete = async (id: string) => {
    if (!confirm(t("dashboard.meetingMinutes.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/meeting-minutes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      alert(t("dashboard.meetingMinutes.deleteError"));
    }
  };

  const downloadPdf = (id: string) => {
    window.open(`/api/pdf/pv-seance/download?id=${id}&locale=${locale}`, "_blank");
  };

  return (
    <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.meetingMinutes.title")}
        subtitle={t("dashboard.meetingMinutes.subtitle")}
        actions={
          <DashboardPrimaryButton href="/tableau-de-bord/pv-seances/nouveau" icon="none">
            {t("dashboard.meetingMinutes.newAction")}
          </DashboardPrimaryButton>
        }
      />

      {loading ? (
        <div className="rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white p-12 text-center text-slate-500 shadow-sm">
          {t("dashboard.common.loading")}
        </div>
      ) : errorMessage ? (
        <GlassCard className="border-red-200/80 bg-red-50/50 text-center">
          <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
          <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
        </GlassCard>
      ) : minutes.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t("dashboard.meetingMinutes.emptyState")}
          description={t("dashboard.meetingMinutes.emptyDescription")}
          action={
            <DashboardPrimaryButton
              href="/tableau-de-bord/pv-seances/nouveau"
              className="inline-flex"
              icon="none"
            >
              {t("dashboard.meetingMinutes.emptyCta")}
            </DashboardPrimaryButton>
          }
        />
      ) : (
        <EntityCardGrid>
          {minutes.map((m) => (
            <EntityCard
              key={m.id}
              href={`/tableau-de-bord/pv-seances/${m.id}`}
              title={m.title}
              status={
                <span className={`badge-obillz ${statusClass(m.status)}`}>
                  {statusLabel(m.status)}
                </span>
              }
              badges={
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  {typeLabel(m.meetingType)}
                </span>
              }
              meta={
                <>
                  <EntityMetaRow
                    label={t("dashboard.meetingMinutes.columns.date")}
                    value={formatDate(m.meetingDate)}
                  />
                  <EntityMetaRow
                    label={t("dashboard.meetingMinutes.columns.updated")}
                    value={formatDateTime(m.updatedAt)}
                  />
                </>
              }
              actions={
                <>
                  <ActionButton
                    href={`/tableau-de-bord/pv-seances/${m.id}`}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    {t("dashboard.common.view")}
                  </ActionButton>
                  <ActionButton
                    href={`/tableau-de-bord/pv-seances/${m.id}/modifier`}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Edit className="h-4 w-4" />
                    {t("dashboard.common.edit")}
                  </ActionButton>
                  <ActionButton
                    type="button"
                    className="inline-flex items-center gap-1.5"
                    title={t("dashboard.meetingMinutes.downloadPdf")}
                    onClick={() => downloadPdf(m.id)}
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </ActionButton>
                  <ActionButton
                    type="button"
                    variant="dangerSoft"
                    className="inline-flex p-2"
                    title={t("dashboard.common.delete")}
                    onClick={() => void handleDelete(m.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </ActionButton>
                </>
              }
            />
          ))}
        </EntityCardGrid>
      )}
    </PageLayout>
  );
}
