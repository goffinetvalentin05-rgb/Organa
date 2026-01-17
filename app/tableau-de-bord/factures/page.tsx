"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { calculerTotalTTC } from "@/lib/utils/calculations";
import { Eye, Trash, Plus } from "@/lib/icons";

interface Facture {
  id: string;
  numero: string;
  client?: { nom?: string };
  lignes: any[];
  statut: string;
  dateCreation: string;
}

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadFactures();
  }, []);

  const loadFactures = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/documents?type=invoice", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des factures");
      }
      const data = await response.json();
      setFactures(data.documents || []);
    } catch (error: any) {
      setErrorMessage(error?.message || "Erreur lors du chargement des factures");
      setFactures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;
    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la facture");
      }
      await loadFactures();
    } catch (error) {
      console.error(error);
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "CHF",
    }).format(montant);
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: "bg-gray-500/20 text-gray-300",
      envoye: "bg-blue-500/20 text-blue-300",
      paye: "bg-green-500/20 text-green-300",
      "en-retard": "bg-red-500/20 text-red-300",
    };
    return colors[statut] || "bg-gray-500/20 text-gray-300";
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      envoye: "Envoyée",
      paye: "Payée",
      "en-retard": "En retard",
    };
    return labels[statut] || statut;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Factures</h1>
          <p className="mt-2 text-secondary">
            Gérez vos factures et suivez les paiements
          </p>
        </div>
        <Link
          href="/tableau-de-bord/factures/nouvelle"
          className="px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Créer une facture
        </Link>
      </div>

      {/* Liste */}
      <div className="rounded-xl border border-subtle bg-surface overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-secondary">Chargement...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-12 text-center">
            <p className="text-red-400 mb-2">Erreur lors du chargement</p>
            <p className="text-secondary text-sm">{errorMessage}</p>
          </div>
        ) : factures.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-secondary mb-4">Aucune facture pour le moment</p>
            <Link
              href="/tableau-de-bord/factures/nouvelle"
              className="inline-block px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all"
            >
              Créer votre première facture
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-subtle">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                    Numéro
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-primary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {factures.map((facture) => {
                  const montant = calculerTotalTTC(facture.lignes);
                  return (
                    <tr
                      key={facture.id}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">
                        {facture.numero}
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        {facture.client?.nom || "Client inconnu"}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatMontant(montant)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(
                            facture.statut
                          )}`}
                        >
                          {getStatutLabel(facture.statut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        {facture.dateCreation}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/tableau-de-bord/factures/${facture.id}`}
                            className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface text-secondary hover:text-white transition-all text-sm flex items-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </Link>
                          <button
                            onClick={() => handleDelete(facture.id)}
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



























