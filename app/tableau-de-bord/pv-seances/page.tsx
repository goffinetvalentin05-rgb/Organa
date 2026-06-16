"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Edit, Trash, Download, ClipboardList } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  TableCard,
  EmptyState,
  GlassCard,
  ActionButton,
  dashboardTableHeadRowClass,
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

      <TableCard bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-slate-500">{t("dashboard.common.loading")}</div>
        ) : errorMessage ? (
          <GlassCard className="m-5 border-red-200/80 bg-red-50/50 text-center">
            <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
            <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
          </GlassCard>
        ) : minutes.length === 0 ? (
          <EmptyState
            embedded
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className={dashboardTableHeadRowClass}>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.meetingMinutes.columns.title")}</th>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.meetingMinutes.columns.date")}</th>
                  <th className="hidden px-4 py-3 md:table-cell sm:px-6">
                    {t("dashboard.meetingMinutes.columns.type")}
                  </th>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.common.status")}</th>
                  <th className="hidden px-4 py-3 lg:table-cell sm:px-6">
                    {t("dashboard.meetingMinutes.columns.updated")}
                  </th>
                  <th className="px-4 py-3 text-right sm:px-6">{t("dashboard.common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {minutes.map((m) => (
                  <tr key={m.id} className="bg-white/80 transition-colors hover:bg-blue-50/30">
                    <td className="px-4 py-3 font-medium text-slate-900 sm:px-6">{m.title}</td>
                    <td className="px-4 py-3 text-slate-700 sm:px-6">{formatDate(m.meetingDate)}</td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell sm:px-6">
                      {typeLabel(m.meetingType)}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <span className={`badge-obillz ${statusClass(m.status)}`}>
                        {statusLabel(m.status)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 lg:table-cell sm:px-6">
                      {formatDateTime(m.updatedAt)}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <ActionButton
                          href={`/tableau-de-bord/pv-seances/${m.id}`}
                          className="inline-flex items-center gap-1.5 p-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("dashboard.common.view")}</span>
                        </ActionButton>
                        <ActionButton
                          href={`/tableau-de-bord/pv-seances/${m.id}/modifier`}
                          className="inline-flex items-center gap-1.5 p-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("dashboard.common.edit")}</span>
                        </ActionButton>
                        <ActionButton
                          type="button"
                          className="inline-flex items-center gap-1.5 p-2"
                          title={t("dashboard.meetingMinutes.downloadPdf")}
                          onClick={() => downloadPdf(m.id)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">PDF</span>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </PageLayout>
  );
}
