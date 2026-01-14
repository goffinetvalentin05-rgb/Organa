"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  clientsAPI,
  devisAPI,
  facturesAPI,
  depensesAPI,
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
    facturesNonPayees: 0,
    elementsEnRetard: 0,
  });

  const [derniersDocuments, setDerniersDocuments] = useState<any[]>([]);
  const [aTraiterMaintenant, setATraiterMaintenant] = useState<any[]>([]);

  useEffect(() => {
    const clients = clientsAPI.getAll();
    const devis = devisAPI.getAll();
    const factures = facturesAPI.getAll();
    const depenses = depensesAPI.getAll();

    const devisEnAttente = devis.filter(
      (d) => d.statut === "envoye" || d.statut === "brouillon"
    ).length;
    const facturesNonPayees = factures.filter(
      (f) => f.statut === "envoye" || f.statut === "en-retard"
    ).length;
    const depensesEnRetard = depenses.filter(
      (d) => d.statut === "a_payer" && isDatePassee(d.dateEcheance)
    );
    const facturesEnRetard = factures.filter(
      (f) =>
        (f.statut === "envoye" || f.statut === "en-retard") &&
        isDatePassee(f.dateEcheance)
    );

    setStats({
      totalClients: clients.length,
      totalDevis: devis.length,
      totalFactures: factures.length,
      devisEnAttente,
      facturesNonPayees,
      elementsEnRetard: depensesEnRetard.length + facturesEnRetard.length,
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

    const depensesUrgentes = depensesEnRetard
      .sort((a, b) => a.dateEcheance.localeCompare(b.dateEcheance))
      .map((depense) => ({
        id: `depense-${depense.id}`,
        type: "Dépense",
        nom: depense.fournisseur,
        montant: depense.montant,
        date: depense.dateEcheance,
        href: "/tableau-de-bord/depenses",
      }));

    const facturesUrgentes = factures
      .filter((facture) => facture.statut === "envoye" || facture.statut === "en-retard")
      .sort((a, b) =>
        (a.dateEcheance || a.dateCreation).localeCompare(b.dateEcheance || b.dateCreation)
      )
      .map((facture) => ({
        id: `facture-${facture.id}`,
        type: "Facture",
        nom: facture.client?.nom || "Client inconnu",
        montant: calculerTotalTTC(facture.lignes),
        date: facture.dateEcheance || facture.dateCreation,
        href: `/tableau-de-bord/factures/${facture.id}`,
      }));

    const devisSansReponse = devis
      .filter(
        (devisItem) =>
          devisItem.statut === "envoye" && isDateAncienne(devisItem.dateCreation, 7)
      )
      .sort((a, b) => a.dateCreation.localeCompare(b.dateCreation))
      .map((devisItem) => ({
        id: `devis-${devisItem.id}`,
        type: "Devis",
        nom: devisItem.client?.nom || "Client inconnu",
        montant: calculerTotalTTC(devisItem.lignes),
        date: devisItem.dateEcheance || devisItem.dateCreation,
        href: `/tableau-de-bord/devis/${devisItem.id}`,
      }));

    setATraiterMaintenant(
      [...depensesUrgentes, ...facturesUrgentes, ...devisSansReponse].slice(0, 5)
    );
  }, []);

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

  const isDatePassee = (value?: string) => {
    if (!value) return false;
    const date = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  };

  const isDateAncienne = (value?: string, days = 7) => {
    if (!value) return false;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(today.getDate() - days);
    return date.getTime() <= limit.getTime();
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
        <Link
          href="/tableau-de-bord/clients"
          className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">Clients</span>
            <Users className="w-6 h-6 text-secondary" />
          </div>
          <div className="font-heading text-4xl font-bold text-primary">
            {stats.totalClients}
          </div>
          {stats.totalClients === 0 && (
            <div className="mt-3 font-body text-sm text-secondary">
              Tout est prêt pour démarrer
            </div>
          )}
        </Link>

        <Link
          href="/tableau-de-bord/devis?statut=en-attente"
          className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200 hover:shadow-lg"
        >
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
          {stats.devisEnAttente === 0 && (
            <div className="mt-3 font-body text-sm text-secondary">
              Tout est à jour
            </div>
          )}
        </Link>

        <Link
          href="/tableau-de-bord/factures?statut=non-payees"
          className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">Factures</span>
            <Receipt className="w-6 h-6 text-secondary" />
          </div>
          <div className="font-heading text-4xl font-bold text-primary">
            {stats.totalFactures}
          </div>
          {stats.facturesNonPayees > 0 ? (
            <div className="mt-3 font-body text-sm" style={{ color: "var(--error)" }}>
              {stats.facturesNonPayees} non payées
            </div>
          ) : (
            <div className="mt-3 font-body text-sm text-secondary">
              Tout est à jour
            </div>
          )}
        </Link>

        <Link
          href="/tableau-de-bord/a-ne-pas-oublier"
          className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-red-500/30 transition-all duration-200 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">En retard</span>
            <div style={{ color: 'var(--error)' }}>
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="font-heading text-4xl font-bold" style={{ color: 'var(--error)' }}>
            {stats.elementsEnRetard}
          </div>
          {stats.elementsEnRetard === 0 && (
            <div className="mt-3 font-body text-sm text-secondary">
              Tout est à jour
            </div>
          )}
        </Link>
      </div>

      {/* À traiter maintenant */}
      <div className="rounded-xl border border-subtle bg-surface p-8">
        <h2 className="font-heading text-2xl font-semibold mb-6 text-primary">
          À traiter maintenant
        </h2>
        {aTraiterMaintenant.length === 0 ? (
          <p className="font-body text-secondary text-lg font-normal">
            Rien d&apos;urgent pour le moment
          </p>
        ) : (
          <div className="space-y-3">
            {aTraiterMaintenant.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between p-5 rounded-lg border border-subtle bg-surface-hover hover:border-accent-border transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="font-body text-xs uppercase tracking-wide text-secondary">
                    {item.type}
                  </div>
                  <div>
                    <div className="font-body font-semibold text-lg text-primary">
                      {item.nom}
                    </div>
                    <div className="font-body text-sm text-secondary">
                      Échéance : {formatDate(item.date)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {typeof item.montant === "number" && (
                    <div className="font-body font-bold text-lg text-primary">
                      {formatMontant(item.montant)}
                    </div>
                  )}
                  <div className="font-body text-xs text-tertiary">Voir le détail</div>
                </div>
              </Link>
            ))}
          </div>
        )}
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
