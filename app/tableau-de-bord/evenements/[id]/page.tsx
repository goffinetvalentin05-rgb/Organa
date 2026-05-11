"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import { Edit, Trash, Eye, Calendar, ArrowRight, X } from "@/lib/icons";
import {
  PageLayout,
  PageHeader,
  GlassCard,
  SectionCard,
  ActionButton,
  EmptyState,
  cn,
  glassNestedRowClass,
} from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
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

interface LinkedClubRevenue {
  id: string;
  name: string;
  amount: number;
  revenue_date: string;
  description?: string | null;
}

interface EventDetail {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: "planned" | "completed";
  event_type_id?: string | null;
  eventType?: EventType;
  totalRevenue: number;
  revenueFromInvoices: number;
  revenueFromProducts: number;
  totalExpenses: number;
  netResult: number;
  documents: LinkedDocument[];
  clubRevenues: LinkedClubRevenue[];
  expenses: LinkedExpense[];
}

const inputClass =
  "w-full rounded-xl border border-slate-200/90 bg-white/95 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60";

const labelClass = "block text-sm font-medium text-slate-700 mb-2";

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
  const [showAddRevenueModal, setShowAddRevenueModal] = useState(false);
  const [revenueForm, setRevenueForm] = useState({
    name: "",
    amount: "",
    revenueDate: "",
    description: "",
  });
  const [savingRevenue, setSavingRevenue] = useState(false);
  const [revenueModalError, setRevenueModalError] = useState<string | null>(null);

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
      const ev = data.event;
      setEvent({
        ...ev,
        revenueFromInvoices: ev.revenueFromInvoices ?? 0,
        revenueFromProducts: ev.revenueFromProducts ?? 0,
        clubRevenues: ev.clubRevenues ?? [],
      });
      setFormData({
        name: ev.name,
        eventTypeId: ev.event_type_id || "",
        startDate: ev.start_date,
        endDate: ev.end_date || "",
        description: ev.description || "",
        status: ev.status,
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

  const statusBadgeClass = (status: string) =>
    status === "completed"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-blue-100 text-blue-700 border-blue-200";

  const resultColor = (result: number) => {
    if (result > 0) return "text-emerald-700";
    if (result < 0) return "text-rose-700";
    return "text-slate-700";
  };

  const openAddRevenueModal = () => {
    setRevenueModalError(null);
    setRevenueForm({
      name: "",
      amount: "",
      revenueDate: new Date().toISOString().slice(0, 10),
      description: "",
    });
    setShowAddRevenueModal(true);
  };

  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRevenue(true);
    setRevenueModalError(null);
    try {
      const amount = Number(revenueForm.amount.replace(",", "."));
      if (!revenueForm.name.trim()) {
        setRevenueModalError(t("dashboard.productRevenues.saveError"));
        return;
      }
      if (Number.isNaN(amount) || amount < 0) {
        setRevenueModalError(t("dashboard.productRevenues.saveError"));
        return;
      }
      const response = await fetch("/api/club-revenues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: revenueForm.name.trim(),
          amount,
          revenueDate: revenueForm.revenueDate,
          description: revenueForm.description.trim() || null,
          eventId: eventId ?? null,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const msg = [data?.error, data?.details].filter(Boolean).join(" — ");
        throw new Error(msg || t("dashboard.productRevenues.saveError"));
      }
      setShowAddRevenueModal(false);
      await loadEvent();
    } catch (err: any) {
      setRevenueModalError(err.message);
    } finally {
      setSavingRevenue(false);
    }
  };

  if (loading) {
    return (
      <PageLayout maxWidth="5xl">
        <GlassCard padding="lg" className="text-center">
          <p className="text-slate-600">{t("dashboard.common.loading")}</p>
        </GlassCard>
      </PageLayout>
    );
  }

  if (errorMessage || !event) {
    return (
      <PageLayout maxWidth="5xl">
        <GlassCard padding="lg" className="text-center border-red-200/80 bg-red-50/70">
          <p className="text-red-700 font-medium">{errorMessage || "Événement non trouvé"}</p>
          <Link
            href="/tableau-de-bord/evenements"
            className="mt-3 inline-block text-sm font-semibold text-[var(--obillz-hero-blue)] hover:underline"
          >
            ← {t("dashboard.events.detail.backToList")}
          </Link>
        </GlassCard>
      </PageLayout>
    );
  }

  const subtitleParts: string[] = [];
  if (event.eventType?.name) subtitleParts.push(event.eventType.name);
  subtitleParts.push(
    event.end_date && event.end_date !== event.start_date
      ? `${formatDate(event.start_date)} → ${formatDate(event.end_date)}`
      : formatDate(event.start_date)
  );

  return (
    <PageLayout maxWidth="6xl">
      <div>
        <Link
          href="/tableau-de-bord/evenements"
          className="inline-flex items-center gap-1 text-sm font-medium text-white/85 hover:text-white transition-colors"
        >
          ← {t("dashboard.events.detail.backToList")}
        </Link>
      </div>

      <PageHeader
        title={isEditing ? t("dashboard.events.form.editTitle") : event.name}
        subtitle={isEditing ? undefined : subtitleParts.join(" • ")}
        actions={
          isEditing ? null : (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
                  statusBadgeClass(event.status)
                )}
              >
                {t(`dashboard.events.status.${event.status}`)}
              </span>
              <ActionButton type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2">
                <Edit className="h-4 w-4" />
                {t("dashboard.events.detail.editAction")}
              </ActionButton>
              <ActionButton type="button" variant="dangerSoft" onClick={handleDelete} className="inline-flex items-center gap-2">
                <Trash className="h-4 w-4" />
                {t("dashboard.events.detail.deleteAction")}
              </ActionButton>
            </div>
          )
        }
      />

      {!isEditing && event.description ? (
        <GlassCard padding="md">
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{event.description}</p>
        </GlassCard>
      ) : null}

      {isEditing ? (
        <GlassCard padding="lg">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className={labelClass}>{t("dashboard.events.fields.name")}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t("dashboard.events.fields.type")}</label>
              <select
                value={formData.eventTypeId}
                onChange={(e) => setFormData({ ...formData, eventTypeId: e.target.value })}
                className={inputClass}
              >
                <option value="">{t("dashboard.events.fields.typePlaceholder")}</option>
                {eventTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("dashboard.events.fields.startDate")}</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t("dashboard.events.fields.endDate")}</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>{t("dashboard.events.fields.description")}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t("dashboard.events.fields.status")}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "planned" | "completed" })}
                className={inputClass}
              >
                <option value="planned">{t("dashboard.events.status.planned")}</option>
                <option value="completed">{t("dashboard.events.status.completed")}</option>
              </select>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <ActionButton type="button" onClick={() => setIsEditing(false)} className="flex-1 justify-center">
                {t("dashboard.events.form.cancel")}
              </ActionButton>
              <DashboardPrimaryButton type="submit" icon="none" className="flex-1 justify-center rounded-xl">
                {t("dashboard.events.form.saveAction")}
              </DashboardPrimaryButton>
            </div>
          </form>
        </GlassCard>
      ) : (
        <>
          {/* Bilan financier */}
          <SectionCard
            title={t("dashboard.events.detail.financialSummary")}
            icon={Calendar}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  {t("dashboard.events.detail.totalRevenue")}
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-800">{formatMontant(event.totalRevenue)}</p>
                <div className="mt-3 space-y-1 text-xs text-emerald-900/85">
                  <p>
                    {t("dashboard.events.detail.revenueFromInvoices")} : <span className="font-semibold">{formatMontant(event.revenueFromInvoices)}</span>
                  </p>
                  <p>
                    {t("dashboard.events.detail.revenueFromProducts")} : <span className="font-semibold">{formatMontant(event.revenueFromProducts)}</span>
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                  {t("dashboard.events.detail.totalExpenses")}
                </p>
                <p className="mt-2 text-3xl font-bold text-rose-800">{formatMontant(event.totalExpenses)}</p>
              </div>
              <div
                className={cn(
                  "rounded-2xl border p-5 shadow-sm",
                  event.netResult >= 0
                    ? "border-blue-200/70 bg-blue-50/80"
                    : "border-amber-200/70 bg-amber-50/80"
                )}
              >
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    event.netResult >= 0 ? "text-blue-700" : "text-amber-700"
                  )}
                >
                  {t("dashboard.events.detail.netResult")}
                </p>
                <p className={cn("mt-2 text-3xl font-bold", resultColor(event.netResult))}>
                  {formatMontant(event.netResult)}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs font-medium",
                    event.netResult >= 0 ? "text-blue-700" : "text-amber-700"
                  )}
                >
                  {event.netResult >= 0
                    ? t("dashboard.events.detail.profit")
                    : t("dashboard.events.detail.loss")}
                </p>
              </div>
            </div>

            {event.totalRevenue > 0 || event.totalExpenses > 0 ? (
              <div className="mt-2 rounded-2xl border border-slate-200/70 bg-white/85 p-4 sm:p-6 shadow-sm">
                <EventFinancialChart
                  revenue={event.totalRevenue}
                  expenses={event.totalExpenses}
                />
              </div>
            ) : null}
          </SectionCard>

          {/* Factures liées */}
          <SectionCard
            title={t("dashboard.events.detail.linkedDocuments")}
            description={t("dashboard.events.detail.linkedDocumentsHint")}
            headerRight={
              <Link
                href={`/tableau-de-bord/factures/nouvelle?eventId=${eventId}`}
                className="text-sm font-semibold text-[var(--obillz-hero-blue)] hover:underline"
              >
                + {t("dashboard.events.detail.linkDocument")}
              </Link>
            }
          >
            {event.documents.length === 0 ? (
              <EmptyState
                embedded
                title={t("dashboard.events.detail.noDocuments")}
              />
            ) : (
              <div className="space-y-2.5">
                {event.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={cn(glassNestedRowClass, "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{doc.numero}</p>
                      <p className="truncate text-sm text-slate-500">{doc.client?.nom || "—"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-emerald-700">{formatMontant(Number(doc.total_ttc))}</p>
                        <p className="text-xs text-slate-500">{formatDate(doc.date_creation)}</p>
                      </div>
                      <ActionButton href={`/tableau-de-bord/factures/${doc.id}`} className="inline-flex items-center gap-1.5 p-2">
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("dashboard.common.view")}</span>
                      </ActionButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Charges */}
          <SectionCard
            title={t("dashboard.events.detail.linkedExpenses")}
            headerRight={
              <Link
                href="/tableau-de-bord/depenses"
                className="text-sm font-semibold text-[var(--obillz-hero-blue)] hover:underline"
              >
                + {t("dashboard.events.detail.linkExpense")}
              </Link>
            }
          >
            {event.expenses.length === 0 ? (
              <EmptyState embedded title={t("dashboard.events.detail.noExpenses")} />
            ) : (
              <div className="space-y-2.5">
                {event.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className={cn(glassNestedRowClass, "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between")}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{expense.description}</p>
                      <p className="text-sm text-slate-500">{formatDate(expense.date)}</p>
                    </div>
                    <p className="font-semibold text-rose-700">{formatMontant(Number(expense.amount))}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Revenus / produits simples */}
          <SectionCard
            title={t("dashboard.events.detail.linkedProducts")}
            description={t("dashboard.events.detail.linkedProductsHint")}
            headerRight={
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={openAddRevenueModal}
                  className="text-sm font-semibold text-[var(--obillz-hero-blue)] hover:underline"
                >
                  + {t("dashboard.events.detail.linkProduct")}
                </button>
                <Link
                  href={`/tableau-de-bord/produits?eventId=${eventId}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  {t("dashboard.productRevenues.title")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            }
          >
            {event.clubRevenues.length === 0 ? (
              <EmptyState embedded title={t("dashboard.events.detail.noProducts")} />
            ) : (
              <div className="space-y-2.5">
                {event.clubRevenues.map((row) => (
                  <div
                    key={row.id}
                    className={cn(glassNestedRowClass, "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between")}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{row.name}</p>
                      {row.description ? (
                        <p className="text-sm text-slate-500 line-clamp-2">{row.description}</p>
                      ) : null}
                      <p className="text-xs text-slate-500">{formatDate(row.revenue_date)}</p>
                    </div>
                    <p className="font-semibold text-emerald-700 sm:text-right">
                      {formatMontant(Number(row.amount))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {showAddRevenueModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <GlassCard
                padding="lg"
                className="w-full max-w-md shadow-2xl shadow-blue-900/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {t("dashboard.productRevenues.form.titleNew")}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddRevenueModal(false)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {revenueModalError && (
                  <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {revenueModalError}
                  </p>
                )}
                <form onSubmit={handleAddRevenue} className="space-y-4">
                  <div>
                    <label className={labelClass}>{t("dashboard.productRevenues.form.name")}</label>
                    <input
                      required
                      value={revenueForm.name}
                      onChange={(e) => setRevenueForm({ ...revenueForm, name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{t("dashboard.productRevenues.form.amount")}</label>
                      <input
                        required
                        type="text"
                        inputMode="decimal"
                        value={revenueForm.amount}
                        onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("dashboard.productRevenues.form.date")}</label>
                      <input
                        required
                        type="date"
                        value={revenueForm.revenueDate}
                        onChange={(e) => setRevenueForm({ ...revenueForm, revenueDate: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t("dashboard.productRevenues.form.description")}</label>
                    <textarea
                      rows={2}
                      value={revenueForm.description}
                      onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                    <ActionButton type="button" onClick={() => setShowAddRevenueModal(false)} className="flex-1 justify-center">
                      {t("dashboard.productRevenues.form.cancel")}
                    </ActionButton>
                    <DashboardPrimaryButton
                      type="submit"
                      icon="none"
                      disabled={savingRevenue}
                      className="flex-1 justify-center rounded-xl"
                    >
                      {savingRevenue ? t("dashboard.productRevenues.form.saving") : t("dashboard.productRevenues.form.save")}
                    </DashboardPrimaryButton>
                  </div>
                </form>
              </GlassCard>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
