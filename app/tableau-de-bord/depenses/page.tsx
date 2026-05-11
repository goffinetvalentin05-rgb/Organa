"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, Edit, Trash, Download, Receipt } from "@/lib/icons";
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
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";

type DepenseStatut = "a_payer" | "paye";

interface Depense {
  id: string;
  label: string;
  amount: number;
  date: string;
  status: DepenseStatut;
  notes?: string;
  attachmentUrl?: string;
  eventId?: string;
}

interface Event {
  id: string;
  name: string;
}

const isDatePassee = (value: string) => {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
};

const isDateProche = (value: string, days = 7) => {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(today.getDate() + days);
  return date.getTime() >= today.getTime() && date.getTime() <= limit.getTime();
};

const getStatutAffiche = (depense: Depense) => {
  if (depense.status === "a_payer" && isDatePassee(depense.date)) {
    return "en_retard";
  }
  return depense.status;
};

const getStatutLabel = (statut: string, t: (key: string) => string) => {
  const labels: Record<string, string> = {
    a_payer: t("dashboard.expenses.status.toPay"),
    paye: t("dashboard.expenses.status.paid"),
    en_retard: t("dashboard.expenses.status.overdue"),
  };
  return labels[statut] || statut;
};

const getStatutColor = (statut: string) => {
  const colors: Record<string, string> = {
      a_payer: "bg-yellow-100 text-yellow-700",
      paye: "bg-green-100 text-green-700",
      en_retard: "bg-red-100 text-red-700",
  };
    return colors[statut] || "bg-slate-100 text-slate-700";
};

export default function DepensesPage() {
  const { t, locale } = useI18n();
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const [showAccountingExport, setShowAccountingExport] = useState(false);
  const [accountingYear, setAccountingYear] = useState<string>(String(currentYear));
  const accountingYears = Array.from({ length: 5 }, (_, index) =>
    String(currentYear - index)
  );
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    amount: "",
    date: "",
    status: "a_payer" as DepenseStatut,
    notes: "",
    pieceJointe: null as File | null,
    eventId: "",
  });
  const [editFormData, setEditFormData] = useState({
    label: "",
    amount: "",
    date: "",
    status: "a_payer" as DepenseStatut,
    notes: "",
    pieceJointe: null as File | null,
    attachmentUrl: "",
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

  useEffect(() => {
    void loadDepenses();
    void loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setEvents(data?.events || []);
      }
    } catch (error) {
      console.error("[Depenses] Erreur chargement événements:", error);
    }
  };

  const loadDepenses = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setWarningMessage(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("[Depenses] user:", user);
      if (authError) {
        console.error("[Depenses] auth error:", {
          message: authError.message,
          code: authError.code,
        });
      }

      const response = await fetch("/api/depenses", { cache: "no-store" });
      if (!response.ok) {
        let data: any = null;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("[Depenses] Impossible de parser la réponse:", parseError);
        }
        console.error(
          "[Depenses] Erreur Supabase (GET):",
          {
            error: data?.error,
            details: data?.details,
            code: data?.code,
            hint: data?.hint,
          }
        );
        const messageParts = [
          data?.error || t("dashboard.expenses.loadError"),
          data?.details ? `details: ${data.details}` : null,
          data?.code ? `code: ${data.code}` : null,
        ].filter(Boolean);
        throw new Error(messageParts.join(" | "));
      }
      const data = await response.json();
      if (!data?.depenses) {
        console.warn("[Depenses] Réponse dépourvue de données:", data);
      }
      const depensesChargees = (data?.depenses ?? []).map((depense: any) => ({
        id: depense.id,
        label: depense.label || "",
        amount:
          typeof depense.amount === "number"
            ? depense.amount
            : Number(depense.amount) || 0,
        date: depense.date || "",
        status: (depense.status || "a_payer") as DepenseStatut,
        notes: depense.notes || undefined,
        attachmentUrl: depense.attachmentUrl || undefined,
      }));

      setDepenses(depensesChargees);
    } catch (error: any) {
      console.error("[Depenses] Erreur attrapée:", error);
      const explicitMessage =
        typeof error?.message === "string"
          ? error.message
          : JSON.stringify(error);
      setErrorMessage(explicitMessage || t("dashboard.expenses.loadError"));
      setDepenses([]);
    } finally {
      setLoading(false);
    }
  };

  const depensesTriees = useMemo(() => {
    return [...depenses].sort((a, b) => {
      return b.date.localeCompare(a.date);
    });
  }, [depenses]);

  const resetForm = () => {
    setFormData({
      label: "",
      amount: "",
      date: "",
      status: "a_payer",
      notes: "",
      pieceJointe: null,
      eventId: "",
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      label: "",
      amount: "",
      date: "",
      status: "a_payer",
      notes: "",
      pieceJointe: null,
      attachmentUrl: "",
    });
  };

  const uploadAttachment = async (
    supabase: ReturnType<typeof createClient>,
    userId: string,
    file: File
  ) => {
    // Bucket "expenses" = PRIVÉ. On stocke uniquement le PATH dans la base
    // (`attachment_url` = misnomer historique, contient désormais le path).
    // L'affichage/téléchargement passe par /api/storage/sign qui re-signe
    // une URL fraîche à chaque clic.
    // Convention de chemin : <userId>/<timestamp>-<safeName>
    const safeName = file.name
      .replace(/\\/g, "/")
      .split("/")
      .pop()!
      .replace(/[^A-Za-z0-9._-]+/g, "_")
      .slice(0, 200);
    const filePath = `${userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("expenses")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      console.error("[Depenses][upload] Erreur upload:", uploadError.message);
      throw new Error(
        uploadError.message || t("dashboard.expenses.uploadError")
      );
    }

    return filePath;
  };

  /**
   * Construit l'URL `<a href>` pour télécharger une pièce jointe.
   * - Si la valeur stockée est déjà une URL (ancien format), on la renvoie telle quelle.
   * - Sinon on construit l'URL d'API qui redirige vers une signed URL fraîche.
   */
  const buildAttachmentHref = (stored: string | null | undefined) => {
    if (!stored) return null;
    if (stored.startsWith("http://") || stored.startsWith("https://")) {
      return stored;
    }
    const params = new URLSearchParams({
      bucket: "expenses",
      path: stored,
    });
    return `/api/storage/sign?${params.toString()}`;
  };

  // Cause du bug: les boutons dépendaient du submit HTML et étaient recouverts par un overlay,
  // ce qui empêchait le clic de remonter. On force un handler explicite + z-index/pointer-events.
  const openCreateForm = () => {
    console.log("CLICK OUVRIR FORMULAIRE DEPENSE");
    setShowForm(true);
  };

  const onCreateExpense = async () => {
    console.log("submit fired");
    const amount = Number.parseFloat(formData.amount);
    if (!formData.label || !formData.date || Number.isNaN(amount)) {
      setErrorMessage(`${t("dashboard.expenses.createError")} | Données invalides`);
      return;
    }

    const normalizeDateToIso = (value: string) => {
      if (!value) return value;
      if (value.includes(".")) {
        const [day, month, year] = value.split(".");
        if (day && month && year) {
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      }
      return value;
    };

    const formattedDate = normalizeDateToIso(formData.date);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(t("dashboard.expenses.createError"));
      }

      let attachmentUrl: string | null = null;
      if (formData.pieceJointe) {
        attachmentUrl = await uploadAttachment(
          supabase,
          user.id,
          formData.pieceJointe
        );
      }

      const payload = {
        label: formData.label.trim(),
        amount,
        date: formattedDate,
        status: formData.status,
        notes: formData.notes.trim() || null,
        attachmentUrl: attachmentUrl || null,
        eventId: formData.eventId || null,
      };

      const response = await fetch("/api/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("response", response);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const messageParts = [
          data?.error || t("dashboard.expenses.createError"),
          data?.details ? `details: ${data.details}` : null,
          data?.code ? `code: ${data.code}` : null,
        ].filter(Boolean);
        throw new Error(messageParts.join(" | "));
      }

      await loadDepenses();
      resetForm();
      setShowForm(false);
      setSuccessMessage(t("dashboard.expenses.createSuccess"));
    } catch (error) {
      console.error("[Depenses][create] Erreur attrapée:", error);
      setErrorMessage(
        error instanceof Error ? error.message : t("dashboard.expenses.createError")
      );
    }
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreateExpense();
  };

  const onUpdateExpense = async () => {
    console.log("CLICK ENREGISTRER OK");
    if (!selectedDepense) return;
    const amount = Number.parseFloat(editFormData.amount);
    if (!editFormData.label || !editFormData.date || Number.isNaN(amount)) {
      return;
    }

    try {
      if (updateLoading) return;
      setUpdateLoading(true);
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(t("dashboard.expenses.updateError"));
      }

      let attachmentUrl = editFormData.attachmentUrl || null;
      if (editFormData.pieceJointe) {
        attachmentUrl = await uploadAttachment(
          supabase,
          user.id,
          editFormData.pieceJointe
        );
      }

      const { error } = await supabase
        .from("expenses")
        .update({
          description: editFormData.label.trim(),
          amount,
          date: editFormData.date,
          status: editFormData.status,
          notes: editFormData.notes.trim() || null,
          attachment_url: attachmentUrl,
        })
        .eq("id", selectedDepense.id)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(t("dashboard.expenses.updateError"));
      }

      await loadDepenses();
      resetEditForm();
      setShowEditModal(false);
      setSelectedDepense(null);
      setUpdateLoading(false);
    } catch (error) {
      console.error(error);
      setUpdateLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("dashboard.expenses.deleteConfirm"))) return;
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(t("dashboard.expenses.deleteError"));
      }

      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(t("dashboard.expenses.deleteError"));
      }
      await loadDepenses();
      if (selectedDepense?.id === id) {
        setSelectedDepense(null);
        setShowViewModal(false);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleVoir = (depense: Depense) => {
    setSelectedDepense(depense);
    setShowViewModal(true);
  };

  const handleModifier = (depense: Depense) => {
    setSelectedDepense(depense);
    setEditFormData({
      label: depense.label,
      amount: depense.amount.toString(),
      date: depense.date,
      status: depense.status,
      notes: depense.notes || "",
      pieceJointe: null,
      attachmentUrl: depense.attachmentUrl || "",
    });
    setShowEditModal(true);
  };

  const handleExportAccounting = () => {
    const url = `/api/export/accounting?resource=expenses&year=${accountingYear}`;
    window.location.href = url;
    setShowAccountingExport(false);
  };

  return (
    <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.expenses.title")}
        subtitle={t("dashboard.expenses.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountingExport((value) => !value)}
                className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900"
              >
                <Download className="h-5 w-5" />
                {t("dashboard.expenses.exportAccountingAction")}
              </button>
              {showAccountingExport ? (
                <div className="absolute right-0 z-10 mt-3 w-64 rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md">
                <label className="block text-sm text-secondary mb-2">
                  {t("dashboard.expenses.exportAccountingYearLabel")}
                </label>
                <select
                  value={accountingYear}
                  onChange={(event) => setAccountingYear(event.target.value)}
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                >
                  {accountingYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleExportAccounting}
                  className="mt-4 w-full rounded-lg accent-bg text-white py-2 text-sm font-medium"
                >
                  {t("dashboard.expenses.exportAccountingDownload")}
                </button>
                </div>
              ) : null}
            </div>
            <DashboardPrimaryButton
              type="button"
              onClick={() => {
                setShowForm((value) => !value);
              }}
              className="relative z-50"
              style={{ pointerEvents: "auto" }}
            >
              {t("dashboard.expenses.newExpense")}
            </DashboardPrimaryButton>
          </div>
        }
      />

      {showForm ? (
        <GlassCard padding="lg">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
          {successMessage && (
            <p className="text-sm text-green-600">{successMessage}</p>
          )}
          {warningMessage && (
            <p className="text-sm text-yellow-700">{warningMessage}</p>
          )}
          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.expenses.fields.supplier")}
              </label>
              <input
                type="text"
                required
                value={formData.label}
                onChange={(event) =>
                  setFormData({ ...formData, label: event.target.value })
                }
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.common.amount")}
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(event) =>
                  setFormData({ ...formData, amount: event.target.value })
                }
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.expenses.fields.dueDate")}
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(event) =>
                  setFormData({ ...formData, date: event.target.value })
                }
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.common.status")}
              </label>
              <select
                value={formData.status}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    status: event.target.value as DepenseStatut,
                  })
                }
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              >
                <option value="a_payer">{t("dashboard.expenses.status.toPay")}</option>
                <option value="paye">{t("dashboard.expenses.status.paid")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.expenses.fields.noteOptional")}
            </label>
            <textarea
              value={formData.notes}
              onChange={(event) =>
                setFormData({ ...formData, notes: event.target.value })
              }
              rows={3}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>
          {events.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.events.fields.type")} (optionnel)
              </label>
              <select
                value={formData.eventId}
                onChange={(event) =>
                  setFormData({ ...formData, eventId: event.target.value })
                }
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              >
                <option value="">— Aucun événement lié —</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.expenses.fields.attachment")}
            </label>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png"
              onChange={(event) =>
                setFormData({
                  ...formData,
                  pieceJointe: event.target.files?.[0] ?? null,
                })
              }
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary file:mr-4 file:rounded-md file:border-0 file:bg-surface-hover file:px-3 file:py-1.5 file:text-sm file:text-primary hover:file:bg-surface"
            />
            <p className="mt-2 text-xs text-tertiary">
              {t("dashboard.expenses.attachmentHint")}
            </p>
          </div>
          <div className="flex gap-3" style={{ pointerEvents: "auto", zIndex: 50, position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="flex-1 px-6 py-3 rounded-full bg-surface-hover hover:bg-surface text-primary transition-all"
            >
              {t("dashboard.common.cancel")}
            </button>
            <DashboardPrimaryButton
              type="submit"
              icon="none"
              className="relative z-50 flex-1 justify-center rounded-full"
              style={{ pointerEvents: "auto" }}
            >
              {t("dashboard.expenses.addAction")}
            </DashboardPrimaryButton>
          </div>
        </form>
        </GlassCard>
      ) : null}

      <TableCard bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-secondary">{t("dashboard.common.loading")}</p>
          </div>
        ) : errorMessage ? (
          <GlassCard padding="lg" className="m-5 border-red-200/80 bg-red-50/50 text-center">
            <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
            <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
          </GlassCard>
        ) : depensesTriees.length === 0 ? (
          <div className="p-6">
            <EmptyState
              embedded
              icon={Receipt}
              title={t("dashboard.expenses.emptyState")}
              action={
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-block rounded-full bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:opacity-95"
                  style={{ pointerEvents: "auto", zIndex: 50, position: "relative" }}
                >
                  {t("dashboard.expenses.emptyCta")}
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className={dashboardTableHeadRowClass}>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.expenses.listColumns.supplier")}</th>
                  <th className="whitespace-nowrap px-4 py-3 sm:px-6">{t("dashboard.expenses.listColumns.dueDate")}</th>
                  <th className="whitespace-nowrap px-4 py-3 sm:px-6">{t("dashboard.expenses.listColumns.attachment")}</th>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.common.amount")}</th>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.common.status")}</th>
                  <th className="px-4 py-3 text-right sm:px-6">{t("dashboard.common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {depensesTriees.map((depense) => {
                  const statutAffiche = getStatutAffiche(depense);
                  const besoinAction =
                    depense.status === "a_payer" &&
                    (isDatePassee(depense.date) || isDateProche(depense.date, 7));
                  const hrefPJ = depense.attachmentUrl ? buildAttachmentHref(depense.attachmentUrl) : null;
                  return (
                    <tr
                      key={depense.id}
                      className="bg-transparent transition-colors hover:bg-indigo-500/[0.06]"
                    >
                      <td className="max-w-[220px] px-4 py-3 sm:max-w-xs sm:px-6">
                        <p className="truncate font-medium text-slate-900">{depense.label}</p>
                        {depense.notes ? (
                          <p className="mt-0.5 truncate text-xs text-slate-500">{depense.notes}</p>
                        ) : null}
                        {besoinAction ? (
                          <p className="mt-0.5 text-xs text-amber-700">{t("dashboard.expenses.actionRecommendedHint")}</p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 sm:px-6">
                        {formatDate(depense.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        {hrefPJ ? (
                          <a
                            href={hrefPJ}
                            target="_blank"
                            rel="noreferrer"
                            title={t("dashboard.expenses.attachmentAvailable")}
                            className="inline-flex rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2 py-0.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100/90"
                          >
                            {t("dashboard.expenses.attachmentBadge")}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 sm:px-6">
                        {formatMontant(depense.amount)}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatutColor(
                            statutAffiche
                          )}`}
                        >
                          {getStatutLabel(statutAffiche, t)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right sm:px-6">
                        <ActionButton
                          type="button"
                          className="mr-1 inline-flex items-center gap-1.5 p-2"
                          title={t("dashboard.common.view")}
                          onClick={() => handleVoir(depense)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("dashboard.common.view")}</span>
                        </ActionButton>
                        <ActionButton
                          type="button"
                          className="mr-1 inline-flex items-center gap-1.5 p-2"
                          title={t("dashboard.common.edit")}
                          onClick={() => handleModifier(depense)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("dashboard.common.edit")}</span>
                        </ActionButton>
                        <ActionButton
                          type="button"
                          variant="dangerSoft"
                          className="inline-flex p-2"
                          title={t("dashboard.common.delete")}
                          onClick={() => handleDelete(depense.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </ActionButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {showViewModal && selectedDepense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200/70 bg-white p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{t("dashboard.expenses.viewTitle")}</h2>
              <ActionButton
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedDepense(null);
                }}
              >
                Fermer
              </ActionButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("dashboard.expenses.fields.supplier")}</p>
                <p className="mt-2 font-medium break-words text-slate-900">{selectedDepense.label}</p>
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("dashboard.common.amount")}</p>
                <p className="mt-2 font-semibold text-slate-900">{formatMontant(selectedDepense.amount)}</p>
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("dashboard.expenses.fields.dueDate")}</p>
                <p className="mt-2 text-slate-900">{formatDate(selectedDepense.date)}</p>
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("dashboard.common.status")}</p>
                <p className="mt-2 text-slate-900">
                  {getStatutLabel(getStatutAffiche(selectedDepense), t)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("dashboard.common.notes")}</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-slate-700">
                {selectedDepense.notes || "—"}
              </p>
            </div>

            {selectedDepense.attachmentUrl && (
              <div className="flex justify-end">
                <ActionButton href={buildAttachmentHref(selectedDepense.attachmentUrl) ?? "#"} target="_blank" rel="noreferrer">
                  {t("dashboard.expenses.downloadAttachment")}
                </ActionButton>
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && selectedDepense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200/70 bg-white p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{t("dashboard.expenses.editTitle")}</h2>
              <ActionButton
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDepense(null);
                  resetEditForm();
                }}
              >
                Fermer
              </ActionButton>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t("dashboard.expenses.fields.supplier")}
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.label}
                    onChange={(event) =>
                      setEditFormData({ ...editFormData, label: event.target.value })
                    }
                    className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t("dashboard.common.amount")}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editFormData.amount}
                    onChange={(event) =>
                      setEditFormData({ ...editFormData, amount: event.target.value })
                    }
                    className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t("dashboard.expenses.fields.dueDate")}
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(event) =>
                      setEditFormData({ ...editFormData, date: event.target.value })
                    }
                    className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t("dashboard.common.status")}
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(event) =>
                      setEditFormData({
                        ...editFormData,
                        status: event.target.value as DepenseStatut,
                      })
                    }
                    className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  >
                    <option value="a_payer">{t("dashboard.expenses.status.toPay")}</option>
                    <option value="paye">{t("dashboard.expenses.status.paid")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("dashboard.expenses.fields.noteOptional")}
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(event) =>
                    setEditFormData({ ...editFormData, notes: event.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("dashboard.expenses.replaceAttachment")}
                </label>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png"
                  onChange={(event) =>
                    setEditFormData({
                      ...editFormData,
                      pieceJointe: event.target.files?.[0] ?? null,
                    })
                  }
                  className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2 text-slate-900 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                />
                <p className="mt-2 text-xs text-slate-500">
                  {t("dashboard.expenses.attachmentHint")}
                </p>
              </div>
              <div
                className="flex flex-col-reverse gap-3 sm:flex-row"
                style={{ pointerEvents: "auto", zIndex: 50, position: "relative" }}
              >
                <ActionButton
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDepense(null);
                    resetEditForm();
                  }}
                  className="flex-1 justify-center"
                >
                  {t("dashboard.common.cancel")}
                </ActionButton>
                <DashboardPrimaryButton
                  type="button"
                  onClick={onUpdateExpense}
                  icon="none"
                  className="relative z-50 flex-1 justify-center"
                  style={{ pointerEvents: "auto" }}
                >
                  {t("dashboard.expenses.saveAction")}
                </DashboardPrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}





