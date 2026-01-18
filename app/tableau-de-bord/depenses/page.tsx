"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Plus, Trash, Calendar, ArrowRight } from "@/lib/icons";
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
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    amount: "",
    date: "",
    status: "a_payer" as DepenseStatut,
    notes: "",
    pieceJointe: null as File | null,
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
  }, []);

  const loadDepenses = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        throw new Error(error.message || t("dashboard.expenses.loadError"));
      }

      const depensesChargees = (data ?? []).map((depense: any) => ({
        id: depense.id,
        label: depense.label || "",
        amount:
          typeof depense.amount === "number"
            ? depense.amount
            : Number(depense.amount) || 0,
        date: depense.date || "",
        status: (depense.status || "a_payer") as DepenseStatut,
        notes: depense.notes || undefined,
        attachmentUrl: depense.attachment_url || undefined,
      }));

      setDepenses(depensesChargees);
    } catch (error: any) {
      setErrorMessage(error?.message || t("dashboard.expenses.loadError"));
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
    const safeName = file.name.replace(/\s+/g, "_");
    const filePath = `${userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("expenses")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      throw new Error(t("dashboard.expenses.uploadError"));
    }

    const { data: publicUrlData } = supabase.storage
      .from("expenses")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  // Cause du bug: les boutons dépendaient du submit HTML et étaient recouverts par un overlay,
  // ce qui empêchait le clic de remonter. On force un handler explicite + z-index/pointer-events.
  const openCreateForm = () => {
    console.log("CLICK OUVRIR FORMULAIRE DEPENSE");
    setShowForm(true);
  };

  const onCreateExpense = async () => {
    console.log("CLICK AJOUTER DEPENSE OK");
    const amount = Number.parseFloat(formData.amount);
    if (!formData.label || !formData.date || Number.isNaN(amount)) {
      return;
    }

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

      const { error } = await supabase.from("expenses").insert({
        label: formData.label.trim(),
        amount,
        date: formData.date,
        status: formData.status,
        notes: formData.notes.trim() || null,
        attachment_url: attachmentUrl,
        user_id: user.id,
      });

      if (error) {
        throw new Error(t("dashboard.expenses.createError"));
      }

      await loadDepenses();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error(error);
    }
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
          label: editFormData.label.trim(),
          amount,
          date: editFormData.date,
          status: editFormData.status,
          notes: editFormData.notes.trim() || null,
          attachment_url: attachmentUrl,
        })
        .eq("id", selectedDepense.id);

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
      const { error } = await supabase.from("expenses").delete().eq("id", id);

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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.expenses.title")}</h1>
          <p className="mt-2 text-secondary">
            {t("dashboard.expenses.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/tableau-de-bord/calendrier"
            className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-light px-4 py-2 text-xs font-semibold text-primary transition-all hover:opacity-90"
          >
            <Calendar className="w-4 h-4" />
            {t("dashboard.expenses.planReminder")}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              console.log("CLICK OUVRIR FORMULAIRE DEPENSE");
              setShowForm((value) => !value);
            }}
            className="px-6 py-3 accent-bg text-white font-medium rounded-full transition-all flex items-center gap-2"
            style={{ pointerEvents: "auto", zIndex: 50, position: "relative" }}
          >
            <Plus className="w-5 h-5" />
            {t("dashboard.expenses.newExpense")}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-subtle bg-surface/80 p-6 space-y-4 shadow-premium">
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
          <div
            className="flex gap-3"
            style={{ pointerEvents: "auto", zIndex: 50, position: "relative" }}
          >
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
            <button
              type="button"
              onClick={onCreateExpense}
              className="flex-1 px-6 py-3 rounded-full accent-bg text-white font-medium transition-all"
              style={{ pointerEvents: "auto", zIndex: 50, position: "relative" }}
            >
              {t("dashboard.expenses.addAction")}
            </button>
          </div>
        </div>
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
        ) : depensesTriees.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-secondary mb-4">
              {t("dashboard.expenses.emptyState")}
            </p>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-block px-6 py-3 accent-bg text-white font-medium rounded-full transition-all"
              style={{ pointerEvents: "auto", zIndex: 50, position: "relative" }}
            >
              {t("dashboard.expenses.emptyCta")}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {depensesTriees.map((depense) => {
              const statutAffiche = getStatutAffiche(depense);
              const besoinAction =
                depense.status === "a_payer" &&
                (isDatePassee(depense.date) || isDateProche(depense.date, 7));
              return (
                <div
                  key={depense.id}
                  className="rounded-2xl border border-subtle bg-surface/60 p-5 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-tertiary">
                          {t("dashboard.expenses.fields.supplier")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-primary">{depense.label}</p>
                        <p className="mt-1 text-sm text-secondary">
                          {t("dashboard.expenses.dueLabel")} {formatDate(depense.date)}
                        </p>
                        {besoinAction && (
                          <p className="mt-2 text-sm text-yellow-600">
                            Une action est recommandée pour sécuriser ce paiement.
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-tertiary">{t("dashboard.common.amount")}</p>
                        <p className="mt-2 text-2xl font-semibold text-primary">
                          {formatMontant(depense.amount)}
                        </p>
                        <span
                          className={`mt-3 inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatutColor(
                            statutAffiche
                          )}`}
                        >
                          {getStatutLabel(statutAffiche, t)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm text-secondary">
                        {depense.attachmentUrl
                          ? t("dashboard.expenses.attachmentAvailable")
                          : t("dashboard.expenses.noAttachment")}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleVoir(depense)}
                          className="px-4 py-2 rounded-full bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all text-sm flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          {t("dashboard.common.view")}
                        </button>
                        <button
                          onClick={() => handleModifier(depense)}
                          className="px-4 py-2 rounded-full bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all text-sm"
                        >
                          {t("dashboard.expenses.editAction")}
                        </button>
                        <button
                          onClick={() => handleDelete(depense.id)}
                          className="px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-all text-sm flex items-center justify-center"
                          title={t("dashboard.common.delete")}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showViewModal && selectedDepense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-subtle bg-surface p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("dashboard.expenses.viewTitle")}</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedDepense(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all text-sm"
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-surface p-4">
                <p className="text-xs uppercase text-tertiary">{t("dashboard.expenses.fields.supplier")}</p>
                <p className="mt-2 font-medium break-words">
                  {selectedDepense.label}
                </p>
              </div>
              <div className="rounded-lg bg-surface p-4">
                <p className="text-xs uppercase text-tertiary">{t("dashboard.common.amount")}</p>
                <p className="mt-2 font-semibold">
                  {formatMontant(selectedDepense.amount)}
                </p>
              </div>
              <div className="rounded-lg bg-surface p-4">
                <p className="text-xs uppercase text-tertiary">{t("dashboard.expenses.fields.dueDate")}</p>
                <p className="mt-2">{formatDate(selectedDepense.date)}</p>
              </div>
              <div className="rounded-lg bg-surface p-4">
                <p className="text-xs uppercase text-tertiary">{t("dashboard.common.status")}</p>
                <p className="mt-2">
                  {getStatutLabel(getStatutAffiche(selectedDepense), t)}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-surface p-4">
              <p className="text-xs uppercase text-tertiary">{t("dashboard.common.notes")}</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-secondary">
                {selectedDepense.notes || "-"}
              </p>
            </div>

            {selectedDepense.attachmentUrl && (
              <div className="flex justify-end">
                <a
                  href={selectedDepense.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all text-sm"
                >
                  {t("dashboard.expenses.downloadAttachment")}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && selectedDepense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-subtle bg-surface p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("dashboard.expenses.editTitle")}</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDepense(null);
                  resetEditForm();
                }}
                className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all text-sm"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    {t("dashboard.expenses.fields.supplier")}
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.label}
                    onChange={(event) =>
                      setEditFormData({ ...editFormData, label: event.target.value })
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
                    value={editFormData.amount}
                    onChange={(event) =>
                      setEditFormData({ ...editFormData, amount: event.target.value })
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
                    value={editFormData.date}
                    onChange={(event) =>
                      setEditFormData({ ...editFormData, date: event.target.value })
                    }
                    className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
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
                  value={editFormData.notes}
                  onChange={(event) =>
                    setEditFormData({ ...editFormData, notes: event.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
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
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary file:mr-4 file:rounded-md file:border-0 file:bg-surface-hover file:px-3 file:py-1.5 file:text-sm file:text-primary hover:file:bg-surface"
                />
                <p className="mt-2 text-xs text-tertiary">
                  {t("dashboard.expenses.attachmentHint")}
                </p>
              </div>
              <div
                className="flex gap-3"
                style={{ pointerEvents: "auto", zIndex: 50, position: "relative" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDepense(null);
                    resetEditForm();
                  }}
                  className="flex-1 px-6 py-3 rounded-lg bg-surface-hover hover:bg-surface text-primary transition-all"
                >
                  {t("dashboard.common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={onUpdateExpense}
                  style={{ pointerEvents: "auto", zIndex: 50, position: "relative" }}
                  className="flex-1 px-6 py-3 rounded-lg accent-bg text-white font-medium transition-all"
                >
                  {t("dashboard.expenses.saveAction")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





