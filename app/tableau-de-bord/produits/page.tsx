"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Edit, Trash } from "@/lib/icons";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";

interface EventOption {
  id: string;
  name: string;
}

interface ClubRevenue {
  id: string;
  name: string;
  amount: number;
  revenue_date: string;
  description?: string | null;
  event_id?: string | null;
  event?: { id: string; name: string } | null;
}

function ProduitsPageInner() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const [revenues, setRevenues] = useState<ClubRevenue[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClubRevenue | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    revenueDate: "",
    description: "",
    eventId: "",
  });

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat(localeToIntl[locale], {
      style: "currency",
      currency: "CHF",
    }).format(montant);
  };

  const formatDate = (value: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(localeToIntl[locale]);
  };

  const loadEvents = async () => {
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadRevenues = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/club-revenues", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || t("dashboard.productRevenues.loadError"));
      }
      const data = await res.json();
      setRevenues(data.revenues || []);
    } catch (e: any) {
      setErrorMessage(e.message);
      setRevenues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
    void loadRevenues();
  }, []);

  useEffect(() => {
    const eid = searchParams.get("eventId");
    if (eid && events.length > 0) {
      const exists = events.some((e) => e.id === eid);
      if (exists) {
        setFormData((prev) => ({ ...prev, eventId: eid }));
      }
    }
  }, [searchParams, events]);

  const openNew = () => {
    const eid = searchParams.get("eventId") || "";
    const ev = eid && events.some((e) => e.id === eid) ? eid : "";
    setEditing(null);
    setFormData({
      name: "",
      amount: "",
      revenueDate: new Date().toISOString().slice(0, 10),
      description: "",
      eventId: ev,
    });
    setShowForm(true);
  };

  const openEdit = (r: ClubRevenue) => {
    setEditing(r);
    setFormData({
      name: r.name,
      amount: String(r.amount),
      revenueDate: r.revenue_date,
      description: r.description || "",
      eventId: r.event_id || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    try {
      const payload = {
        name: formData.name.trim(),
        amount: Number(formData.amount.replace(",", ".")),
        revenueDate: formData.revenueDate,
        description: formData.description.trim() || null,
        eventId: formData.eventId || null,
      };
      if (Number.isNaN(payload.amount) || payload.amount < 0) {
        throw new Error(t("dashboard.common.amount"));
      }
      const url = editing ? `/api/club-revenues/${editing.id}` : "/api/club-revenues";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = [data?.error, data?.details].filter(Boolean).join(" — ");
        throw new Error(msg || t("dashboard.productRevenues.saveError"));
      }
      await loadRevenues();
      closeForm();
    } catch (err: any) {
      setErrorMessage(err.message || t("dashboard.productRevenues.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("dashboard.productRevenues.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/club-revenues/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("dashboard.productRevenues.deleteError"));
      await loadRevenues();
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.productRevenues.title")}</h1>
          <p className="mt-2 text-secondary max-w-2xl">{t("dashboard.productRevenues.subtitle")}</p>
        </div>
        <DashboardPrimaryButton type="button" onClick={openNew}>
          {t("dashboard.productRevenues.addButton")}
        </DashboardPrimaryButton>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">{errorMessage}</div>
      )}

      {loading ? (
        <p className="text-secondary">{t("dashboard.common.loading")}</p>
      ) : revenues.length === 0 ? (
        <div className="rounded-2xl border border-subtle bg-surface/80 p-12 text-center shadow-premium">
          <p className="text-secondary mb-2">{t("dashboard.productRevenues.emptyState")}</p>
          <p className="text-sm text-secondary mb-6">{t("dashboard.productRevenues.emptyHint")}</p>
          <button
            type="button"
            onClick={openNew}
            className="px-6 py-3 rounded-lg accent-bg text-white font-medium transition-all"
          >
            {t("dashboard.productRevenues.addButton")}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-subtle bg-surface/80 overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-subtle bg-surface/80">
                  <th className="px-4 py-3 text-sm font-semibold text-secondary">{t("dashboard.productRevenues.columns.name")}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-secondary">{t("dashboard.productRevenues.columns.date")}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-secondary">{t("dashboard.productRevenues.columns.amount")}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-secondary hidden md:table-cell">{t("dashboard.productRevenues.columns.event")}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-secondary text-right">{t("dashboard.common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map((r) => (
                  <tr key={r.id} className="border-b border-subtle/80 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-secondary text-sm">{formatDate(r.revenue_date)}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{formatMontant(r.amount)}</td>
                    <td className="px-4 py-3 text-sm text-secondary hidden md:table-cell">
                      {r.event ? (
                        <Link href={`/tableau-de-bord/evenements/${r.event.id}`} className="text-secondary hover:text-primary">
                          {r.event.name}
                        </Link>
                      ) : (
                        t("dashboard.productRevenues.columns.noEvent")
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="p-2 rounded-lg hover:bg-surface text-secondary inline-flex mr-1"
                        title={t("dashboard.productRevenues.editButton")}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(r.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 inline-flex"
                        title={t("dashboard.common.delete")}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-subtle bg-surface p-6 shadow-premium max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editing ? t("dashboard.productRevenues.form.titleEdit") : t("dashboard.productRevenues.form.titleNew")}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("dashboard.productRevenues.form.name")}</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("dashboard.productRevenues.form.namePlaceholder")}
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("dashboard.productRevenues.form.amount")}</label>
                  <input
                    required
                    type="text"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("dashboard.productRevenues.form.date")}</label>
                  <input
                    required
                    type="date"
                    value={formData.revenueDate}
                    onChange={(e) => setFormData({ ...formData, revenueDate: e.target.value })}
                    className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("dashboard.productRevenues.form.description")}</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("dashboard.productRevenues.form.descriptionPlaceholder")}
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("dashboard.productRevenues.form.event")}</label>
                <select
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                >
                  <option value="">{t("dashboard.productRevenues.form.eventPlaceholder")}</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-3 rounded-lg bg-surface-hover hover:bg-surface text-primary text-center transition-all"
                >
                  {t("dashboard.productRevenues.form.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-lg accent-bg text-white font-medium transition-all disabled:opacity-50"
                >
                  {saving ? t("dashboard.productRevenues.form.saving") : t("dashboard.productRevenues.form.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProduitsPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto p-8 text-secondary">…</div>}>
      <ProduitsPageInner />
    </Suspense>
  );
}
