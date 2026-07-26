"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
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
  Wallet,
  Calendar2,
  AlertTriangle,
  ClipboardList,
} from "@/lib/icons";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  StatCard,
  SectionCard,
  TableCard,
  DashboardBadge,
  iconBadgeClass,
  dashboardStatusPillClass,
  dashboardQuickActionClass,
  cn,
} from "@/components/ui";

interface Client {
  id: string;
  nom?: string | null;
  createdAt?: string | null;
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
  createdAt?: string | null;
}

interface Depense {
  id: string;
  label: string;
  amount: number;
  date: string;
  status: "a_payer" | "paye";
  createdAt?: string | null;
}

interface EventItem {
  id: string;
  name: string;
  start_date: string;
  end_date?: string | null;
  status: "planned" | "completed";
  totalRevenue?: number;
  totalExpenses?: number;
  netResult?: number;
  created_at?: string | null;
}

interface ClubRevenue {
  id: string;
  name: string;
  amount: number;
  revenue_date: string;
  event?: { id: string; name: string } | null;
  created_at?: string | null;
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

type ActivityItem = {
  id: string;
  type: "member" | "invoice" | "quote" | "revenue" | "expense" | "event";
  title: string;
  subtitle: string;
  date: string;
  amount?: number;
  href?: string;
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
    nouveauxMembresMois: 0,
    totalDevis: 0,
    devisEnAttente: 0,
    devisPayes: 0,
    devisEnRetard: 0,
    totalFactures: 0,
    facturesPayees: 0,
    facturesNonPayees: 0,
    facturesEnRetard: 0,
    montantFactureMois: 0,
    montantDepensesMois: 0,
    montantCotisationsPayees: 0,
    montantCotisationsAttente: 0,
    montantFacturesPayees: 0,
    montantFacturesAttente: 0,
    totalChargesPayees: 0,
    totalChargesAttente: 0,
    chargesAttenteCount: 0,
    soldeClub: 0,
  });

  const [aTraiterMaintenant, setATraiterMaintenant] = useState<ATraiterItem[]>([]);
  const [sponsorRenewals, setSponsorRenewals] = useState<{
    items: SponsorRenewalItem[];
    totalWatch: number;
    expiredCount: number;
    expiringSoonCount: number;
  } | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, documentsRes, depensesRes, renewalsRes, eventsRes, revenuesRes] =
          await Promise.all([
            fetch("/api/clients", { cache: "no-store" }),
            fetch("/api/documents", { cache: "no-store" }),
            fetch("/api/depenses", { cache: "no-store" }),
            fetch("/api/sponsor-contracts/renewals", { cache: "no-store" }),
            fetch("/api/events", { cache: "no-store" }),
            fetch("/api/club-revenues", { cache: "no-store" }),
          ]);

        const clientsData = clientsRes.ok ? await clientsRes.json() : { clients: [] };
        const documentsData = documentsRes.ok ? await documentsRes.json() : { documents: [] };
        const depensesData = depensesRes.ok ? await depensesRes.json() : { depenses: [] };
        const renewalsData = renewalsRes.ok
          ? await renewalsRes.json()
          : { items: [], totalWatch: 0, expiredCount: 0, expiringSoonCount: 0 };
        const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] };
        const revenuesData = revenuesRes.ok ? await revenuesRes.json() : { revenues: [] };

        const clients: Client[] = clientsData.clients || [];
        const documents: DocumentItem[] = documentsData.documents || [];
        const depenses: Depense[] = depensesData.depenses || [];
        const events: EventItem[] = eventsData.events || [];
        const revenues: ClubRevenue[] = revenuesData.revenues || [];

        const devis = documents.filter((doc) => doc.type === "quote");
        const factures = documents.filter((doc) => doc.type === "invoice");

        const facturesMois = factures.filter((facture) => isSameMonth(facture.dateCreation));
        const depensesMois = depenses.filter((depense) => isSameMonth(depense.date));

        const devisEnAttente = devis.filter((q) => q.statut === "envoye").length;
        const devisPayes = devis.filter(
          (q) => q.statut === "accepte" || q.statut === "paye"
        ).length;
        const devisEnRetard = devis.filter((q) => {
          if (q.statut === "accepte" || q.statut === "paye") return false;
          if (!q.dateEcheance) return false;
          return isPast(q.dateEcheance);
        }).length;

        const facturesPayees = factures.filter((f) => f.statut === "paye").length;
        const facturesNonPayees = factures.filter((f) => f.statut !== "paye").length;
        const facturesEnRetard = factures.filter((f) => {
          if (f.statut === "paye") return false;
          if (!f.dateEcheance) return false;
          return isPast(f.dateEcheance);
        }).length;

        const montantCotisationsPayees = devis
          .filter((d) => d.statut === "accepte" || d.statut === "paye")
          .reduce((total, d) => total + getMontantDocument(d), 0);

        const montantCotisationsAttente = devis
          .filter((d) => d.statut !== "accepte" && d.statut !== "paye" && d.statut !== "refuse")
          .reduce((total, d) => total + getMontantDocument(d), 0);

        const montantFacturesPayees = factures
          .filter((f) => f.statut === "paye")
          .reduce((total, f) => total + getMontantDocument(f), 0);

        const montantFacturesAttente = factures
          .filter((f) => f.statut !== "paye" && f.statut !== "brouillon")
          .reduce((total, f) => total + getMontantDocument(f), 0);

        const montantAutresRevenus = revenues.reduce(
          (total, rev) => total + (Number(rev.amount) || 0),
          0
        );

        const totalChargesPayees = depenses
          .filter((d) => d.status === "paye")
          .reduce((total, d) => total + (Number(d.amount) || 0), 0);

        const totalChargesAttente = depenses
          .filter((d) => d.status !== "paye")
          .reduce((total, d) => total + (Number(d.amount) || 0), 0);

        const chargesAttenteCount = depenses.filter((d) => d.status !== "paye").length;

        const totalRevenus =
          montantCotisationsPayees + montantFacturesPayees + montantAutresRevenus;
        const totalCharges = totalChargesPayees;
        const soldeClub = totalRevenus - totalCharges;

        const nouveauxMembresMois = clients.filter((c) => isSameMonth(c.createdAt ?? undefined))
          .length;

        setStats({
          totalClients: clients.length,
          nouveauxMembresMois,
          totalDevis: devis.length,
          devisEnAttente,
          devisPayes,
          devisEnRetard,
          totalFactures: factures.length,
          facturesPayees,
          facturesNonPayees,
          facturesEnRetard,
          montantFactureMois: facturesMois.reduce(
            (total, facture) => total + getMontantDocument(facture),
            0
          ),
          montantDepensesMois: depensesMois.reduce(
            (total, depense) => total + (Number(depense.amount) || 0),
            0
          ),
          montantCotisationsPayees,
          montantCotisationsAttente,
          montantFacturesPayees,
          montantFacturesAttente,
          totalChargesPayees,
          totalChargesAttente,
          chargesAttenteCount,
          soldeClub,
        });

        setATraiterMaintenant(buildATraiterMaintenant(factures));

        setSponsorRenewals({
          items: (renewalsData.items || []) as SponsorRenewalItem[],
          totalWatch: Number(renewalsData.totalWatch) || 0,
          expiredCount: Number(renewalsData.expiredCount) || 0,
          expiringSoonCount: Number(renewalsData.expiringSoonCount) || 0,
        });

        const upcoming = events
          .filter((ev) => {
            if (!ev.start_date) return false;
            const d = parseDate(ev.start_date);
            if (!d) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return d.getTime() >= today.getTime() && ev.status !== "completed";
          })
          .sort((a, b) => a.start_date.localeCompare(b.start_date))
          .slice(0, 5);
        setUpcomingEvents(upcoming);

        setRecentActivity(
          buildRecentActivity({ clients, documents, depenses, revenues, events })
        );
      } catch (error) {
        console.error("[TableauDeBord] Erreur chargement:", error);
        setStats((prev) => ({ ...prev, totalClients: 0 }));
        setATraiterMaintenant([]);
        setSponsorRenewals({
          items: [],
          totalWatch: 0,
          expiredCount: 0,
          expiringSoonCount: 0,
        });
        setUpcomingEvents([]);
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat(localeToIntl[locale], {
      style: "currency",
      currency: "CHF",
    }).format(montant);

  const isSameMonth = (value?: string) => {
    if (!value) return false;
    const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()
    );
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(localeToIntl[locale]);
  };

  const formatRelativeDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(localeToIntl[locale], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const parseDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
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
    if (typeof doc.totalTTC === "number") return doc.totalTTC;
    return calculerTotalTTC(doc.lignes || []);
  };

  const buildATraiterMaintenant = (factures: DocumentItem[]): ATraiterItem[] => {
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

  const buildRecentActivity = ({
    clients,
    documents,
    depenses,
    revenues,
    events,
  }: {
    clients: Client[];
    documents: DocumentItem[];
    depenses: Depense[];
    revenues: ClubRevenue[];
    events: EventItem[];
  }): ActivityItem[] => {
    const items: ActivityItem[] = [];

    clients.forEach((c) => {
      if (!c.createdAt) return;
      items.push({
        id: `member-${c.id}`,
        type: "member",
        title: c.nom || t("dashboard.common.unknownClient"),
        subtitle: t("dashboard.overview.priorities.newMembers"),
        date: c.createdAt,
        href: `/tableau-de-bord/clients/${c.id}`,
      });
    });

    documents.forEach((doc) => {
      if (!doc.createdAt && !doc.dateCreation) return;
      const isQuote = doc.type === "quote";
      items.push({
        id: `${doc.type}-${doc.id}`,
        type: isQuote ? "quote" : "invoice",
        title: doc.numero,
        subtitle: doc.client?.nom || t("dashboard.common.unknownClient"),
        date: doc.createdAt || doc.dateCreation,
        amount: getMontantDocument(doc),
        href: `/tableau-de-bord/${isQuote ? "devis" : "factures"}/${doc.id}`,
      });
    });

    depenses.forEach((d) => {
      if (!d.createdAt && !d.date) return;
      items.push({
        id: `expense-${d.id}`,
        type: "expense",
        title: d.label || "—",
        subtitle: t("dashboard.expenses.title"),
        date: d.createdAt || d.date,
        amount: -(Number(d.amount) || 0),
      });
    });

    revenues.forEach((r) => {
      if (!r.created_at && !r.revenue_date) return;
      items.push({
        id: `revenue-${r.id}`,
        type: "revenue",
        title: r.name,
        subtitle: r.event?.name || t("dashboard.overview.activity.clubRevenue"),
        date: r.created_at || r.revenue_date,
        amount: Number(r.amount) || 0,
      });
    });

    events.forEach((ev) => {
      if (!ev.created_at) return;
      items.push({
        id: `event-${ev.id}`,
        type: "event",
        title: ev.name,
        subtitle: formatRelativeDate(ev.start_date),
        date: ev.created_at,
        href: `/tableau-de-bord/evenements/${ev.id}`,
      });
    });

    return items
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 6);
  };

  const priorities = useMemo(() => {
    const list: {
      id: string;
      label: string;
      count: number | null;
      detail?: string;
      href?: string;
      variant: "danger" | "warning" | "info" | "success" | "default";
      badgeLabel: string;
      icon: typeof Receipt;
    }[] = [];

    if (stats.devisEnAttente > 0 || stats.devisEnRetard > 0) {
      const isUrgent = stats.devisEnRetard > 0;
      list.push({
        id: "memberships",
        label: t("dashboard.overview.priorities.membershipsPending"),
        count: stats.devisEnAttente + stats.devisEnRetard,
        detail:
          stats.devisEnRetard > 0
            ? `${stats.devisEnRetard} ${t("dashboard.overview.kpis.lateQuotes")}`
            : undefined,
        href: "/tableau-de-bord/devis",
        variant: isUrgent ? "danger" : "warning",
        badgeLabel: isUrgent
          ? t("dashboard.overview.priorities.urgent")
          : t("dashboard.overview.priorities.toHandle"),
        icon: FileText,
      });
    }

    if (stats.facturesNonPayees > 0) {
      const isUrgent = stats.facturesEnRetard > 0;
      list.push({
        id: "invoices",
        label: t("dashboard.overview.priorities.invoicesUnpaid"),
        count: stats.facturesNonPayees,
        detail:
          stats.facturesEnRetard > 0
            ? `${stats.facturesEnRetard} ${t("dashboard.overview.kpis.lateQuotes")}`
            : undefined,
        href: "/tableau-de-bord/factures",
        variant: isUrgent ? "danger" : "warning",
        badgeLabel: isUrgent
          ? t("dashboard.overview.priorities.urgent")
          : t("dashboard.overview.priorities.toHandle"),
        icon: Receipt,
      });
    }

    if (stats.chargesAttenteCount > 0) {
      list.push({
        id: "expenses",
        label: t("dashboard.overview.priorities.expensesPending"),
        count: stats.chargesAttenteCount,
        detail: formatMontant(stats.totalChargesAttente),
        href: "/tableau-de-bord/depenses",
        variant: "warning",
        badgeLabel: t("dashboard.overview.priorities.toHandle"),
        icon: Wallet,
      });
    }

    if (sponsorRenewals && sponsorRenewals.expiredCount > 0) {
      list.push({
        id: "sponsors-expired",
        label: t("dashboard.overview.priorities.sponsorsExpired"),
        count: sponsorRenewals.expiredCount,
        href: "/tableau-de-bord/sponsoring",
        variant: "danger",
        badgeLabel: t("dashboard.overview.priorities.urgent"),
        icon: Handshake,
      });
    }

    if (sponsorRenewals && sponsorRenewals.expiringSoonCount > 0) {
      list.push({
        id: "sponsors-soon",
        label: t("dashboard.overview.priorities.sponsorsExpiring"),
        count: sponsorRenewals.expiringSoonCount,
        href: "/tableau-de-bord/sponsoring",
        variant: "warning",
        badgeLabel: t("dashboard.overview.priorities.soon"),
        icon: Handshake,
      });
    }

    if (upcomingEvents.length > 0) {
      list.push({
        id: "events",
        label: t("dashboard.overview.priorities.upcomingEvents"),
        count: upcomingEvents.length,
        detail: formatRelativeDate(upcomingEvents[0]?.start_date),
        href: "/tableau-de-bord/evenements",
        variant: "info",
        badgeLabel: t("dashboard.overview.priorities.soon"),
        icon: Calendar2,
      });
    }

    if (stats.nouveauxMembresMois > 0) {
      list.push({
        id: "new-members",
        label: t("dashboard.overview.priorities.newMembers"),
        count: stats.nouveauxMembresMois,
        href: "/tableau-de-bord/clients",
        variant: "default",
        badgeLabel: t("dashboard.overview.priorities.info"),
        icon: Users,
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, sponsorRenewals, upcomingEvents, t]);

  const activityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "member":
        return Users;
      case "invoice":
        return Receipt;
      case "quote":
        return FileText;
      case "revenue":
        return Wallet;
      case "expense":
        return Wallet;
      case "event":
        return Calendar2;
      default:
        return ClipboardList;
    }
  };

  const quotesPaidPct =
    stats.totalDevis > 0 ? Math.round((stats.devisPayes / stats.totalDevis) * 100) : 0;
  const invoicesPaidPct =
    stats.totalFactures > 0
      ? Math.round((stats.facturesPayees / stats.totalFactures) * 100)
      : 0;

  const membersSpark = [
    Math.max(stats.totalClients - stats.nouveauxMembresMois * 2, 0),
    Math.max(stats.totalClients - stats.nouveauxMembresMois, 1),
    Math.max(stats.totalClients - Math.floor(stats.nouveauxMembresMois / 2), 1),
    Math.max(stats.totalClients, 1),
  ];

  const quotesSpark = [
    Math.max(stats.devisPayes - 2, 0),
    Math.max(stats.devisEnAttente, 1),
    Math.max(stats.devisPayes, 1),
    Math.max(stats.totalDevis, 1),
  ];

  const invoicesSpark = [
    Math.max(stats.facturesPayees - 1, 0),
    Math.max(stats.facturesNonPayees, 1),
    Math.max(stats.facturesPayees, 1),
    Math.max(stats.totalFactures, 1),
  ];

  const balanceSpark = [
    Math.max(stats.soldeClub * 0.55, 0),
    Math.max(stats.soldeClub * 0.7, 0),
    Math.max(stats.soldeClub * 0.85, 0),
    Math.max(Math.abs(stats.soldeClub), 1),
  ];

  return (
    <PageLayout maxWidth="7xl" stack="comfortable">
      <Suspense fallback={null}>
        <CheckoutHandler />
      </Suspense>

      <PageHeader
        title={t("dashboard.overview.title")}
        subtitle={t("dashboard.overview.subtitle")}
        actions={
          <div className={dashboardStatusPillClass}>
            <span className="dashboard-live-dot" />
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{t("dashboard.overview.statusNote")}</span>
          </div>
        }
      />

      {/* === KPIs premium === */}
      <div className="grid grid-cols-1 items-stretch gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          href="/tableau-de-bord/clients"
          label={t("dashboard.overview.kpis.clients")}
          icon={Users}
          accent="cyan"
          value={loading ? "-" : stats.totalClients}
          sparkline={loading ? undefined : membersSpark}
          badge={
            !loading && stats.nouveauxMembresMois > 0 ? (
              <DashboardBadge variant="success">
                +{stats.nouveauxMembresMois}
              </DashboardBadge>
            ) : undefined
          }
          footer={
            !loading ? (
              stats.totalClients === 0 ? (
                <p>{t("dashboard.overview.kpis.clientsEmpty")}</p>
              ) : stats.nouveauxMembresMois > 0 ? (
                <p className="font-medium text-emerald-600">
                  {t("dashboard.overview.kpis.newThisMonth").replace(
                    "{count}",
                    String(stats.nouveauxMembresMois)
                  )}
                </p>
              ) : (
                <p>{t("dashboard.overview.kpis.allClear")}</p>
              )
            ) : null
          }
        />

        <StatCard
          href="/tableau-de-bord/devis"
          label={t("dashboard.overview.kpis.quotes")}
          icon={FileText}
          accent="electric"
          value={loading ? "-" : stats.totalDevis}
          progress={loading ? undefined : quotesPaidPct}
          sparkline={loading ? undefined : quotesSpark}
          badge={
            !loading && stats.devisEnRetard > 0 ? (
              <DashboardBadge variant="danger">
                {stats.devisEnRetard} {t("dashboard.overview.kpis.lateQuotes")}
              </DashboardBadge>
            ) : !loading && stats.devisEnAttente > 0 ? (
              <DashboardBadge variant="info">
                {stats.devisEnAttente} {t("dashboard.overview.kpis.quotesPending")}
              </DashboardBadge>
            ) : undefined
          }
          footer={
            !loading ? (
              <div className="space-y-1">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {stats.devisPayes > 0 ? (
                    <span className="font-medium text-emerald-600">
                      {stats.devisPayes} {t("dashboard.overview.kpis.paidQuotes")}
                    </span>
                  ) : null}
                  {stats.devisEnAttente > 0 ? (
                    <span className="font-medium text-sky-600">
                      {stats.devisEnAttente} {t("dashboard.overview.kpis.quotesPending")}
                    </span>
                  ) : null}
                  {stats.totalDevis === 0 ? (
                    <span>{t("dashboard.overview.kpis.allClear")}</span>
                  ) : null}
                </div>
                {stats.montantCotisationsPayees > 0 ? (
                  <p className="text-xs text-[#7B8BA5]">
                    {t("dashboard.overview.kpis.collected")}{" "}
                    <span className="font-medium text-[#0B1220]">
                      {formatMontant(stats.montantCotisationsPayees)}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null
          }
        />

        <StatCard
          href="/tableau-de-bord/factures"
          label={t("dashboard.overview.kpis.invoices")}
          icon={Receipt}
          accent="royal"
          value={loading ? "-" : stats.totalFactures}
          progress={loading ? undefined : invoicesPaidPct}
          sparkline={loading ? undefined : invoicesSpark}
          badge={
            !loading && stats.facturesNonPayees > 0 ? (
              <DashboardBadge variant="warning">
                {stats.facturesNonPayees} {t("dashboard.overview.kpis.unpaid")}
              </DashboardBadge>
            ) : undefined
          }
          footer={
            !loading ? (
              <div className="space-y-1">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {stats.facturesPayees > 0 ? (
                    <span className="font-medium text-emerald-600">
                      {stats.facturesPayees} {t("dashboard.overview.kpis.paidQuotes")}
                    </span>
                  ) : null}
                  {stats.totalFactures === 0 ? (
                    <span>{t("dashboard.overview.kpis.allClear")}</span>
                  ) : null}
                </div>
                {stats.montantFacturesAttente > 0 ? (
                  <p className="text-xs text-[#7B8BA5]">
                    {t("dashboard.overview.kpis.pendingAmount")}{" "}
                    <span className="font-medium text-[#0B1220]">
                      {formatMontant(stats.montantFacturesAttente)}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null
          }
        />

        <StatCard
          label={t("dashboard.overview.kpis.balance")}
          icon={Wallet}
          accent="navy"
          value={loading ? "-" : formatMontant(stats.soldeClub)}
          sparkline={loading ? undefined : balanceSpark}
          badge={
            !loading ? (
              <DashboardBadge variant={stats.soldeClub >= 0 ? "success" : "danger"}>
                {stats.soldeClub >= 0 ? "+" : "−"}
              </DashboardBadge>
            ) : undefined
          }
          footer={
            <p className="text-xs text-[#7B8BA5]">{t("dashboard.overview.kpis.balanceFormula")}</p>
          }
        />
      </div>

      {/* === Priorités + Actions rapides === */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12 xl:gap-7">
        {!loading ? (
          <SectionCard
            className="xl:col-span-7"
            icon={AlertTriangle}
            title={t("dashboard.overview.priorities.title")}
            description={t("dashboard.overview.priorities.badge")}
            headerRight={
              priorities.length > 0 ? (
                <DashboardBadge variant="warning">{priorities.length}</DashboardBadge>
              ) : (
                <DashboardBadge variant="success">OK</DashboardBadge>
              )
            }
          >
            {priorities.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-cyan-50/50 px-5 py-5 text-sm text-emerald-800 shadow-[0_0_24px_rgba(16,185,129,0.1)]">
                <CheckCircle className="h-6 w-6 shrink-0 text-emerald-500" />
                <span>{t("dashboard.overview.priorities.empty")}</span>
              </div>
            ) : (
              <div className="space-y-3">
                {priorities.map((item, index) => {
                  const Icon = item.icon;
                  const maxPriorityCount = Math.max(
                    ...priorities.map((p) => p.count ?? 0),
                    1
                  );
                  const barPct = Math.round(((item.count ?? 0) / maxPriorityCount) * 100);
                  const content = (
                    <div
                      className={cn(
                        "dashboard-priority-card",
                        `dashboard-priority-card--${item.variant}`
                      )}
                    >
                      <div
                        className={cn(
                          iconBadgeClass,
                          "mt-0.5 shrink-0",
                          item.variant === "danger" &&
                            "from-rose-500/15 to-rose-400/10 text-rose-600 ring-rose-200",
                          item.variant === "warning" &&
                            "from-amber-500/15 to-amber-400/10 text-amber-600 ring-amber-200",
                          item.variant === "info" &&
                            "from-[#1A23FF]/12 to-cyan-400/10 text-[#1A23FF]"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[#0B1220]">{item.label}</p>
                          <DashboardBadge variant={item.variant}>{item.badgeLabel}</DashboardBadge>
                        </div>
                        {item.detail ? (
                          <p className="mt-1 text-xs text-[#7B8BA5]">{item.detail}</p>
                        ) : null}
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(26,35,255,0.08)]">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              item.variant === "danger" &&
                                "bg-gradient-to-r from-rose-500 to-rose-400",
                              item.variant === "warning" &&
                                "bg-gradient-to-r from-amber-500 to-amber-400",
                              item.variant === "info" &&
                                "bg-gradient-to-r from-[#1A23FF] to-[#38BDF8]",
                              (item.variant === "default" || item.variant === "success") &&
                                "bg-gradient-to-r from-emerald-500 to-teal-400"
                            )}
                            style={{ width: `${Math.max(barPct, 12)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2 self-center">
                        <span className="text-2xl font-semibold tabular-nums tracking-tight text-[#0B1220]">
                          {item.count ?? "-"}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7B8BA5]">
                          #{index + 1}
                        </span>
                        {item.href ? (
                          <ArrowRight className="h-4 w-4 text-[#C7D0E0] transition group-hover:translate-x-0.5 group-hover:text-[#1A23FF]" />
                        ) : null}
                      </div>
                    </div>
                  );

                  return item.href ? (
                    <Link key={item.id} href={item.href} className="group block">
                      {content}
                    </Link>
                  ) : (
                    <div key={item.id}>{content}</div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        ) : (
          <div className="xl:col-span-7" />
        )}

        <SectionCard
          className="xl:col-span-5"
          icon={FilePlus}
          title={t("dashboard.overview.quickActions.title")}
        >
          <div className="space-y-3">
            <Link href="/tableau-de-bord/devis/nouveau" className={dashboardQuickActionClass}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(26,35,255,0.12),transparent_55%)] opacity-0 transition group-hover:opacity-100" />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A23FF] to-[#6366f1] text-white shadow-[0_8px_24px_rgba(26,35,255,0.35)]">
                <FilePlus className="h-5 w-5" />
              </div>
              <div className="relative min-w-0">
                <p className="font-semibold text-[#0B1220]">
                  {t("dashboard.overview.quickActions.newQuote")}
                </p>
                <p className="mt-0.5 text-sm text-[#4A5B78]">
                  {t("dashboard.overview.quickActions.newQuoteText")}
                </p>
              </div>
              <ArrowRight className="relative ml-auto h-4 w-4 shrink-0 text-[#C7D0E0] transition group-hover:translate-x-0.5 group-hover:text-[#1A23FF]" />
            </Link>

            <Link href="/tableau-de-bord/factures/nouvelle" className={dashboardQuickActionClass}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(37,99,235,0.12),transparent_55%)] opacity-0 transition group-hover:opacity-100" />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)]">
                <FilePlus className="h-5 w-5" />
              </div>
              <div className="relative min-w-0">
                <p className="font-semibold text-[#0B1220]">
                  {t("dashboard.overview.quickActions.newInvoice")}
                </p>
                <p className="mt-0.5 text-sm text-[#4A5B78]">
                  {t("dashboard.overview.quickActions.newInvoiceText")}
                </p>
              </div>
              <ArrowRight className="relative ml-auto h-4 w-4 shrink-0 text-[#C7D0E0] transition group-hover:translate-x-0.5 group-hover:text-[#1A23FF]" />
            </Link>

            <Link href="/tableau-de-bord/clients/nouveau" className={dashboardQuickActionClass}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.14),transparent_55%)] opacity-0 transition group-hover:opacity-100" />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8] text-white shadow-[0_8px_24px_rgba(14,165,233,0.35)]">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="relative min-w-0">
                <p className="font-semibold text-[#0B1220]">
                  {t("dashboard.overview.quickActions.newClient")}
                </p>
                <p className="mt-0.5 text-sm text-[#4A5B78]">
                  {t("dashboard.overview.quickActions.newClientText")}
                </p>
              </div>
              <ArrowRight className="relative ml-auto h-4 w-4 shrink-0 text-[#C7D0E0] transition group-hover:translate-x-0.5 group-hover:text-[#1A23FF]" />
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* === Factures à suivre — chips premium === */}
      {aTraiterMaintenant.length > 0 ? (
        <SectionCard
          icon={Receipt}
          title={t("dashboard.overview.now.title")}
          headerRight={
            <DashboardBadge variant="warning">{aTraiterMaintenant.length}</DashboardBadge>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {aTraiterMaintenant.map((item) => (
              <Link key={item.id} href={item.href} className="dashboard-invoice-chip group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EEF2FF] to-[#E0EAFF] ring-1 ring-[rgba(26,35,255,0.12)]">
                      <Receipt className="h-4 w-4 text-[#1A23FF]" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#0B1220]">{item.numero}</p>
                      <p className="truncate text-sm text-[#4A5B78]">{item.client}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#C7D0E0] transition group-hover:translate-x-0.5 group-hover:text-[#1A23FF]" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[#7B8BA5]">
                    {t("dashboard.overview.now.dueLabel")} {formatDate(item.date)}
                  </p>
                  <span className={`badge-obillz ${item.statutColor}`}>{item.statutLabel}</span>
                </div>
                <p className="text-lg font-semibold tabular-nums tracking-tight text-[#0B1220]">
                  {formatMontant(item.montant)}
                </p>
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* === Activité récente — timeline === */}
      <TableCard title={t("dashboard.overview.lastDocuments.title")}>
        {loading ? (
          <div className="py-12 text-center text-sm text-[#7B8BA5]">
            {t("dashboard.overview.lastDocuments.loading")}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#7B8BA5]">
            {t("dashboard.overview.lastDocuments.empty")}
          </div>
        ) : (
          <div className="dashboard-timeline px-1 py-2 sm:px-2">
            {recentActivity.map((item) => {
              const Icon = activityIcon(item.type);
              const row = (
                <div className="dashboard-timeline-item group">
                  <span className="dashboard-timeline-dot" />
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-3 transition-all duration-200 hover:border-[rgba(26,35,255,0.10)] hover:bg-white/80 hover:shadow-[0_8px_24px_rgba(26,35,255,0.08)]">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EEF2FF] to-[#E0EAFF] ring-1 ring-[rgba(26,35,255,0.12)]">
                        <Icon className="h-4 w-4 text-[#1A23FF]" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#0B1220]">{item.title}</p>
                        <p className="truncate text-sm text-[#4A5B78]">{item.subtitle}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {typeof item.amount === "number" ? (
                        <p
                          className={cn(
                            "font-semibold tabular-nums",
                            item.amount >= 0 ? "text-[#0B1220]" : "text-rose-600"
                          )}
                        >
                          {formatMontant(item.amount)}
                        </p>
                      ) : null}
                      <p className="text-xs text-[#7B8BA5]">{formatRelativeDate(item.date)}</p>
                    </div>
                  </div>
                </div>
              );
              return item.href ? (
                <Link key={item.id} href={item.href} className="block">
                  {row}
                </Link>
              ) : (
                <div key={item.id}>{row}</div>
              );
            })}
          </div>
        )}
      </TableCard>
    </PageLayout>
  );
}
