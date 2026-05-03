"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Trash, Calendar } from "@/lib/icons";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import LimitReachedAlert from "@/components/LimitReachedAlert";
import { PageLayout, PageHeader, GlassCard, EmptyState, ActionButton } from "@/components/ui";

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
    } catch (error: any) {
      console.error("[Events] Error:", error);
      setErrorMessage(error.message || t("dashboard.events.loadError"));
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
    } catch (error: any) {
      console.error("[Events] Delete error:", error);
      setErrorMessage(error.message);
    }
  };

  const filteredEvents = useMemo(() => {
    let result = [...events];
    if (filterStatus !== "all") {
      result = result.filter((e) => e.status === filterStatus);
    }
    return result.sort((a, b) => b.start_date.localeCompare(a.start_date));
  }, [events, filterStatus]);

  const getStatusColor = (status: string) => {
    return status === "completed"
      ? "bg-green-100 text-green-700"
      : "bg-blue-100 text-blue-700";
  };

  const getResultColor = (result: number) => {
    if (result > 0) return "text-emerald-300";
    if (result < 0) return "text-rose-300";
    return "text-white/80";
  };

  return (
    <PageLayout maxWidth="7xl" className="space-y-8">
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

      <GlassCard padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-white/80">{t("dashboard.common.loading")}</p>
          </div>
        ) : errorMessage ? (
          <GlassCard padding="lg" className="m-5 border-red-200/80 bg-red-50/40 text-center">
            <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
            <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
          </GlassCard>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Calendar}
              title={t("dashboard.events.emptyState")}
              action={
                <DashboardPrimaryButton href="/tableau-de-bord/evenements/nouveau" className="inline-flex rounded-full">
                  {t("dashboard.events.emptyCta")}
                </DashboardPrimaryButton>
              }
            />
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {filteredEvents.map((event) => (
              <GlassCard
                key={event.id}
                padding="md"
                className="transition-all duration-200 hover:border-blue-200/80 hover:shadow-md"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white drop-shadow-sm">{event.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                          {t(`dashboard.events.status.${event.status}`)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/75">
                        {event.eventType && (
                          <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                            {event.eventType.name}
                          </span>
                        )}
                        <span>
                          {event.end_date && event.end_date !== event.start_date
                            ? `${formatDate(event.start_date)} → ${formatDate(event.end_date)}`
                            : formatDate(event.start_date)}
                        </span>
                      </div>
                      {event.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-white/70">{event.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="mb-1 text-xs uppercase text-white/55">{t("dashboard.events.detail.totalRevenue")}</p>
                          <p className="font-semibold text-emerald-300">{formatMontant(event.totalRevenue)}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs uppercase text-white/55">{t("dashboard.events.detail.totalExpenses")}</p>
                          <p className="font-semibold text-rose-300">{formatMontant(event.totalExpenses)}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs uppercase text-white/55">{t("dashboard.events.detail.netResult")}</p>
                          <p className={`font-bold text-lg ${getResultColor(event.netResult)}`}>
                            {formatMontant(event.netResult)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/15 pt-3">
                    <ActionButton href={`/tableau-de-bord/evenements/${event.id}`} variant="ghostLight" className="inline-flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {t("dashboard.common.view")}
                    </ActionButton>
                    <ActionButton
                      type="button"
                      variant="dangerSoft"
                      onClick={() => handleDelete(event.id)}
                      title={t("dashboard.common.delete")}
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <Trash className="h-4 w-4" />
                    </ActionButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </GlassCard>
    </PageLayout>
  );
}
