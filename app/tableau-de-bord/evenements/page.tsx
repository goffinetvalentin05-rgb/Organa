"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Edit, Trash, Calendar } from "@/lib/icons";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import LimitReachedAlert from "@/components/LimitReachedAlert";
import {
  PageLayout,
  PageHeader,
  EmptyState,
  GlassCard,
  ActionButton,
  DashboardBadge,
  cn,
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

  const ROW_GRID =
    "grid grid-cols-1 items-center gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(10rem,12rem)_minmax(12.5rem,1fr)_7rem_minmax(13rem,auto)] lg:gap-4";

  return (
    <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.events.title")}
        subtitle={t("dashboard.events.subtitle")}
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="dashboard-select h-[38px] w-full rounded-full border border-[#E5E7EB] bg-white px-3.5 text-sm font-medium text-[#334155] shadow-sm transition hover:border-[rgba(26,35,255,0.22)] focus:border-[#1A23FF] focus:outline-none focus:ring-2 focus:ring-[rgba(26,35,255,0.2)] sm:w-[13.5rem] [color-scheme:light]"
            >
              <option value="all">{t("dashboard.plannings.filters.all")}</option>
              <option value="planned">{t("dashboard.events.status.planned")}</option>
              <option value="completed">{t("dashboard.events.status.completed")}</option>
            </select>
            <DashboardPrimaryButton href="/tableau-de-bord/evenements/nouveau" size="sm">
              {t("dashboard.events.newEvent")}
            </DashboardPrimaryButton>
          </div>
        }
      />

      {limitReached ? <LimitReachedAlert message={t("dashboard.events.limitReached")} /> : null}

      {loading ? (
        <div className="rounded-[1.25rem] border border-[#E5E7EB] bg-white p-12 text-center text-sm text-[#64748B] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {t("dashboard.common.loading")}
        </div>
      ) : errorMessage ? (
        <GlassCard className="border-red-200/80 bg-red-50/50 text-center">
          <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
          <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
        </GlassCard>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t("dashboard.events.emptyState")}
          action={
            <DashboardPrimaryButton href="/tableau-de-bord/evenements/nouveau" className="inline-flex rounded-full">
              {t("dashboard.events.emptyCta")}
            </DashboardPrimaryButton>
          }
        />
      ) : (
        <div className="min-w-0 space-y-2">
          {filteredEvents.map((event) => (
            <article
              key={event.id}
              className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(26,35,255,0.16)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)] sm:px-5"
            >
              <div className={ROW_GRID}>
                <div className="min-w-0">
                  <Link
                    href={`/tableau-de-bord/evenements/${event.id}`}
                    className="block truncate text-sm font-semibold tracking-tight text-[#0F172A] transition-colors hover:text-[#1A23FF]"
                  >
                    {event.name}
                  </Link>
                  {event.eventType ? (
                    <span className="mt-1.5 inline-flex rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#475569]">
                      {event.eventType.name}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#94A3B8]">
                    {t("dashboard.events.list.columns.date")}
                  </p>
                  <p className="mt-0.5 truncate text-sm tabular-nums text-[#334155]">
                    {dateLabel(event)}
                  </p>
                </div>

                <div className="grid min-w-0 grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-1">
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#94A3B8]">{t("dashboard.events.detail.chart.revenue")}</p>
                    <p className="truncate text-sm font-medium tabular-nums text-emerald-700">
                      {formatMontant(event.totalRevenue)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#94A3B8]">{t("dashboard.events.detail.chart.expenses")}</p>
                    <p className="truncate text-sm font-medium tabular-nums text-rose-700">
                      {formatMontant(event.totalExpenses)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#64748B]">
                      {t("dashboard.events.detail.netResult")}
                    </p>
                    <p className={cn("truncate text-[15px] tabular-nums", netAmountClass(event.netResult))}>
                      {formatMontant(event.netResult)}
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  <DashboardBadge variant={event.status === "completed" ? "success" : "info"}>
                    {t(`dashboard.events.status.${event.status}`)}
                  </DashboardBadge>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
                  <ActionButton
                    href={`/tableau-de-bord/evenements/${event.id}`}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t("dashboard.common.view")}
                  </ActionButton>
                  <ActionButton
                    href={`/tableau-de-bord/evenements/${event.id}`}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    {t("dashboard.common.edit")}
                  </ActionButton>
                  <ActionButton
                    type="button"
                    variant="dangerSoft"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-0"
                    title={t("dashboard.common.delete")}
                    onClick={() => void handleDelete(event.id)}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </ActionButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
