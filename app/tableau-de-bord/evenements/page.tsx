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
  EmptyState,
  GlassCard,
  ActionButton,
  EntityCard,
  EntityCardGrid,
  EntityMetaRow,
  dashboardSelectLgClass,
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
    <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.events.title")}
        subtitle={t("dashboard.events.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={dashboardSelectLgClass}
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

      {loading ? (
        <div className="rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white p-12 text-center shadow-sm text-slate-500">
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
        <EntityCardGrid columns={2}>
          {filteredEvents.map((event) => (
            <EntityCard
              key={event.id}
              href={`/tableau-de-bord/evenements/${event.id}`}
              title={event.name}
              subtitle={event.description || undefined}
              amount={
                <span className={netAmountClass(event.netResult)}>
                  {formatMontant(event.netResult)}
                </span>
              }
              status={
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(event.status)}`}
                >
                  {t(`dashboard.events.status.${event.status}`)}
                </span>
              }
              badges={
                event.eventType ? (
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {event.eventType.name}
                  </span>
                ) : undefined
              }
              meta={
                <>
                  <EntityMetaRow
                    label={t("dashboard.events.list.columns.date")}
                    value={dateLabel(event)}
                  />
                  <EntityMetaRow
                    label={t("dashboard.events.detail.totalRevenue")}
                    value={
                      <span className="font-medium text-emerald-700">
                        {formatMontant(event.totalRevenue)}
                      </span>
                    }
                  />
                  <EntityMetaRow
                    label={t("dashboard.events.detail.totalExpenses")}
                    value={
                      <span className="font-medium text-rose-700">
                        {formatMontant(event.totalExpenses)}
                      </span>
                    }
                  />
                </>
              }
              actions={
                <>
                  <ActionButton
                    href={`/tableau-de-bord/evenements/${event.id}`}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    {t("dashboard.common.view")}
                  </ActionButton>
                  <ActionButton
                    href={`/tableau-de-bord/evenements/${event.id}`}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Edit className="h-4 w-4" />
                    {t("dashboard.common.edit")}
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
                </>
              }
            />
          ))}
        </EntityCardGrid>
      )}
    </PageLayout>
  );
}
