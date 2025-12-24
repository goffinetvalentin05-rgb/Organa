"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  facturesAPI,
  clientsAPI,
  calculerTotalTTC,
  Facture,
} from "@/lib/mock-data";

export default function FacturesPage() {
  const router = useRouter();
  const [factures, setFactures] = useState<Facture[]>([]);

  useEffect(() => {
    loadFactures();
  }, []);

  const loadFactures = () => {
    setFactures(facturesAPI.getAll());
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      facturesAPI.delete(id);
      loadFactures();
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
          <p className="mt-2 text-white/70">
            Gérez vos factures et suivez les paiements
          </p>
        </div>
        <Link
          href="/tableau-de-bord/factures/nouvelle"
          className="px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
        >
          ➕ Créer une facture
        </Link>
      </div>

      {/* Liste */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        {factures.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/70 mb-4">Aucune facture pour le moment</p>
            <Link
              href="/tableau-de-bord/factures/nouvelle"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
            >
              Créer votre première facture
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Numéro
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/90">
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
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">
                        {facture.numero}
                      </td>
                      <td className="px-6 py-4 text-white/70">
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
                      <td className="px-6 py-4 text-white/70">
                        {facture.dateCreation}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/tableau-de-bord/factures/${facture.id}`}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-sm"
                          >
                            👁️ Voir
                          </Link>
                          <button
                            onClick={() => handleDelete(facture.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all text-sm"
                          >
                            🗑️
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
















