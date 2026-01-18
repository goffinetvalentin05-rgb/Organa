"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { calculerTotalTTC } from "@/lib/utils/calculations";
import {
  Users,
  FileText,
  Receipt,
  UserPlus,
  FilePlus,
  AlertCircle,
  Calendar,
  CheckCircle,
  ArrowRight,
} from "@/lib/icons";
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
  const [suiviCalendrier, setSuiviCalendrier] = useState<ATraiterItem[]>([]);

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

        const suivi = buildSuiviCalendrier(devis, factures, depenses);
        setSuiviCalendrier(suivi);
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
        setSuiviCalendrier([]);
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

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      envoye: "Envoyé",
      accepte: "Accepté",
      refuse: "Refusé",
      paye: "Payé",
      "en-retard": "En retard",
    };
    return labels[statut] || statut;
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

  const buildSuiviCalendrier = (
    devis: DocumentItem[],
    factures: DocumentItem[],
    depenses: Depense[]
  ): ATraiterItem[] => {
    const items: ATraiterItem[] = [];

    depenses.forEach((depense) => {
      if (depense.statut !== "a_payer") return;
      if (isPast(depense.dateEcheance) || !isWithinDays(depense.dateEcheance, 30)) {
        return;
      }
      items.push({
        id: `suivi-depense-${depense.id}`,
        type: "Échéance dépense",
        nom: depense.fournisseur,
        date: depense.dateEcheance,
        montant: depense.montant,
        href: "/tableau-de-bord/depenses",
      });
    });

    factures.forEach((facture) => {
      if (facture.statut !== "envoye" && facture.statut !== "en-retard") return;
      const dateRef = facture.dateEcheance || facture.dateCreation;
      if (isPast(dateRef) || !isWithinDays(dateRef, 30)) return;
      items.push({
        id: `suivi-facture-${facture.id}`,
        type: "Relance facture",
        nom: facture.client?.nom || "Client inconnu",
        date: dateRef || facture.dateCreation,
        montant: getMontantDocument(facture),
        href: `/tableau-de-bord/factures/${facture.id}`,
      });
    });

    devis.forEach((devisItem) => {
      if (devisItem.statut !== "envoye") return;
      if (isPast(devisItem.dateCreation) || !isWithinDays(devisItem.dateCreation, 30)) return;
      items.push({
        id: `suivi-devis-${devisItem.id}`,
        type: "Relance devis",
        nom: devisItem.client?.nom || "Client inconnu",
        date: devisItem.dateEcheance || devisItem.dateCreation,
        montant: getMontantDocument(devisItem),
        href: `/tableau-de-bord/devis/${devisItem.id}`,
      });
    });

    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <Suspense fallback={null}>
        <CheckoutHandler />
      </Suspense>
      {/* En-tête */}
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2 text-primary">
          Tableau de bord
          </h1>
          <p className="font-body text-sm text-secondary font-normal">
            Une vue claire pour piloter vos documents et vos échéances.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-subtle bg-surface px-4 py-2 text-xs text-secondary">
          <CheckCircle className="w-4 h-4 text-success" />
          <span>Votre activité est sous contrôle</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/tableau-de-bord/clients"
          className="group relative rounded-[24px] border border-subtle bg-surface p-6 shadow-premium hover:shadow-premium-hover hover:border-accent-border transition-all duration-200"
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
          className="group relative rounded-[24px] border border-subtle bg-surface p-6 shadow-premium hover:shadow-premium-hover hover:border-accent-border transition-all duration-200"
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
          className="group relative rounded-[24px] border border-subtle bg-surface p-6 shadow-premium hover:shadow-premium-hover hover:border-accent-border transition-all duration-200"
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
          className="group relative rounded-[24px] border border-subtle bg-surface p-6 shadow-premium hover:shadow-premium-hover hover:border-red-500/30 transition-all duration-200"
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
      <div className="rounded-[32px] border border-subtle bg-gradient-to-br from-white via-[#F5F8FF] to-[#E0E7FF] p-8 shadow-premium">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="font-heading text-2xl font-semibold text-primary">
            À traiter maintenant
          </h2>
          <span className="text-xs uppercase tracking-[0.25em] text-tertiary">
            Zone prioritaire
          </span>
        </div>
        {aTraiterMaintenant.length === 0 ? (
          <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-subtle bg-surface px-5 py-4 text-secondary">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="font-body text-sm">
              Rien d&apos;urgent pour le moment. Vous gardez la main.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {aTraiterMaintenant.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col gap-4 rounded-[24px] border border-subtle bg-surface p-6 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-body text-xs uppercase tracking-wide text-secondary">
                      {item.type}
                    </div>
                    <div className="font-body font-semibold text-lg text-primary">
                      {item.nom}
                    </div>
                    <div className="font-body text-sm text-secondary">
                      Échéance : {formatDate(item.date)}
                    </div>
                  </div>
                  {typeof item.montant === "number" && (
                    <div className="text-right">
                      <div className="font-body font-bold text-lg text-primary">
                        {formatMontant(item.montant)}
                      </div>
                      <div className="font-body text-xs text-tertiary">Voir le détail</div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Suivi & calendrier */}
      <div className="rounded-[28px] border border-subtle bg-surface p-8 shadow-premium">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-primary">
              Suivi &amp; calendrier
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Reliez vos documents à des actions planifiées pour garder une vision claire.
            </p>
          </div>
          <Link
            href="/tableau-de-bord/calendrier"
            className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-light px-4 py-2 text-xs font-semibold text-primary transition-all hover:opacity-90"
          >
            <Calendar className="w-4 h-4" />
            Ouvrir le calendrier
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {suiviCalendrier.length === 0 ? (
          <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-subtle bg-surface px-5 py-4 text-secondary">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="font-body text-sm">
              Aucun rappel planifié dans les 30 prochains jours. Ajoutez-en si besoin.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {suiviCalendrier.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col gap-3 rounded-[24px] border border-subtle bg-surface p-6 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-tertiary">
                      {item.type}
                    </div>
                    <div className="text-base font-semibold text-primary">{item.nom}</div>
                    <div className="text-sm text-secondary">
                      Planifié le {formatDate(item.date)}
                    </div>
                  </div>
                  {typeof item.montant === "number" && (
                    <div className="text-right">
                      <div className="text-base font-semibold text-primary">
                        {formatMontant(item.montant)}
                      </div>
                      <div className="text-xs text-tertiary">Accéder</div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="rounded-[28px] border border-subtle bg-surface p-8 shadow-premium">
        <h2 className="font-heading text-2xl font-semibold mb-6 text-primary">
          Actions rapides
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/tableau-de-bord/devis/nouveau"
            className="group flex flex-col gap-3 rounded-[24px] border border-subtle bg-surface p-6 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">Nouveau devis</span>
              <FilePlus className="w-5 h-5 text-secondary group-hover:text-primary" />
            </div>
            <p className="text-sm text-secondary">
              Préparez un devis clair, prêt à être envoyé.
            </p>
          </Link>
          <Link
            href="/tableau-de-bord/factures/nouvelle"
            className="group flex flex-col gap-3 rounded-[24px] border border-subtle bg-surface p-6 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">Nouvelle facture</span>
              <FilePlus className="w-5 h-5 text-secondary group-hover:text-primary" />
            </div>
            <p className="text-sm text-secondary">
              Gardez un suivi précis des paiements attendus.
            </p>
          </Link>
          <Link
            href="/tableau-de-bord/clients/nouveau"
            className="group flex flex-col gap-3 rounded-[24px] border border-subtle bg-surface p-6 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">Nouveau client</span>
              <UserPlus className="w-5 h-5 text-secondary group-hover:text-primary" />
            </div>
            <p className="text-sm text-secondary">
              Centralisez vos contacts dans un espace unique.
            </p>
          </Link>
        </div>
      </div>

      {/* Derniers documents */}
      <div className="rounded-[28px] border border-subtle bg-surface p-8 shadow-premium">
        <h2 className="font-heading text-2xl font-semibold mb-6 text-primary">
          Derniers documents
        </h2>
        {derniersDocuments.length === 0 ? (
          <p className="font-body text-secondary text-lg font-normal">
            Aucun document pour le moment.
          </p>
        ) : (
          <div className="space-y-4">
            {derniersDocuments.map((doc) => (
              <Link
                key={`${doc.type}-${doc.id}`}
                href={`/tableau-de-bord/${doc.type === "devis" ? "devis" : "factures"}/${doc.id}`}
                className="flex flex-col gap-4 rounded-[24px] border border-subtle bg-surface p-6 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
              >
                <div className="flex items-start justify-between gap-4">
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
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold ${getStatutColor(
                      doc.statut
                    )}`}
                  >
                    {getStatutLabel(doc.statut)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-secondary">
                  <span>Créé le {formatDate(doc.dateCreation)}</span>
                  <span className="text-base font-semibold text-primary">
                    {formatMontant(doc.montant)}
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




