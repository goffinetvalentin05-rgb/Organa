"use client";

import { useMemo, useState } from "react";
import { Eye, Plus, Trash } from "@/lib/icons";

type DepenseStatut = "a_payer" | "paye";

type Depense = {
  id: string;
  fournisseur: string;
  montant: number;
  dateEcheance: string;
  statut: DepenseStatut;
  note?: string;
};

const depensesInitiales: Depense[] = [
  {
    id: "dep-1",
    fournisseur: "Orange",
    montant: 89.9,
    dateEcheance: "2025-12-10",
    statut: "paye",
    note: "Abonnement mobile",
  },
  {
    id: "dep-2",
    fournisseur: "Adobe",
    montant: 62,
    dateEcheance: "2025-12-05",
    statut: "a_payer",
    note: "Creative Cloud",
  },
  {
    id: "dep-3",
    fournisseur: "OVH",
    montant: 129,
    dateEcheance: "2025-12-20",
    statut: "a_payer",
  },
];

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
  if (depense.statut === "a_payer" && isDatePassee(depense.dateEcheance)) {
    return "en_retard";
  }
  return depense.statut;
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
  const [depenses, setDepenses] = useState<Depense[]>(depensesInitiales);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fournisseur: "",
    montant: "",
    dateEcheance: "",
    statut: "a_payer" as DepenseStatut,
    note: "",
  });

  const depensesTriees = useMemo(() => {
    return [...depenses].sort((a, b) => {
      return a.dateEcheance.localeCompare(b.dateEcheance);
    });
  }, [depenses]);

  const resetForm = () => {
    setFormData({
      fournisseur: "",
      montant: "",
      dateEcheance: "",
      statut: "a_payer",
      note: "",
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const montant = Number.parseFloat(formData.montant);
    if (!formData.fournisseur || !formData.dateEcheance || Number.isNaN(montant)) {
      return;
    }

    const nouvelleDepense: Depense = {
      id: globalThis.crypto?.randomUUID?.() ?? `dep-${Date.now()}`,
      fournisseur: formData.fournisseur.trim(),
      montant,
      dateEcheance: formData.dateEcheance,
      statut: formData.statut,
      note: formData.note.trim() || undefined,
    };

    setDepenses((current) => [nouvelleDepense, ...current]);
    resetForm();
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    setDepenses((current) => current.filter((depense) => depense.id !== id));
  };

  const handleVoir = (depense: Depense) => {
    const statutAffiche = getStatutLabel(getStatutAffiche(depense));
    const note = depense.note ? `\nNote : ${depense.note}` : "";
    alert(
      `Fournisseur : ${depense.fournisseur}\nMontant : ${formatMontant(
        depense.montant
      )}\nÉchéance : ${formatDate(depense.dateEcheance)}\nStatut : ${statutAffiche}${note}`
    );
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
                value={formData.fournisseur}
                onChange={(event) =>
                  setFormData({ ...formData, fournisseur: event.target.value })
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
                value={formData.montant}
                onChange={(event) =>
                  setFormData({ ...formData, montant: event.target.value })
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
                value={formData.dateEcheance}
                onChange={(event) =>
                  setFormData({ ...formData, dateEcheance: event.target.value })
                }
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Statut
              </label>
              <select
                value={formData.statut}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    statut: event.target.value as DepenseStatut,
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
              value={formData.note}
              onChange={(event) =>
                setFormData({ ...formData, note: event.target.value })
              }
              rows={3}
              className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
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
        {depensesTriees.length === 0 ? (
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
                        {depense.fournisseur}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatMontant(depense.montant)}
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        {formatDate(depense.dateEcheance)}
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
    </div>
  );
}

