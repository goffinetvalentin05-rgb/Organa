"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  clientsAPI,
  devisAPI,
  facturesAPI,
  calculerTotalTTC,
} from "@/lib/mock-data";
import { Users, FileText, Receipt, AlertCircle, UserPlus, FilePlus } from "@/lib/icons";

function CheckoutHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Vérifier si on revient d'un checkout réussi
    const checkout = searchParams?.get("checkout");
    if (checkout === "success") {
      toast.success("Paiement réussi ! Votre compte est maintenant Pro.");
      // Nettoyer l'URL
      router.replace("/tableau-de-bord");
    }
  }, [searchParams, router]);

  return null;
}

export default function TableauDeBordPage() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalDevis: 0,
    totalFactures: 0,
    devisEnAttente: 0,
    facturesPayees: 0,
    facturesEnRetard: 0,
  });

  const [derniersDocuments, setDerniersDocuments] = useState<any[]>([]);

  useEffect(() => {
    const clients = clientsAPI.getAll();
    const devis = devisAPI.getAll();
    const factures = facturesAPI.getAll();

    const devisEnAttente = devis.filter(
      (d) => d.statut === "envoye" || d.statut === "brouillon"
    ).length;
    const facturesPayees = factures.filter((f) => f.statut === "paye").length;
    const facturesEnRetard = factures.filter(
      (f) => f.statut === "en-retard"
    ).length;

    setStats({
      totalClients: clients.length,
      totalDevis: devis.length,
      totalFactures: factures.length,
      devisEnAttente,
      facturesPayees,
      facturesEnRetard,
    });

    // Derniers documents (devis + factures)
    const tousDocuments = [
      ...devis.map((d) => ({
        ...d,
        type: "devis",
        montant: calculerTotalTTC(d.lignes),
      })),
      ...factures.map((f) => ({
        ...f,
        type: "facture",
        montant: calculerTotalTTC(f.lignes),
      })),
    ]
      .sort((a, b) => b.dateCreation.localeCompare(a.dateCreation))
      .slice(0, 5);

    setDerniersDocuments(tousDocuments);
  }, []);

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "CHF",
    }).format(montant);
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: "bg-surface-hover text-secondary",
      envoye: "bg-accent-light text-accent",
      accepte: "bg-success-bg text-success",
      refuse: "bg-error-bg text-error",
      paye: "bg-success-bg text-success",
      "en-retard": "bg-error-bg text-error",
    };
    return colors[statut] || "bg-surface-hover text-secondary";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Suspense fallback={null}>
        <CheckoutHandler />
      </Suspense>
      {/* En-tête */}
      <div className="relative">
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2 text-primary">
          Tableau de bord
        </h1>
        <p className="font-body text-sm text-secondary font-normal">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">Clients</span>
            <Users className="w-6 h-6 text-secondary" />
          </div>
          <div className="font-heading text-4xl font-bold text-primary">
            {stats.totalClients}
          </div>
        </div>

        <div className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">Devis</span>
            <FileText className="w-6 h-6 text-secondary" />
          </div>
          <div className="font-heading text-4xl font-bold text-primary">
            {stats.totalDevis}
          </div>
          {stats.devisEnAttente > 0 && (
            <div className="mt-3 font-body text-sm accent font-medium">
              {stats.devisEnAttente} en attente
            </div>
          )}
        </div>

        <div className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">Factures</span>
            <Receipt className="w-6 h-6 text-secondary" />
          </div>
          <div className="font-heading text-4xl font-bold text-primary">
            {stats.totalFactures}
          </div>
          <div className="mt-3 font-body text-sm" style={{ color: 'var(--success)' }}>
            {stats.facturesPayees} payées
          </div>
        </div>

        <div className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-red-500/30 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">En retard</span>
            <div style={{ color: 'var(--error)' }}>
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="font-heading text-4xl font-bold" style={{ color: 'var(--error)' }}>
            {stats.facturesEnRetard}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="rounded-xl border border-subtle bg-surface p-8">
        <h2 className="font-heading text-2xl font-semibold mb-6 text-primary">
          Actions rapides
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/tableau-de-bord/devis/nouveau"
            className="btn-primary px-6 py-3 accent-bg hover:bg-accent-hover text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <FilePlus className="w-4 h-4" />
            Nouveau devis
          </Link>
          <Link
            href="/tableau-de-bord/factures/nouvelle"
            className="btn-primary px-6 py-3 accent-bg hover:bg-accent-hover text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <FilePlus className="w-4 h-4" />
            Nouvelle facture
          </Link>
          <Link
            href="/tableau-de-bord/clients/nouveau"
            className="btn-primary px-6 py-3 accent-bg hover:bg-accent-hover text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Nouveau client
          </Link>
        </div>
      </div>

      {/* Derniers documents */}
      <div className="rounded-xl border border-subtle bg-surface p-8">
        <h2 className="font-heading text-2xl font-semibold mb-6 text-primary">
          Derniers documents
        </h2>
        {derniersDocuments.length === 0 ? (
          <p className="font-body text-secondary text-lg font-normal">Aucun document pour le moment</p>
        ) : (
          <div className="space-y-3">
            {derniersDocuments.map((doc) => (
              <Link
                key={`${doc.type}-${doc.id}`}
                href={`/tableau-de-bord/${doc.type === "devis" ? "devis" : "factures"}/${doc.id}`}
                className="flex items-center justify-between p-5 rounded-lg border border-subtle bg-surface-hover hover:border-accent-border transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  {doc.type === "devis" ? (
                    <FileText className="w-5 h-5 text-secondary" />
                  ) : (
                    <Receipt className="w-5 h-5 text-secondary" />
                  )}
                  <div>
                    <div className="font-body font-semibold text-lg text-primary">{doc.numero}</div>
                    <div className="font-body text-sm text-secondary">
                      {doc.client?.nom || "Client inconnu"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-body font-bold text-lg text-primary">{formatMontant(doc.montant)}</div>
                    <div className="font-body text-xs text-tertiary">{doc.dateCreation}</div>
                  </div>
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold ${getStatutColor(
                      doc.statut
                    )}`}
                  >
                    {doc.statut}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
