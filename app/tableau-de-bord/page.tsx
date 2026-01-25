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
    // Vérifier si on revient d'un checkout réussi
    const checkout = searchParams?.get("checkout");
    if (checkout === "success") {
      toast.success(t("dashboard.overview.checkoutSuccess"));
      // Nettoyer l'URL
      router.replace("/tableau-de-bord");
    }
  }, [searchParams, router]);

  return null;
}

export default function TableauDeBordPage() {
  const { t, locale } = useI18n();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalDevis: 0,
    devisEnAttente: 0,
    totalFactures: 0,
    facturesNonPayees: 0,
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

        setStats({
          totalClients: clients.length,
          totalDevis: devis.length,
          devisEnAttente,
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
          totalFactures: 0,
          facturesNonPayees: 0,
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
        statutColor: isOverdue ? "bg-error-bg text-error" : "bg-accent-light text-accent",
        href: `/tableau-de-bord/factures/${facture.id}`,
      });
    });

    return items.sort((a, b) => a.date.localeCompare(b.date));
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
            {t("dashboard.overview.title")}
          </h1>
          <p className="font-body text-sm text-secondary font-normal">
            {t("dashboard.overview.subtitle")}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-subtle bg-surface px-4 py-2 text-xs text-secondary">
          <CheckCircle className="w-4 h-4 text-success" />
          <span>{t("dashboard.overview.statusNote")}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/tableau-de-bord/clients"
          className="group relative rounded-[24px] border border-subtle bg-surface p-6 shadow-premium hover:shadow-premium-hover hover:border-accent-border transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">{t("dashboard.overview.kpis.clients")}</span>
            <Users className="w-6 h-6 text-secondary" />
          </div>
          <div className="font-heading text-4xl font-bold text-primary">
            {stats.totalClients}
          </div>
          {stats.totalClients === 0 && (
            <div className="mt-3 font-body text-sm text-secondary">
              {t("dashboard.overview.kpis.clientsEmpty")}
            </div>
          )}
        </Link>

        <Link
          href="/tableau-de-bord/devis?statut=en-attente"
          className="group relative rounded-[24px] border border-subtle bg-surface p-6 shadow-premium hover:shadow-premium-hover hover:border-accent-border transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">{t("dashboard.overview.kpis.quotes")}</span>
            <FileText className="w-6 h-6 text-secondary" />
          </div>
          <div className="font-heading text-4xl font-bold text-primary">
            {stats.totalDevis}
          </div>
          {stats.devisEnAttente > 0 && (
            <div className="mt-3 font-body text-sm accent font-medium">
              {stats.devisEnAttente} {t("dashboard.overview.kpis.quotesPending")}
            </div>
          )}
          {stats.devisEnAttente === 0 && (
            <div className="mt-3 font-body text-sm text-secondary">
              {t("dashboard.overview.kpis.allClear")}
            </div>
          )}
        </Link>

        <Link
          href="/tableau-de-bord/factures?statut=non-payees"
          className="group relative rounded-[24px] border border-subtle bg-surface p-6 shadow-premium hover:shadow-premium-hover hover:border-accent-border transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">{t("dashboard.overview.kpis.invoices")}</span>
            <Receipt className="w-6 h-6 text-secondary" />
          </div>
          <div className="font-heading text-4xl font-bold text-primary">
            {stats.totalFactures}
          </div>
          {stats.facturesNonPayees > 0 ? (
            <div className="mt-3 font-body text-sm" style={{ color: "var(--error)" }}>
              {stats.facturesNonPayees} {t("dashboard.overview.kpis.unpaid")}
            </div>
          ) : (
            <div className="mt-3 font-body text-sm text-secondary">
              {t("dashboard.overview.kpis.allClear")}
            </div>
          )}
        </Link>

      </div>

      {/* À traiter maintenant */}
      <div className="rounded-[32px] border border-subtle bg-gradient-to-br from-white via-[#F5F8FF] to-[#E0E7FF] p-8 shadow-premium">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="font-heading text-2xl font-semibold text-primary">
            {t("dashboard.overview.now.title")}
          </h2>
          <span className="text-xs uppercase tracking-[0.25em] text-tertiary">
            {t("dashboard.overview.now.badge")}
          </span>
        </div>
        {aTraiterMaintenant.length === 0 ? (
          <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-subtle bg-surface px-5 py-4 text-secondary">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="font-body text-sm">
              {t("dashboard.overview.now.empty")}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {aTraiterMaintenant.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-[24px] border border-subtle bg-surface p-6 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-body text-xs uppercase tracking-wide text-secondary">
                      {t("dashboard.overview.types.invoice")}
                    </div>
                    <div className="font-body font-semibold text-lg text-primary">
                      {item.numero}
                    </div>
                    <div className="font-body text-sm text-secondary">
                      {item.client}
                    </div>
                    <div className="font-body text-sm text-secondary">
                      {t("dashboard.overview.now.dueLabel")} {formatDate(item.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-body font-bold text-lg text-primary">
                      {formatMontant(item.montant)}
                    </div>
                    <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.statutColor}`}>
                      {item.statutLabel}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link
                    href={item.href}
                    className="inline-flex items-center justify-center rounded-full border border-subtle bg-white px-4 py-2 text-xs font-semibold text-secondary transition-all hover:text-primary"
                  >
                    Voir la facture
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="rounded-[28px] border border-subtle bg-surface p-8 shadow-premium">
        <h2 className="font-heading text-2xl font-semibold mb-6 text-primary">
          {t("dashboard.overview.quickActions.title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/tableau-de-bord/devis/nouveau"
            className="group flex flex-col gap-3 rounded-[24px] border border-subtle bg-surface p-6 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">{t("dashboard.overview.quickActions.newQuote")}</span>
              <FilePlus className="w-5 h-5 text-secondary group-hover:text-primary" />
            </div>
            <p className="text-sm text-secondary">
              {t("dashboard.overview.quickActions.newQuoteText")}
            </p>
          </Link>
          <Link
            href="/tableau-de-bord/factures/nouvelle"
            className="group flex flex-col gap-3 rounded-[24px] border border-subtle bg-surface p-6 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">{t("dashboard.overview.quickActions.newInvoice")}</span>
              <FilePlus className="w-5 h-5 text-secondary group-hover:text-primary" />
            </div>
            <p className="text-sm text-secondary">
              {t("dashboard.overview.quickActions.newInvoiceText")}
            </p>
          </Link>
          <Link
            href="/tableau-de-bord/clients/nouveau"
            className="group flex flex-col gap-3 rounded-[24px] border border-subtle bg-surface p-6 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">{t("dashboard.overview.quickActions.newClient")}</span>
              <UserPlus className="w-5 h-5 text-secondary group-hover:text-primary" />
            </div>
            <p className="text-sm text-secondary">
              {t("dashboard.overview.quickActions.newClientText")}
            </p>
          </Link>
        </div>
      </div>

      {/* Derniers documents */}
      <div className="rounded-[28px] border border-subtle bg-surface p-8 shadow-premium">
        <h2 className="font-heading text-2xl font-semibold mb-6 text-primary">
          {t("dashboard.overview.lastDocuments.title")}
        </h2>
        {derniersDocuments.length === 0 ? (
          <p className="font-body text-secondary text-lg font-normal">
            {t("dashboard.overview.lastDocuments.empty")}
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
                        {doc.client?.nom || t("dashboard.common.unknownClient")}
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
                  <span>{t("dashboard.overview.lastDocuments.created")} {formatDate(doc.dateCreation)}</span>
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




