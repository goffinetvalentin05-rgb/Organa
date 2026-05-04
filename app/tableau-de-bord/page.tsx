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
  Handshake,
} from "@/lib/icons";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  StatCard,
  SectionCard,
  EmptyState,
  TableCard,
  glassNestedRowClass,
  cn,
} from "@/components/ui";

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

type SponsorRenewalItem = {
  id: string;
  sponsorName: string;
  title: string;
  endDate: string;
  isExpired: boolean;
  daysUntilEnd: number | null;
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
  const [sponsorRenewals, setSponsorRenewals] = useState<{
    items: SponsorRenewalItem[];
    totalWatch: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, documentsRes, depensesRes, renewalsRes] = await Promise.all([
          fetch("/api/clients", { cache: "no-store" }),
          fetch("/api/documents", { cache: "no-store" }),
          fetch("/api/depenses", { cache: "no-store" }),
          fetch("/api/sponsor-contracts/renewals", { cache: "no-store" }),
        ]);

        const clientsData = clientsRes.ok ? await clientsRes.json() : { clients: [] };
        const documentsData = documentsRes.ok ? await documentsRes.json() : { documents: [] };
        const depensesData = depensesRes.ok ? await depensesRes.json() : { depenses: [] };
        const renewalsData = renewalsRes.ok
          ? await renewalsRes.json()
          : { items: [], totalWatch: 0 };

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

        setSponsorRenewals({
          items: (renewalsData.items || []) as SponsorRenewalItem[],
          totalWatch: Number(renewalsData.totalWatch) || 0,
        });

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
        setSponsorRenewals({ items: [], totalWatch: 0 });
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


  const quickTile = cn(
    glassNestedRowClass,
    "group flex items-center gap-4 p-5 transition-all duration-200 hover:border-blue-300/90"
  );

  return (
    <PageLayout maxWidth="7xl">
      <Suspense fallback={null}>
        <CheckoutHandler />
      </Suspense>

      <PageHeader
        title={t("dashboard.overview.title")}
        subtitle={t("dashboard.overview.subtitle")}
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-900 shadow-sm">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{t("dashboard.overview.statusNote")}</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 items-stretch gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href="/tableau-de-bord/clients"
          label={t("dashboard.overview.kpis.clients")}
          icon={Users}
          value={loading ? "-" : stats.totalClients}
          footer={
            !loading && stats.totalClients === 0 ? (
              <p className="text-sm text-slate-500">{t("dashboard.overview.kpis.clientsEmpty")}</p>
            ) : null
          }
        />

        <StatCard
          href="/tableau-de-bord/devis"
          label={t("dashboard.overview.kpis.quotes")}
          icon={FileText}
          value={loading ? "-" : stats.totalDevis}
          footer={
            !loading ? (
              <div className="flex flex-wrap gap-2 text-sm">
                {stats.devisPayes > 0 ? (
                  <span className="font-medium text-emerald-700">
                    {stats.devisPayes} {t("dashboard.overview.kpis.paidQuotes")}
                  </span>
                ) : null}
                {stats.devisEnRetard > 0 ? (
                  <span className="font-medium text-rose-700">
                    {stats.devisEnRetard} {t("dashboard.overview.kpis.lateQuotes")}
                  </span>
                ) : null}
                {stats.devisEnAttente > 0 ? (
                  <span className="font-medium text-sky-700">
                    {stats.devisEnAttente} {t("dashboard.overview.kpis.quotesPending")}
                  </span>
                ) : null}
                {stats.totalDevis === 0 ? (
                  <span className="text-slate-500">{t("dashboard.overview.kpis.allClear")}</span>
                ) : null}
              </div>
            ) : null
          }
        />

        <StatCard
          href="/tableau-de-bord/factures"
          label={t("dashboard.overview.kpis.invoices")}
          icon={Receipt}
          value={loading ? "-" : stats.totalFactures}
          footer={
            !loading ? (
              stats.facturesNonPayees > 0 ? (
                <p className="text-sm font-medium text-rose-700">
                  {stats.facturesNonPayees} {t("dashboard.overview.kpis.unpaid")}
                </p>
              ) : (
                <p className="text-sm text-slate-500">{t("dashboard.overview.kpis.allClear")}</p>
              )
            ) : null
          }
        />

        <StatCard
          label="Solde du club"
          icon={Receipt}
          value={loading ? "-" : formatMontant(stats.soldeClub)}
          footer={<p className="text-sm text-slate-500">Cotisations + Factures - Charges</p>}
        />
      </div>

      {!loading && sponsorRenewals ? (
        <SectionCard
          icon={Handshake}
          title={t("dashboard.overview.sponsoringWatch.title")}
          headerRight={
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dashboard.overview.sponsoringWatch.badge")}
            </span>
          }
        >
          {sponsorRenewals.totalWatch === 0 ? (
            <p className="text-sm text-slate-600">{t("dashboard.overview.sponsoringWatch.empty")}</p>
          ) : (
            <>
              <p className="mb-4 text-sm font-medium text-amber-950">
                {t("dashboard.overview.sponsoringWatch.summary").replace(
                  "{count}",
                  String(sponsorRenewals.totalWatch)
                )}
              </p>
              <div className="space-y-2">
                {sponsorRenewals.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/tableau-de-bord/sponsoring/${item.id}`}
                    className={cn(
                      glassNestedRowClass,
                      "flex flex-col gap-2 transition hover:border-amber-200/90 sm:flex-row sm:items-center sm:justify-between"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{item.sponsorName}</p>
                      <p className="truncate text-sm text-slate-500">{item.title}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                      <span
                        className={`badge-obillz ${item.isExpired ? "badge-error" : "badge-warning"}`}
                      >
                        {item.isExpired
                          ? t("dashboard.overview.sponsoringWatch.expired")
                          : t("dashboard.overview.sponsoringWatch.expiresIn").replace(
                              "{days}",
                              String(Math.max(0, item.daysUntilEnd ?? 0))
                            )}
                      </span>
                      <ArrowRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 text-right">
                <Link
                  href="/tableau-de-bord/sponsoring"
                  className="text-sm font-semibold text-[var(--obillz-hero-blue)] hover:underline"
                >
                  {t("dashboard.overview.sponsoringWatch.cta")}
                </Link>
              </div>
            </>
          )}
        </SectionCard>
      ) : null}

      {aTraiterMaintenant.length > 0 ? (
        <SectionCard
          icon={Receipt}
          title={t("dashboard.overview.now.title")}
          headerRight={
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dashboard.overview.now.badge")}
            </span>
          }
        >
          <div className="space-y-3">
            {aTraiterMaintenant.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  glassNestedRowClass,
                  "flex flex-col gap-4 transition-all hover:border-slate-300/90 md:flex-row md:items-center md:justify-between"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Receipt className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.numero}</p>
                    <p className="text-sm text-slate-500">{item.client}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {t("dashboard.overview.now.dueLabel")} {formatDate(item.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:text-right">
                  <div>
                    <p className="font-bold text-slate-900">{formatMontant(item.montant)}</p>
                    <span className={`badge-obillz ${item.statutColor}`}>{item.statutLabel}</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {!loading && aTraiterMaintenant.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title={t("dashboard.overview.now.empty")}
          description={t("dashboard.overview.now.subtitleAllClear")}
        />
      ) : null}

      <SectionCard icon={FilePlus} title={t("dashboard.overview.quickActions.title")}>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/tableau-de-bord/devis/nouveau" className={quickTile}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 transition-colors group-hover:from-[#2563EB] group-hover:to-[#1d4ed8]">
              <FilePlus className="h-6 w-6 text-[#2563EB] transition-colors group-hover:text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{t("dashboard.overview.quickActions.newQuote")}</p>
              <p className="text-sm text-slate-500">{t("dashboard.overview.quickActions.newQuoteText")}</p>
            </div>
          </Link>

          <Link href="/tableau-de-bord/factures/nouvelle" className={quickTile}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 transition-colors group-hover:from-[#2563EB] group-hover:to-[#1d4ed8]">
              <FilePlus className="h-6 w-6 text-[#2563EB] transition-colors group-hover:text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{t("dashboard.overview.quickActions.newInvoice")}</p>
              <p className="text-sm text-slate-500">{t("dashboard.overview.quickActions.newInvoiceText")}</p>
            </div>
          </Link>

          <Link href="/tableau-de-bord/clients/nouveau" className={quickTile}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 transition-colors group-hover:from-[#2563EB] group-hover:to-[#1d4ed8]">
              <UserPlus className="h-6 w-6 text-[#2563EB] transition-colors group-hover:text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{t("dashboard.overview.quickActions.newClient")}</p>
              <p className="text-sm text-slate-500">{t("dashboard.overview.quickActions.newClientText")}</p>
            </div>
          </Link>
        </div>
      </SectionCard>

      <TableCard title={t("dashboard.overview.lastDocuments.title")} bodyClassName="p-5 sm:p-6 md:p-8">
        {loading ? (
          <div className="py-10 text-center text-slate-500">{t("dashboard.overview.lastDocuments.loading")}</div>
        ) : derniersDocuments.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            {t("dashboard.overview.lastDocuments.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {derniersDocuments.map((doc) => (
              <Link
                key={`${doc.type}-${doc.id}`}
                href={`/tableau-de-bord/${doc.type === "devis" ? "devis" : "factures"}/${doc.id}`}
                className={cn(
                  glassNestedRowClass,
                  "flex items-center justify-between transition-all hover:border-slate-300/90"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    {doc.type === "devis" ? (
                      <FileText className="h-5 w-5 text-slate-500" />
                    ) : (
                      <Receipt className="h-5 w-5 text-slate-500" />
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
                  <span className={`badge-obillz ${getStatutColor(doc.statut)}`}>{getStatutLabel(doc.statut)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </TableCard>
    </PageLayout>
  );
}
