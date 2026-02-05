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
  CheckCircle,
  ArrowRight,
} from "@/lib/icons";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";

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
  numero: string;
  client: string;
  date: string;
  montant: number;
  statutLabel: string;
  statutColor: string;
  href: string;
};

function CheckoutHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  useEffect(() => {
    const checkout = searchParams?.get("checkout");
    if (checkout === "success") {
      toast.success(t("dashboard.overview.checkoutSuccess"));
      router.replace("/tableau-de-bord");
    }
  }, [searchParams, router, t]);

  return null;
}

export default function TableauDeBordPage() {
  const { t, locale } = useI18n();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalDevis: 0,
    devisEnAttente: 0,
    devisPayes: 0,
    devisEnRetard: 0,
    totalFactures: 0,
    facturesNonPayees: 0,
    montantFactureMois: 0,
    montantDepensesMois: 0,
    montantCotisationsPayees: 0,
    soldeClub: 0,
  });

  const [derniersDocuments, setDerniersDocuments] = useState<any[]>([]);
  const [aTraiterMaintenant, setATraiterMaintenant] = useState<ATraiterItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        const devisPayes = devis.filter((devisItem) => devisItem.statut === "accepte" || devisItem.statut === "paye").length;
        const devisEnRetard = devis.filter((devisItem) => {
          if (devisItem.statut === "accepte" || devisItem.statut === "paye") return false;
          if (!devisItem.dateEcheance) return false;
          return isPast(devisItem.dateEcheance);
        }).length;
        const facturesNonPayees = factures.filter((facture) => facture.statut !== "paye").length;
        
        // Calcul du montant des cotisations payées
        const montantCotisationsPayees = devis
          .filter((d) => d.statut === "accepte" || d.statut === "paye")
          .reduce((total, d) => total + getMontantDocument(d), 0);
        
        // Calcul du montant des factures payées
        const montantFacturesPayees = factures
          .filter((f) => f.statut === "paye")
          .reduce((total, f) => total + getMontantDocument(f), 0);
        
        // Calcul du total des charges payées
        const totalChargesPayees = depenses
          .filter((d) => d.statut === "paye")
          .reduce((total, d) => total + d.montant, 0);
        
        // Solde du club = cotisations payées + factures payées - charges payées
        const soldeClub = montantCotisationsPayees + montantFacturesPayees - totalChargesPayees;

        setStats({
          totalClients: clients.length,
          totalDevis: devis.length,
          devisEnAttente,
          devisPayes,
          devisEnRetard,
          totalFactures: factures.length,
          facturesNonPayees,
          montantFactureMois: facturesMois.reduce(
            (total, facture) => total + getMontantDocument(facture),
            0
          ),
          montantDepensesMois: depensesMois.reduce(
            (total, depense) => total + depense.montant,
            0
          ),
          montantCotisationsPayees,
          soldeClub,
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

        const aTraiter = buildATraiterMaintenant(factures);
        setATraiterMaintenant(aTraiter);

      } catch (error) {
        console.error("[TableauDeBord] Erreur chargement:", error);
        setStats({
          totalClients: 0,
          totalDevis: 0,
          devisEnAttente: 0,
          devisPayes: 0,
          devisEnRetard: 0,
          totalFactures: 0,
          facturesNonPayees: 0,
          montantFactureMois: 0,
          montantDepensesMois: 0,
          montantCotisationsPayees: 0,
          soldeClub: 0,
        });
        setDerniersDocuments([]);
        setATraiterMaintenant([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat(localeToIntl[locale], {
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
      brouillon: "bg-slate-100 text-slate-600",
      envoye: "badge-info",
      accepte: "badge-success",
      refuse: "badge-error",
      paye: "badge-success",
      "en-retard": "badge-error",
    };
    return colors[statut] || "bg-slate-100 text-slate-600";
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: t("dashboard.status.quote.draft"),
      envoye: t("dashboard.status.generic.sent"),
      accepte: t("dashboard.status.quote.accepted"),
      refuse: t("dashboard.status.quote.refused"),
      paye: t("dashboard.status.invoice.paid"),
      "en-retard": t("dashboard.status.generic.overdue"),
    };
    return labels[statut] || statut;
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(localeToIntl[locale]);
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

  const getMontantDocument = (doc: DocumentItem) => {
    if (typeof doc.totalTTC === "number") {
      return doc.totalTTC;
    }
    return calculerTotalTTC(doc.lignes || []);
  };

  const buildATraiterMaintenant = (
    factures: DocumentItem[]
  ): ATraiterItem[] => {
    const items: ATraiterItem[] = [];
    const followUpLabel = t("hero.paymentsCard.statuses.followUp");
    const overdueLabel = t("dashboard.status.generic.overdue");

    factures.forEach((facture) => {
      if (facture.statut === "paye" || facture.statut === "brouillon") return;
      const dateRef = facture.dateEcheance || facture.dateCreation;
      const isOverdue = !!facture.dateEcheance && isPast(facture.dateEcheance);
      items.push({
        id: facture.id,
        numero: facture.numero,
        client: facture.client?.nom || t("dashboard.common.unknownClient"),
        date: dateRef || facture.dateCreation,
        montant: getMontantDocument(facture),
        statutLabel: isOverdue ? overdueLabel : followUpLabel,
        statutColor: isOverdue ? "badge-error" : "badge-warning",
        href: `/tableau-de-bord/factures/${facture.id}`,
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
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {t("dashboard.overview.title")}
          </h1>
          <p className="mt-1 text-slate-500">
            {t("dashboard.overview.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{t("dashboard.overview.statusNote")}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Membres */}
        <Link
          href="/tableau-de-bord/clients"
          className="group relative bg-white rounded-2xl border border-slate-200 p-6 transition-all duration-200 hover:border-[var(--obillz-blue-border)] hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">{t("dashboard.overview.kpis.clients")}</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-[var(--obillz-blue-light)] transition-colors">
              <Users className="w-5 h-5 text-slate-600 group-hover:text-[var(--obillz-hero-blue)]" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900">
            {loading ? "-" : stats.totalClients}
          </div>
          {!loading && stats.totalClients === 0 && (
            <p className="mt-2 text-sm text-slate-400">
              {t("dashboard.overview.kpis.clientsEmpty")}
            </p>
          )}
        </Link>

        {/* Cotisations */}
        <Link
          href="/tableau-de-bord/devis"
          className="group relative bg-white rounded-2xl border border-slate-200 p-6 transition-all duration-200 hover:border-[var(--obillz-blue-border)] hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">{t("dashboard.overview.kpis.quotes")}</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-[var(--obillz-blue-light)] transition-colors">
              <FileText className="w-5 h-5 text-slate-600 group-hover:text-[var(--obillz-hero-blue)]" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900">
            {loading ? "-" : stats.totalDevis}
          </div>
          {!loading && (
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {stats.devisPayes > 0 && (
                <span className="text-emerald-600 font-medium">
                  {stats.devisPayes} {t("dashboard.overview.kpis.paidQuotes")}
                </span>
              )}
              {stats.devisEnRetard > 0 && (
                <span className="text-red-500 font-medium">
                  {stats.devisEnRetard} {t("dashboard.overview.kpis.lateQuotes")}
                </span>
              )}
              {stats.devisEnAttente > 0 && (
                <span className="font-medium" style={{ color: "var(--obillz-hero-blue)" }}>
                  {stats.devisEnAttente} {t("dashboard.overview.kpis.quotesPending")}
                </span>
              )}
              {stats.totalDevis === 0 && (
                <span className="text-slate-400">{t("dashboard.overview.kpis.allClear")}</span>
              )}
            </div>
          )}
        </Link>

        {/* Factures */}
        <Link
          href="/tableau-de-bord/factures"
          className="group relative bg-white rounded-2xl border border-slate-200 p-6 transition-all duration-200 hover:border-[var(--obillz-blue-border)] hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">{t("dashboard.overview.kpis.invoices")}</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-[var(--obillz-blue-light)] transition-colors">
              <Receipt className="w-5 h-5 text-slate-600 group-hover:text-[var(--obillz-hero-blue)]" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900">
            {loading ? "-" : stats.totalFactures}
          </div>
          {!loading && stats.facturesNonPayees > 0 ? (
            <p className="mt-2 text-sm font-medium text-red-500">
              {stats.facturesNonPayees} {t("dashboard.overview.kpis.unpaid")}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              {t("dashboard.overview.kpis.allClear")}
            </p>
          )}
        </Link>

        {/* Solde du club */}
        <div className="group relative bg-gradient-to-br from-[var(--obillz-hero-blue)] to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-white/80">Solde du club</span>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold">
            {loading ? "-" : formatMontant(stats.soldeClub)}
          </div>
          <p className="mt-2 text-sm text-white/70">
            Cotisations + Factures - Charges
          </p>
        </div>
      </div>

      {/* À traiter maintenant */}
      {aTraiterMaintenant.length > 0 && (
        <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {t("dashboard.overview.now.title")}
            </h2>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("dashboard.overview.now.badge")}
            </span>
          </div>

          <div className="space-y-4">
            {aTraiterMaintenant.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-5 transition-all hover:border-[var(--obillz-blue-border)] hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.numero}</p>
                    <p className="text-sm text-slate-500">{item.client}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {t("dashboard.overview.now.dueLabel")} {formatDate(item.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:text-right">
                  <div>
                    <p className="font-bold text-slate-900">{formatMontant(item.montant)}</p>
                    <span className={`badge-obillz ${item.statutColor}`}>
                      {item.statutLabel}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state si rien à traiter */}
      {!loading && aTraiterMaintenant.length === 0 && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-emerald-900">{t("dashboard.overview.now.empty")}</p>
              <p className="text-sm text-emerald-700">Toutes les cotisations et factures sont à jour</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          {t("dashboard.overview.quickActions.title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/tableau-de-bord/devis/nouveau"
            className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 transition-all hover:border-[var(--obillz-blue-border)] hover:bg-slate-50"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--obillz-blue-light)] flex items-center justify-center group-hover:bg-[var(--obillz-hero-blue)] transition-colors">
              <FilePlus className="w-6 h-6 text-[var(--obillz-hero-blue)] group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{t("dashboard.overview.quickActions.newQuote")}</p>
              <p className="text-sm text-slate-500">{t("dashboard.overview.quickActions.newQuoteText")}</p>
            </div>
          </Link>

          <Link
            href="/tableau-de-bord/factures/nouvelle"
            className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 transition-all hover:border-[var(--obillz-blue-border)] hover:bg-slate-50"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--obillz-blue-light)] flex items-center justify-center group-hover:bg-[var(--obillz-hero-blue)] transition-colors">
              <FilePlus className="w-6 h-6 text-[var(--obillz-hero-blue)] group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{t("dashboard.overview.quickActions.newInvoice")}</p>
              <p className="text-sm text-slate-500">{t("dashboard.overview.quickActions.newInvoiceText")}</p>
            </div>
          </Link>

          <Link
            href="/tableau-de-bord/clients/nouveau"
            className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 transition-all hover:border-[var(--obillz-blue-border)] hover:bg-slate-50"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--obillz-blue-light)] flex items-center justify-center group-hover:bg-[var(--obillz-hero-blue)] transition-colors">
              <UserPlus className="w-6 h-6 text-[var(--obillz-hero-blue)] group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{t("dashboard.overview.quickActions.newClient")}</p>
              <p className="text-sm text-slate-500">{t("dashboard.overview.quickActions.newClientText")}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Derniers documents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          {t("dashboard.overview.lastDocuments.title")}
        </h2>
        {loading ? (
          <div className="text-center py-8 text-slate-400">Chargement...</div>
        ) : derniersDocuments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">{t("dashboard.overview.lastDocuments.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {derniersDocuments.map((doc) => (
              <Link
                key={`${doc.type}-${doc.id}`}
                href={`/tableau-de-bord/${doc.type === "devis" ? "devis" : "factures"}/${doc.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    {doc.type === "devis" ? (
                      <FileText className="w-5 h-5 text-slate-500" />
                    ) : (
                      <Receipt className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{doc.numero}</p>
                    <p className="text-sm text-slate-500">
                      {doc.client?.nom || t("dashboard.common.unknownClient")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatMontant(doc.montant)}</p>
                    <p className="text-xs text-slate-400">{formatDate(doc.dateCreation)}</p>
                  </div>
                  <span className={`badge-obillz ${getStatutColor(doc.statut)}`}>
                    {getStatutLabel(doc.statut)}
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
