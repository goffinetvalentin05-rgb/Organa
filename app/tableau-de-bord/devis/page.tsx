"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  devisAPI,
  clientsAPI,
  calculerTotalTTC,
  Devis,
} from "@/lib/mock-data";

export default function DevisPage() {
  const router = useRouter();
  const [devis, setDevis] = useState<Devis[]>([]);

  useEffect(() => {
    loadDevis();
  }, []);

  const loadDevis = () => {
    setDevis(devisAPI.getAll());
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) {
      devisAPI.delete(id);
      loadDevis();
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
      accepte: "bg-green-500/20 text-green-300",
      refuse: "bg-red-500/20 text-red-300",
    };
    return colors[statut] || "bg-gray-500/20 text-gray-300";
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      envoye: "Envoyé",
      accepte: "Accepté",
      refuse: "Refusé",
    };
    return labels[statut] || statut;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devis</h1>
          <p className="mt-2 text-white/70">
            Gérez vos devis et propositions commerciales
          </p>
        </div>
        <Link
          href="/tableau-de-bord/devis/nouveau"
          className="px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
        >
          ➕ Créer un devis
        </Link>
      </div>

      {/* Liste */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        {devis.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/70 mb-4">Aucun devis pour le moment</p>
            <Link
              href="/tableau-de-bord/devis/nouveau"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
            >
              Créer votre premier devis
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
                {devis.map((devisItem) => {
                  const montant = calculerTotalTTC(devisItem.lignes);
                  return (
                    <tr
                      key={devisItem.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">
                        {devisItem.numero}
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        {devisItem.client?.nom || "Client inconnu"}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatMontant(montant)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(
                            devisItem.statut
                          )}`}
                        >
                          {getStatutLabel(devisItem.statut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        {devisItem.dateCreation}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/tableau-de-bord/devis/${devisItem.id}`}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-sm"
                          >
                            👁️ Voir
                          </Link>
                          <button
                            onClick={() => handleDelete(devisItem.id)}
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



















