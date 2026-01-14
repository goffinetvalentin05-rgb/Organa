"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calculerTotalTTC, depensesAPI, devisAPI, facturesAPI, Depense, Devis, Facture } from "@/lib/mock-data";
import { Eye } from "@/lib/icons";

type RappelItem = {
  id: string;
  type: "Dépense" | "Facture" | "Devis";
  nom: string;
  montant: number;
  dateEcheance: string;
  href: string;
};

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

const startOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isPast = (value?: string) => {
  const date = parseDate(value);
  if (!date) return false;
  return date.getTime() < startOfDay(new Date()).getTime();
};

const isWithinDays = (value?: string, days = 7) => {
  const date = parseDate(value);
  if (!date) return false;
  const today = startOfDay(new Date());
  const limit = new Date(today);
  limit.setDate(today.getDate() + days);
  return date.getTime() >= today.getTime() && date.getTime() <= limit.getTime();
};

const isOlderThanDays = (value?: string, days = 7) => {
  const date = parseDate(value);
  if (!date) return false;
  const today = startOfDay(new Date());
  const limit = new Date(today);
  limit.setDate(today.getDate() - days);
  return date.getTime() <= limit.getTime();
};

export default function ANePasOublierPage() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);

  useEffect(() => {
    setDepenses(depensesAPI.getAll());
    setFactures(facturesAPI.getAll());
    setDevis(devisAPI.getAll());
  }, []);

  const enRetard = useMemo<RappelItem[]>(() => {
    const depensesRetard = depenses
      .filter((depense) => depense.statut === "a_payer" && isPast(depense.dateEcheance))
      .map((depense) => ({
        id: `depense-${depense.id}`,
        type: "Dépense" as const,
        nom: depense.fournisseur,
        montant: depense.montant,
        dateEcheance: depense.dateEcheance,
        href: "/tableau-de-bord/depenses",
      }));

    const facturesRetard = factures
      .filter(
        (facture) =>
          (facture.statut === "envoye" || facture.statut === "en-retard") &&
          isPast(facture.dateEcheance)
      )
      .map((facture) => ({
        id: `facture-${facture.id}`,
        type: "Facture" as const,
        nom: facture.client?.nom || "Client inconnu",
        montant: calculerTotalTTC(facture.lignes),
        dateEcheance: facture.dateEcheance || facture.dateCreation,
        href: `/tableau-de-bord/factures/${facture.id}`,
      }));

    return [...depensesRetard, ...facturesRetard].sort((a, b) =>
      a.dateEcheance.localeCompare(b.dateEcheance)
    );
  }, [depenses, factures]);

  const aVenir = useMemo<RappelItem[]>(() => {
    const depensesProches = depenses
      .filter((depense) => depense.statut === "a_payer" && isWithinDays(depense.dateEcheance, 7))
      .map((depense) => ({
        id: `depense-${depense.id}`,
        type: "Dépense" as const,
        nom: depense.fournisseur,
        montant: depense.montant,
        dateEcheance: depense.dateEcheance,
        href: "/tableau-de-bord/depenses",
      }));

    const devisSansReponse = devis
      .filter((devisItem) => devisItem.statut === "envoye" && isOlderThanDays(devisItem.dateCreation, 7))
      .map((devisItem) => ({
        id: `devis-${devisItem.id}`,
        type: "Devis" as const,
        nom: devisItem.client?.nom || "Client inconnu",
        montant: calculerTotalTTC(devisItem.lignes),
        dateEcheance: devisItem.dateEcheance || devisItem.dateCreation,
        href: `/tableau-de-bord/devis/${devisItem.id}`,
      }));

    return [...depensesProches, ...devisSansReponse].sort((a, b) =>
      a.dateEcheance.localeCompare(b.dateEcheance)
    );
  }, [depenses, devis]);

  const afficherTableau = (items: RappelItem[]) => {
    if (items.length === 0) {
      return (
        <div className="p-6 text-sm text-white/60">
          Aucun élément à afficher pour le moment.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                Type
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                Nom
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                Montant
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                Date d&apos;échéance
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-white/90">
                Lien
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80">
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">{item.nom}</td>
                <td className="px-6 py-4 font-semibold">
                  {formatMontant(item.montant)}
                </td>
                <td className="px-6 py-4 text-white/70">
                  {formatDate(item.dateEcheance)}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const rienAAfficher = enRetard.length === 0 && aVenir.length === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">À ne pas oublier</h1>
        <p className="mt-2 text-white/70">
          Une vue claire et priorisée de ce qui nécessite votre attention.
        </p>
      </div>

      {rienAAfficher && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm text-white/70">
          Tout est à jour. Rien d&apos;urgent pour le moment.
        </div>
      )}

      <div className="space-y-6">
        <section className="rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-500/20">
            <h2 className="text-lg font-semibold text-white">
              🔴 Priorité — En retard
            </h2>
            <p className="text-sm text-white/70 mt-1">
              Éléments dont la date d&apos;échéance est dépassée.
            </p>
          </div>
          {afficherTableau(enRetard)}
        </section>

        <section className="rounded-xl border border-orange-500/30 bg-orange-500/10 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-orange-500/20">
            <h2 className="text-lg font-semibold text-white">
              🟠 À venir prochainement
            </h2>
            <p className="text-sm text-white/70 mt-1">
              Dépenses à payer bientôt et devis envoyés sans réponse.
            </p>
          </div>
          {afficherTableau(aVenir)}
        </section>
      </div>
    </div>
  );
}

