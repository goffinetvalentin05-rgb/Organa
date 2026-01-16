"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Trash } from "@/lib/icons";
import { createClient } from "@/lib/supabase/client";

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

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "CHF",
  }).format(montant);
};

const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
};

const isDatePassee = (value: string) => {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
};

const getStatutAffiche = (depense: Depense) => {
  if (depense.status === "a_payer" && isDatePassee(depense.date)) {
    return "en_retard";
  }
  return depense.status;
};

const getStatutLabel = (statut: string) => {
  const labels: Record<string, string> = {
    a_payer: "À payer",
    paye: "Payé",
    en_retard: "En retard",
  };
  return labels[statut] || statut;
};

const getStatutColor = (statut: string) => {
  const colors: Record<string, string> = {
    a_payer: "bg-yellow-500/20 text-yellow-300",
    paye: "bg-green-500/20 text-green-300",
    en_retard: "bg-red-500/20 text-red-300",
  };
  return colors[statut] || "bg-gray-500/20 text-gray-300";
};

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);
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
        throw new Error(error.message || "Erreur lors du chargement des dépenses");
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
      setErrorMessage(error?.message || "Erreur lors du chargement des dépenses");
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
      throw new Error("Erreur lors de l'upload de la pièce jointe");
    }

    const { data: publicUrlData } = supabase.storage
      .from("expenses")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
        throw new Error("Erreur lors de la création de la dépense");
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
        throw new Error("Erreur lors de la création de la dépense");
      }

      await loadDepenses();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDepense) return;
    const amount = Number.parseFloat(editFormData.amount);
    if (!editFormData.label || !editFormData.date || Number.isNaN(amount)) {
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Erreur lors de la mise à jour de la dépense");
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
        throw new Error("Erreur lors de la mise à jour de la dépense");
      }

      await loadDepenses();
      resetEditForm();
      setShowEditModal(false);
      setSelectedDepense(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("expenses").delete().eq("id", id);

      if (error) {
        throw new Error("Erreur lors de la suppression de la dépense");
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dépenses</h1>
          <p className="mt-2 text-white/70">
            Suivez vos factures reçues et vos paiements à venir
          </p>
        </div>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouvelle dépense
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Fournisseur
              </label>
              <input
                type="text"
                required
                value={formData.label}
                onChange={(event) =>
                  setFormData({ ...formData, label: event.target.value })
                }
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Montant
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
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Date d&apos;échéance
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(event) =>
                  setFormData({ ...formData, date: event.target.value })
                }
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    status: event.target.value as DepenseStatut,
                  })
                }
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              >
                <option value="a_payer">À payer</option>
                <option value="paye">Payé</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Note (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(event) =>
                setFormData({ ...formData, notes: event.target.value })
              }
              rows={3}
              className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Ajouter une pièce jointe
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
              className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-white/20"
            />
            <p className="mt-2 text-xs text-white/50">
              Formats acceptés : PDF, JPG, PNG. Une seule pièce jointe.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="flex-1 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
            >
              Ajouter la dépense
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-white/70">Chargement...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-12 text-center">
            <p className="text-red-400 mb-2">Erreur lors du chargement</p>
            <p className="text-white/70 text-sm">{errorMessage}</p>
          </div>
        ) : depensesTriees.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/70 mb-4">
              Aucune dépense enregistrée pour le moment
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
            >
              Ajouter votre première dépense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Fournisseur
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Date d&apos;échéance
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Pièce jointe
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/90">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {depensesTriees.map((depense) => {
                  const statutAffiche = getStatutAffiche(depense);
                  return (
                    <tr
                      key={depense.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">
                        {depense.label}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatMontant(depense.amount)}
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        {formatDate(depense.date)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(
                            statutAffiche
                          )}`}
                        >
                          {getStatutLabel(statutAffiche)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        {depense.attachmentUrl ? "📎" : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVoir(depense)}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-sm flex items-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </button>
                          <button
                            onClick={() => handleModifier(depense)}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-sm"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(depense.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all text-sm flex items-center justify-center"
                            title="Supprimer"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showViewModal && selectedDepense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#0F0F14] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Dépense</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedDepense(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-sm"
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs uppercase text-white/50">Fournisseur</p>
                <p className="mt-2 font-medium break-words">
                  {selectedDepense.label}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs uppercase text-white/50">Montant</p>
                <p className="mt-2 font-semibold">
                  {formatMontant(selectedDepense.amount)}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs uppercase text-white/50">Date d&apos;échéance</p>
                <p className="mt-2">{formatDate(selectedDepense.date)}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs uppercase text-white/50">Statut</p>
                <p className="mt-2">
                  {getStatutLabel(getStatutAffiche(selectedDepense))}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs uppercase text-white/50">Notes</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-white/80">
                {selectedDepense.notes || "-"}
              </p>
            </div>

            {selectedDepense.attachmentUrl && (
              <div className="flex justify-end">
                <a
                  href={selectedDepense.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-sm"
                >
                  Télécharger la pièce jointe
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && selectedDepense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#0F0F14] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Modifier la dépense</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDepense(null);
                  resetEditForm();
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-sm"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Fournisseur
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.label}
                    onChange={(event) =>
                      setEditFormData({ ...editFormData, label: event.target.value })
                    }
                    className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Montant
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
                    className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Date d&apos;échéance
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(event) =>
                      setEditFormData({ ...editFormData, date: event.target.value })
                    }
                    className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Statut
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(event) =>
                      setEditFormData({
                        ...editFormData,
                        status: event.target.value as DepenseStatut,
                      })
                    }
                    className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                  >
                    <option value="a_payer">À payer</option>
                    <option value="paye">Payé</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(event) =>
                    setEditFormData({ ...editFormData, notes: event.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Remplacer la pièce jointe
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
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-white/20"
                />
                <p className="mt-2 text-xs text-white/50">
                  Formats acceptés : PDF, JPG, PNG. Une seule pièce jointe.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDepense(null);
                    resetEditForm();
                  }}
                  className="flex-1 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

