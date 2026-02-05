"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import { Edit, Trash, Eye } from "@/lib/icons";
import EventFinancialChart from "./EventFinancialChart";

interface EventType {
  id: string;
  name: string;
}

interface LinkedDocument {
  id: string;
  numero: string;
  type: string;
  status: string;
  total_ttc: number;
  date_creation: string;
  client?: {
    id: string;
    nom: string;
  };
}

interface LinkedExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
}

interface EventDetail {
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
  documents: LinkedDocument[];
  expenses: LinkedExpense[];
}

export default function EventDetailPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    eventTypeId: "",
    startDate: "",
    endDate: "",
    description: "",
    status: "planned" as "planned" | "completed",
  });

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
    if (eventId) {
      void loadEvent();
      void loadEventTypes();
    }
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/events/${eventId}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(t("dashboard.events.loadError"));
      }
      const data = await response.json();
      setEvent(data.event);
      setFormData({
        name: data.event.name,
        eventTypeId: data.event.event_type_id || "",
        startDate: data.event.start_date,
        endDate: data.event.end_date || "",
        description: data.event.description || "",
        status: data.event.status,
      });
    } catch (error: any) {
      console.error("[Event] Load error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEventTypes = async () => {
    try {
      const response = await fetch("/api/event-types");
      if (response.ok) {
        const data = await response.json();
        setEventTypes(data?.eventTypes || []);
      }
    } catch (error) {
      console.error("Error loading event types:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("dashboard.events.deleteConfirm"))) return;
    try {
      const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(t("dashboard.events.deleteError"));
      }
      router.push("/tableau-de-bord/evenements");
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          status: formData.status,
          eventTypeId: formData.eventTypeId || null,
        }),
      });

      if (!response.ok) {
        throw new Error(t("dashboard.events.updateError"));
      }

      await loadEvent();
      setIsEditing(false);
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
        <p className="text-secondary">{t("dashboard.common.loading")}</p>
      </div>
    );
  }

  if (errorMessage || !event) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
        <p className="text-red-600 mb-4">{errorMessage || "Événement non trouvé"}</p>
        <Link
          href="/tableau-de-bord/evenements"
          className="text-secondary hover:text-primary transition-colors"
        >
          ← {t("dashboard.events.detail.backToList")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/tableau-de-bord/evenements"
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            ← {t("dashboard.events.detail.backToList")}
          </Link>
          {!isEditing ? (
            <>
              <div className="flex items-center gap-3 mt-4">
                <h1 className="text-3xl font-bold">{event.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(event.status)}`}>
                  {t(`dashboard.events.status.${event.status}`)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-secondary">
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
                <p className="mt-4 text-secondary">{event.description}</p>
              )}
            </>
          ) : (
            <h1 className="text-3xl font-bold mt-4">{t("dashboard.events.form.editTitle")}</h1>
          )}
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {t("dashboard.events.detail.editAction")}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all flex items-center gap-2"
            >
              <Trash className="w-4 h-4" />
              {t("dashboard.events.detail.deleteAction")}
            </button>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleUpdate} className="rounded-2xl border border-subtle bg-surface/80 p-6 space-y-6 shadow-premium">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.events.fields.name")}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.events.fields.type")}
            </label>
            <select
              value={formData.eventTypeId}
              onChange={(e) => setFormData({ ...formData, eventTypeId: e.target.value })}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            >
              <option value="">{t("dashboard.events.fields.typePlaceholder")}</option>
              {eventTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.events.fields.startDate")}
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.events.fields.endDate")}
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.events.fields.description")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.events.fields.status")}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "planned" | "completed" })}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            >
              <option value="planned">{t("dashboard.events.status.planned")}</option>
              <option value="completed">{t("dashboard.events.status.completed")}</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 px-6 py-3 rounded-lg bg-surface-hover hover:bg-surface text-primary text-center transition-all"
            >
              {t("dashboard.events.form.cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-lg accent-bg text-white font-medium transition-all"
            >
              {t("dashboard.events.form.saveAction")}
            </button>
          </div>
        </form>
      )}

      {/* Financial Summary */}
      {!isEditing && (
        <>
          <div className="rounded-2xl border border-subtle bg-surface/80 p-6 shadow-premium">
            <h2 className="text-xl font-semibold mb-6">{t("dashboard.events.detail.financialSummary")}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="rounded-xl bg-green-50 p-5">
                <p className="text-sm text-green-600 font-medium mb-1">{t("dashboard.events.detail.totalRevenue")}</p>
                <p className="text-3xl font-bold text-green-700">{formatMontant(event.totalRevenue)}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-5">
                <p className="text-sm text-red-600 font-medium mb-1">{t("dashboard.events.detail.totalExpenses")}</p>
                <p className="text-3xl font-bold text-red-700">{formatMontant(event.totalExpenses)}</p>
              </div>
              <div className={`rounded-xl p-5 ${event.netResult >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
                <p className={`text-sm font-medium mb-1 ${event.netResult >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                  {t("dashboard.events.detail.netResult")}
                </p>
                <p className={`text-3xl font-bold ${getResultColor(event.netResult)}`}>
                  {formatMontant(event.netResult)}
                </p>
                <p className={`text-sm mt-1 ${event.netResult >= 0 ? "text-blue-500" : "text-orange-500"}`}>
                  {event.netResult >= 0 ? t("dashboard.events.detail.profit") : t("dashboard.events.detail.loss")}
                </p>
              </div>
            </div>

            {/* Chart */}
            {(event.totalRevenue > 0 || event.totalExpenses > 0) && (
              <EventFinancialChart
                revenue={event.totalRevenue}
                expenses={event.totalExpenses}
              />
            )}
          </div>

          {/* Linked Documents */}
          <div className="rounded-2xl border border-subtle bg-surface/80 p-6 shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t("dashboard.events.detail.linkedDocuments")}</h2>
              <Link
                href="/tableau-de-bord/factures/nouvelle"
                className="text-sm text-secondary hover:text-primary transition-colors"
              >
                + {t("dashboard.events.detail.linkDocument")}
              </Link>
            </div>
            {event.documents.length === 0 ? (
              <p className="text-secondary text-center py-8">{t("dashboard.events.detail.noDocuments")}</p>
            ) : (
              <div className="space-y-3">
                {event.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-surface border border-subtle">
                    <div>
                      <p className="font-medium">{doc.numero}</p>
                      <p className="text-sm text-secondary">{doc.client?.nom || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatMontant(Number(doc.total_ttc))}</p>
                      <p className="text-sm text-secondary">{formatDate(doc.date_creation)}</p>
                    </div>
                    <Link
                      href={`/tableau-de-bord/factures/${doc.id}`}
                      className="ml-4 p-2 rounded-lg bg-surface-hover hover:bg-surface transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Expenses */}
          <div className="rounded-2xl border border-subtle bg-surface/80 p-6 shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t("dashboard.events.detail.linkedExpenses")}</h2>
              <Link
                href="/tableau-de-bord/depenses"
                className="text-sm text-secondary hover:text-primary transition-colors"
              >
                + {t("dashboard.events.detail.linkExpense")}
              </Link>
            </div>
            {event.expenses.length === 0 ? (
              <p className="text-secondary text-center py-8">{t("dashboard.events.detail.noExpenses")}</p>
            ) : (
              <div className="space-y-3">
                {event.expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg bg-surface border border-subtle">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-secondary">{formatDate(expense.date)}</p>
                    </div>
                    <p className="font-semibold text-red-600">{formatMontant(Number(expense.amount))}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
