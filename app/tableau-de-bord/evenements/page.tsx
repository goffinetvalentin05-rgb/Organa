"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Trash, Calendar } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import LimitReachedAlert from "@/components/LimitReachedAlert";

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
    if (result > 0) return "text-green-600";
    if (result < 0) return "text-red-600";
    return "text-slate-600";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.events.title")}</h1>
          <p className="mt-2 text-secondary">{t("dashboard.events.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-subtle bg-white text-secondary"
          >
            <option value="all">Tous les statuts</option>
            <option value="planned">{t("dashboard.events.status.planned")}</option>
            <option value="completed">{t("dashboard.events.status.completed")}</option>
          </select>
          <Link
            href="/tableau-de-bord/evenements/nouveau"
            className="px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t("dashboard.events.newEvent")}
          </Link>
        </div>
      </div>

      {limitReached && (
        <LimitReachedAlert message={t("dashboard.events.limitReached")} />
      )}

      <div className="rounded-2xl border border-subtle bg-surface/80 overflow-hidden shadow-premium">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-secondary">{t("dashboard.common.loading")}</p>
          </div>
        ) : errorMessage ? (
          <div className="p-12 text-center">
            <p className="text-red-600 mb-2">{t("dashboard.common.loadFailed")}</p>
            <p className="text-secondary text-sm">{errorMessage}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-secondary mb-4">{t("dashboard.events.emptyState")}</p>
            <Link
              href="/tableau-de-bord/evenements/nouveau"
              className="inline-block px-6 py-3 accent-bg text-white font-medium rounded-full transition-all"
            >
              {t("dashboard.events.emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-subtle bg-surface/60 p-5 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-primary">{event.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                          {t(`dashboard.events.status.${event.status}`)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                        {event.eventType && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
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
                        <p className="mt-2 text-sm text-secondary line-clamp-2">{event.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs uppercase text-tertiary mb-1">{t("dashboard.events.detail.totalRevenue")}</p>
                          <p className="font-semibold text-green-600">{formatMontant(event.totalRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-tertiary mb-1">{t("dashboard.events.detail.totalExpenses")}</p>
                          <p className="font-semibold text-red-600">{formatMontant(event.totalExpenses)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-tertiary mb-1">{t("dashboard.events.detail.netResult")}</p>
                          <p className={`font-bold text-lg ${getResultColor(event.netResult)}`}>
                            {formatMontant(event.netResult)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-subtle">
                    <Link
                      href={`/tableau-de-bord/evenements/${event.id}`}
                      className="px-4 py-2 rounded-full bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all text-sm flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {t("dashboard.common.view")}
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-all text-sm flex items-center justify-center"
                      title={t("dashboard.common.delete")}
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
