"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  EntityCardList,
  EntityMetaRow,
  DashboardBadge,
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

  const draftToHighlight = useMemo(() => {
    const drafts = minutes.filter((minute) => minute.status === "draft");
    if (drafts.length === 0) return null;
    return [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }, [minutes]);

  const showBanner = !loading && !errorMessage && minutes.length > 0;

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
          <DashboardPrimaryButton href="/tableau-de-bord/pv-seances/nouveau" size="sm">
            {t("dashboard.meetingMinutes.newAction")}
          </DashboardPrimaryButton>
        }
      />

      {showBanner ? (
        <div className="relative flex flex-col overflow-hidden rounded-[1.5rem] border border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFF] via-[#F4F7FF] to-[#EEF2FF] px-6 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
          <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#1A23FF]/[0.06]" />
          <span className="pointer-events-none absolute -bottom-12 right-16 h-36 w-36 rounded-full bg-[#3B82F6]/[0.05]" />
          <div className="relative min-w-0">
            <p className="text-sm font-medium text-[#64748B]">
              {draftToHighlight
                ? t("dashboard.meetingMinutes.banner.draftLabel")
                : t("dashboard.meetingMinutes.banner.allClearLabel")}
            </p>
            <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-[#0F172A] sm:text-3xl">
              {draftToHighlight
                ? draftToHighlight.title
                : t("dashboard.meetingMinutes.banner.allClearTitle")}
            </p>
            {draftToHighlight ? (
              <p className="mt-1.5 text-sm text-[#64748B]">
                {t("dashboard.meetingMinutes.columns.date")} · {formatDate(draftToHighlight.meetingDate)}
              </p>
            ) : null}
          </div>
          {draftToHighlight ? (
            <span className="relative mt-4 sm:mt-0">
              <DashboardBadge variant="info">{statusLabel(draftToHighlight.status)}</DashboardBadge>
            </span>
          ) : null}
        </div>
      ) : null}

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
        <EntityCardList>
          {minutes.map((m) => (
            <EntityCard
              key={m.id}
              layout="row"
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
                    inline
                    label={t("dashboard.meetingMinutes.columns.date")}
                    value={formatDate(m.meetingDate)}
                  />
                  <EntityMetaRow
                    inline
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
        </EntityCardList>
      )}
    </PageLayout>
  );
}
