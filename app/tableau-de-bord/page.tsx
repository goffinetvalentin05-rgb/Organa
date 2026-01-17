"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { calculerTotalTTC } from "@/lib/utils/calculations";
import { Users, FileText, Receipt, UserPlus, FilePlus, AlertCircle } from "@/lib/icons";
import Link from "next/link";

interface Client {
  id: string;
}

interface DocumentClient {
  nom?: string;
}

interface DocumentItem {
  id: string;
  numero: string;
  type: "quote" | "invoice";
  statut: string;
  dateCreation: string;
  dateEcheance?: string | null;
  lignes: any[];
  totalTTC?: number;
  client?: DocumentClient;
}

interface Depense {
  id: string;
  fournisseur: string;
  montant: number;
  dateEcheance: string;
  statut: "a_payer" | "paye";
}

type ATraiterItem = {
  id: string;
  type: string;
  nom: string;
  date: string;
  montant?: number;
  href: string;
};

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
    devisEnAttente: 0,
    totalFactures: 0,
    facturesNonPayees: 0,
    elementsEnRetard: 0,
    montantFactureMois: 0,
    montantDepensesMois: 0,
  });

  const [derniersDocuments, setDerniersDocuments] = useState<any[]>([]);
  const [aTraiterMaintenant, setATraiterMaintenant] = useState<ATraiterItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, documentsRes, depensesRes] = await Promise.all([
          fetch("/api/clients", { cache: "no-store" }),
          fetch("/api/documents", { cache: "no-store" }),
          fetch("/api/depenses", { cache: "no-store" }),
        ]);

        const clientsData = clientsRes.ok ? await clientsRes.json() : { clients: [] };
        const documentsData = documentsRes.ok ? await documentsRes.json() : { documents: [] };
        const depensesData = depensesRes.ok ? await depensesRes.json() : { depenses: [] };

        const clients: Client[] = clientsData.clients || [];
        const documents: DocumentItem[] = documentsData.documents || [];
        const depenses: Depense[] = depensesData.depenses || [];

        const devis = documents.filter((doc) => doc.type === "quote");
        const factures = documents.filter((doc) => doc.type === "invoice");

        const facturesMois = factures.filter((facture) =>
          isSameMonth(facture.dateCreation)
        );
        const depensesMois = depenses.filter((depense) =>
          isSameMonth(depense.dateEcheance)
        );

        const devisEnAttente = devis.filter((devisItem) => devisItem.statut === "envoye").length;
        const facturesNonPayees = factures.filter((facture) => facture.statut !== "paye").length;

        const depensesRetard = depenses.filter(
          (depense) => depense.statut === "a_payer" && isPast(depense.dateEcheance)
        );
        const facturesRetard = factures.filter(
          (facture) =>
            (facture.statut === "envoye" || facture.statut === "en-retard") &&
            isPast(facture.dateEcheance || facture.dateCreation)
        );

        setStats({
          totalClients: clients.length,
          totalDevis: devis.length,
          devisEnAttente,
          totalFactures: factures.length,
          facturesNonPayees,
          elementsEnRetard: depensesRetard.length + facturesRetard.length,
          montantFactureMois: facturesMois.reduce(
            (total, facture) => total + getMontantDocument(facture),
            0
          ),
          montantDepensesMois: depensesMois.reduce(
            (total, depense) => total + depense.montant,
            0
          ),
        });

        const tousDocuments = documents
          .map((doc) => ({
            ...doc,
            type: doc.type === "quote" ? "devis" : "facture",
            montant: getMontantDocument(doc),
          }))
          .sort((a, b) => b.dateCreation.localeCompare(a.dateCreation))
          .slice(0, 5);

        setDerniersDocuments(tousDocuments);

        const aTraiter = buildATraiterMaintenant(devis, factures, depenses);
        setATraiterMaintenant(aTraiter);
      } catch (error) {
        console.error("[TableauDeBord] Erreur chargement:", error);
        setStats({
          totalClients: 0,
          totalDevis: 0,
          devisEnAttente: 0,
          totalFactures: 0,
          facturesNonPayees: 0,
          elementsEnRetard: 0,
          montantFactureMois: 0,
          montantDepensesMois: 0,
        });
        setDerniersDocuments([]);
        setATraiterMaintenant([]);
      }
    };

    void loadData();
  }, []);

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "CHF",
    }).format(montant);
  };

  const isSameMonth = (value?: string) => {
    if (!value) return false;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth()
    );
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

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("fr-FR");
  };

  const parseDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const isPast = (value?: string) => {
    const date = parseDate(value);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  };

  const isWithinDays = (value?: string, days = 7) => {
    const date = parseDate(value);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(today.getDate() + days);
    return date.getTime() >= today.getTime() && date.getTime() <= limit.getTime();
  };

  const isOlderThanDays = (value?: string, days = 7) => {
    const date = parseDate(value);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(today.getDate() - days);
    return date.getTime() <= limit.getTime();
  };

  const getMontantDocument = (doc: DocumentItem) => {
    if (typeof doc.totalTTC === "number") {
      return doc.totalTTC;
    }
    return calculerTotalTTC(doc.lignes || []);
  };

  const buildATraiterMaintenant = (
    devis: DocumentItem[],
    factures: DocumentItem[],
    depenses: Depense[]
  ): ATraiterItem[] => {
    const items: ATraiterItem[] = [];

    depenses.forEach((depense) => {
      if (depense.statut !== "a_payer") return;
      if (!isPast(depense.dateEcheance) && !isWithinDays(depense.dateEcheance, 7)) {
        return;
      }
      items.push({
        id: `depense-${depense.id}`,
        type: "Dépense",
        nom: depense.fournisseur,
        date: depense.dateEcheance,
        montant: depense.montant,
        href: "/tableau-de-bord/depenses",
      });
    });

    factures.forEach((facture) => {
      if (facture.statut !== "envoye" && facture.statut !== "en-retard") return;
      const dateRef = facture.dateEcheance || facture.dateCreation;
      if (!isPast(dateRef) && !isWithinDays(dateRef, 7)) return;
      items.push({
        id: `facture-${facture.id}`,
        type: "Facture",
        nom: facture.client?.nom || "Client inconnu",
        date: dateRef || facture.dateCreation,
        montant: getMontantDocument(facture),
        href: `/tableau-de-bord/factures/${facture.id}`,
      });
    });

    devis.forEach((devisItem) => {
      if (devisItem.statut !== "envoye") return;
      if (!isOlderThanDays(devisItem.dateCreation, 7)) return;
      items.push({
        id: `devis-${devisItem.id}`,
        type: "Devis",
        nom: devisItem.client?.nom || "Client inconnu",
        date: devisItem.dateEcheance || devisItem.dateCreation,
        montant: getMontantDocument(devisItem),
        href: `/tableau-de-bord/devis/${devisItem.id}`,
      });
    });

    return items.sort((a, b) => a.date.localeCompare(b.date));
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
          className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200"
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
          className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200"
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
          className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200"
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
          className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-red-500/30 transition-all duration-200"
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
            className="btn-primary px-6 py-3 accent-bg text-white rounded-lg transition-all duration-200 flex items-center gap-2 hover:opacity-90"
          >
            <FilePlus className="w-4 h-4" />
            Nouveau devis
          </Link>
          <Link
            href="/tableau-de-bord/factures/nouvelle"
            className="btn-primary px-6 py-3 accent-bg text-white rounded-lg transition-all duration-200 flex items-center gap-2 hover:opacity-90"
          >
            <FilePlus className="w-4 h-4" />
            Nouvelle facture
          </Link>
          <Link
            href="/tableau-de-bord/clients/nouveau"
            className="btn-primary px-6 py-3 accent-bg text-white rounded-lg transition-all duration-200 flex items-center gap-2 hover:opacity-90"
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




