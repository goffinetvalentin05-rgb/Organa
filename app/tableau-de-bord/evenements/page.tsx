"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Edit, Trash, Calendar } from "@/lib/icons";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import LimitReachedAlert from "@/components/LimitReachedAlert";
import {
  PageLayout,
  PageHeader,
  TableCard,
  EmptyState,
  GlassCard,
  ActionButton,
  dashboardTableHeadRowClass,
} from "@/components/ui";

interface EventType {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: "planned" | "completed";
  eventType?: EventType;
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
}

export default function EvenementsPage() {
  const { t, locale } = useI18n();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [limitReached, setLimitReached] = useState(false);

  const formatDate = (value: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(localeToIntl[locale]);
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat(localeToIntl[locale], {
      style: "currency",
      currency: "CHF",
    }).format(montant);
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || t("dashboard.events.loadError"));
      }
      const data = await response.json();
      setEvents(data?.events || []);
    } catch (error: unknown) {
      console.error("[Events] Error:", error);
      setErrorMessage(error instanceof Error ? error.message : t("dashboard.events.loadError"));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("dashboard.events.deleteConfirm"))) return;
    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(t("dashboard.events.deleteError"));
      }
      await loadEvents();
    } catch (error: unknown) {
      console.error("[Events] Delete error:", error);
      setErrorMessage(error instanceof Error ? error.message : t("dashboard.events.deleteError"));
    }
  };

  const filteredEvents = useMemo(() => {
    let result = [...events];
    if (filterStatus !== "all") {
      result = result.filter((e) => e.status === filterStatus);
    }
    return result.sort((a, b) => b.start_date.localeCompare(a.start_date));
  }, [events, filterStatus]);

  const statusBadgeClass = (status: string) => {
    return status === "completed"
      ? "bg-green-100 text-green-700"
      : "bg-blue-100 text-blue-700";
  };

  const netAmountClass = (result: number) => {
    if (result > 0) return "font-semibold text-emerald-700";
    if (result < 0) return "font-semibold text-rose-700";
    return "font-semibold text-slate-700";
  };

  const dateLabel = (event: Event) => {
    if (event.end_date && event.end_date !== event.start_date) {
      return `${formatDate(event.start_date)} → ${formatDate(event.end_date)}`;
    }
    return formatDate(event.start_date);
  };

  return (
    <PageLayout maxWidth="7xl" className="space-y-6">
      <PageHeader
        title={t("dashboard.events.title")}
        subtitle={t("dashboard.events.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm text-slate-700 shadow-sm backdrop-blur-sm"
            >
              <option value="all">{t("dashboard.plannings.filters.all")}</option>
              <option value="planned">{t("dashboard.events.status.planned")}</option>
              <option value="completed">{t("dashboard.events.status.completed")}</option>
            </select>
            <DashboardPrimaryButton href="/tableau-de-bord/evenements/nouveau">
              {t("dashboard.events.newEvent")}
            </DashboardPrimaryButton>
          </div>
        }
      />

      {limitReached ? <LimitReachedAlert message={t("dashboard.events.limitReached")} /> : null}

      <TableCard bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-slate-500">{t("dashboard.common.loading")}</div>
        ) : errorMessage ? (
          <GlassCard className="m-5 border-red-200/80 bg-red-50/50 text-center">
            <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
            <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
          </GlassCard>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            embedded
            icon={Calendar}
            title={t("dashboard.events.emptyState")}
            action={
              <DashboardPrimaryButton href="/tableau-de-bord/evenements/nouveau" className="inline-flex rounded-full">
                {t("dashboard.events.emptyCta")}
              </DashboardPrimaryButton>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className={dashboardTableHeadRowClass}>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.events.list.columns.name")}</th>
                  <th className="hidden px-4 py-3 md:table-cell sm:px-6">{t("dashboard.events.fields.type")}</th>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.events.list.columns.date")}</th>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.common.status")}</th>
                  <th className="hidden px-4 py-3 text-right lg:table-cell sm:px-6">
                    {t("dashboard.events.detail.totalRevenue")}
                  </th>
                  <th className="hidden px-4 py-3 text-right xl:table-cell sm:px-6">
                    {t("dashboard.events.detail.totalExpenses")}
                  </th>
                  <th className="px-4 py-3 text-right sm:px-6">{t("dashboard.events.detail.netResult")}</th>
                  <th className="px-4 py-3 text-right sm:px-6">{t("dashboard.common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="bg-white transition-colors hover:bg-blue-50/30">
                    <td className="px-4 py-3 align-top sm:px-6">
                      <div className="font-medium text-slate-900">{event.name}</div>
                      {event.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{event.description}</p>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3 align-top text-slate-600 md:table-cell sm:px-6">
                      {event.eventType ? (
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {event.eventType.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-6">{dateLabel(event)}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(event.status)}`}>
                        {t(`dashboard.events.status.${event.status}`)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right font-medium text-emerald-700 lg:table-cell sm:px-6">
                      {formatMontant(event.totalRevenue)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-medium text-rose-700 xl:table-cell sm:px-6">
                      {formatMontant(event.totalExpenses)}
                    </td>
                    <td className={`px-4 py-3 text-right sm:px-6 ${netAmountClass(event.netResult)}`}>
                      {formatMontant(event.netResult)}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <ActionButton href={`/tableau-de-bord/evenements/${event.id}`} className="inline-flex items-center gap-1.5 p-2">
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("dashboard.common.view")}</span>
                        </ActionButton>
                        <ActionButton
                          href={`/tableau-de-bord/evenements/${event.id}`}
                          className="inline-flex items-center gap-1.5 p-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("dashboard.common.edit")}</span>
                        </ActionButton>
                        <ActionButton
                          type="button"
                          variant="dangerSoft"
                          className="inline-flex p-2"
                          title={t("dashboard.common.delete")}
                          onClick={() => void handleDelete(event.id)}
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
