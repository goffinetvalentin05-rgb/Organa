"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { calculerTotalTTC, type LigneDocument } from "@/lib/utils/calculations";
import {
  Users,
  FileText,
  Receipt,
  Handshake,
  Wallet,
  Calendar2,
  ArrowRight,
} from "@/lib/icons";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  ActionButton,
  EntityCard,
  EntityCardList,
  DashboardBadge,
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
  lignes: LigneDocument[];
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
}

interface EventItem {
  id: string;
  name: string;
  start_date: string;
  status: "planned" | "completed";
}

type PlanningGap = {
  id: string;
  name: string;
  free: number;
};

type PriorityAction = {
  id: string;
  title: string;
  detail?: string;
  href: string;
  actionLabel: string;
  badge: string;
  variant: "danger" | "warning" | "info";
  icon: typeof Receipt;
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
    montantCotisationsPayees: 0,
    montantCotisationsAttente: 0,
    montantFacturesAttente: 0,
    devisEnAttente: 0,
    devisEnRetard: 0,
    facturesNonPayees: 0,
    facturesEnRetard: 0,
  });
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [activeSponsors, setActiveSponsors] = useState(0);
  const [unpaidInvoices, setUnpaidInvoices] = useState<DocumentItem[]>([]);
  const [dueExpenses, setDueExpenses] = useState<Depense[]>([]);
  const [planningGaps, setPlanningGaps] = useState<PlanningGap[]>([]);
  const [sponsorAlerts, setSponsorAlerts] = useState({ expired: 0, expiringSoon: 0 });
  const [loading, setLoading] = useState(true);

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

  const isDueSoon = (value?: string, days = 7) => {
    const date = parseDate(value);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(today.getDate() + days);
    return date.getTime() >= today.getTime() && date.getTime() <= limit.getTime();
  };

  const getMontantDocument = (doc: DocumentItem) => {
    if (typeof doc.totalTTC === "number") return doc.totalTTC;
    return calculerTotalTTC(doc.lignes);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          clientsRes,
          documentsRes,
          depensesRes,
          renewalsRes,
          eventsRes,
          sponsorsRes,
          planningsRes,
        ] = await Promise.all([
          fetch("/api/clients", { cache: "no-store" }),
          fetch("/api/documents", { cache: "no-store" }),
          fetch("/api/depenses", { cache: "no-store" }),
          fetch("/api/sponsor-contracts/renewals", { cache: "no-store" }),
          fetch("/api/events", { cache: "no-store" }),
          fetch("/api/sponsor-contracts", { cache: "no-store" }),
          fetch("/api/plannings", { cache: "no-store" }),
        ]);

        const clientsData = clientsRes.ok ? await clientsRes.json() : { clients: [] };
        const documentsData = documentsRes.ok ? await documentsRes.json() : { documents: [] };
        const depensesData = depensesRes.ok ? await depensesRes.json() : { depenses: [] };
        const renewalsData = renewalsRes.ok
          ? await renewalsRes.json()
          : { expiredCount: 0, expiringSoonCount: 0 };
        const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] };
        const sponsorsData = sponsorsRes.ok ? await sponsorsRes.json() : { contracts: [] };
        const planningsData = planningsRes.ok ? await planningsRes.json() : { plannings: [] };

        const clients: Client[] = clientsData.clients || [];
        const documents: DocumentItem[] = documentsData.documents || [];
        const depenses: Depense[] = depensesData.depenses || [];
        const events: EventItem[] = eventsData.events || [];

        const devis = documents.filter((doc) => doc.type === "quote");
        const factures = documents.filter((doc) => doc.type === "invoice");

        const devisEnAttente = devis.filter((q) => q.statut === "envoye").length;
        const devisEnRetard = devis.filter((q) => {
          if (q.statut === "accepte" || q.statut === "paye") return false;
          if (!q.dateEcheance) return false;
          return isPast(q.dateEcheance);
        }).length;

        const facturesOuvertes = factures.filter(
          (f) => f.statut !== "paye" && f.statut !== "brouillon"
        );
        const facturesEnRetard = facturesOuvertes.filter(
          (f) => !!f.dateEcheance && isPast(f.dateEcheance)
        ).length;

        const montantCotisationsPayees = devis
          .filter((d) => d.statut === "accepte" || d.statut === "paye")
          .reduce((total, d) => total + getMontantDocument(d), 0);

        const montantCotisationsAttente = devis
          .filter((d) => d.statut !== "accepte" && d.statut !== "paye" && d.statut !== "refuse")
          .reduce((total, d) => total + getMontantDocument(d), 0);

        const montantFacturesAttente = facturesOuvertes.reduce(
          (total, f) => total + getMontantDocument(f),
          0
        );

        setStats({
          totalClients: clients.length,
          montantCotisationsPayees,
          montantCotisationsAttente,
          montantFacturesAttente,
          devisEnAttente,
          devisEnRetard,
          facturesNonPayees: facturesOuvertes.length,
          facturesEnRetard,
        });

        setUnpaidInvoices(
          facturesOuvertes
            .sort((a, b) => (a.dateEcheance || a.dateCreation).localeCompare(b.dateEcheance || b.dateCreation))
            .slice(0, 3)
        );

        setDueExpenses(
          depenses
            .filter(
              (d) => d.status === "a_payer" && (isPast(d.date) || isDueSoon(d.date, 7))
            )
            .slice(0, 3)
        );

        const upcoming = events.filter((ev) => {
          if (!ev.start_date) return false;
          const d = parseDate(ev.start_date);
          if (!d) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return d.getTime() >= today.getTime() && ev.status !== "completed";
        });
        setUpcomingEventsCount(upcoming.length);

        const contracts = sponsorsData.contracts || [];
        setActiveSponsors(
          contracts.filter((c: { status?: string }) => c.status === "active").length
        );

        setPlanningGaps(
          ((planningsData.plannings || []) as Array<{
            id: string;
            name: string;
            status?: string;
            totalRequired?: number;
            totalAssigned?: number;
          }>)
            .filter((p) => p.status !== "archived")
            .map((p) => ({
              id: p.id,
              name: p.name,
              free: Math.max((p.totalRequired || 0) - (p.totalAssigned || 0), 0),
            }))
            .filter((p) => p.free > 0)
            .slice(0, 2)
        );

        setSponsorAlerts({
          expired: Number(renewalsData.expiredCount) || 0,
          expiringSoon: Number(renewalsData.expiringSoonCount) || 0,
        });
      } catch (error) {
        console.error("[TableauDeBord] Erreur chargement:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat(localeToIntl[locale], {
      style: "currency",
      currency: "CHF",
    }).format(montant);

  const aEncaisser = stats.montantCotisationsAttente + stats.montantFacturesAttente;

  const priorities = useMemo((): PriorityAction[] => {
    const list: PriorityAction[] = [];

    const unpaidMemberships = stats.devisEnAttente + stats.devisEnRetard;
    if (unpaidMemberships > 0) {
      list.push({
        id: "memberships",
        title: t("dashboard.overview.priorities.membershipsUnpaidDetail", {
          count: unpaidMemberships,
        }),
        href: "/tableau-de-bord/devis",
        actionLabel: t("dashboard.overview.priorities.relance"),
        badge: stats.devisEnRetard > 0
          ? t("dashboard.overview.priorities.urgent")
          : t("dashboard.overview.priorities.toHandle"),
        variant: stats.devisEnRetard > 0 ? "danger" : "warning",
        icon: FileText,
      });
    }

    unpaidInvoices.forEach((facture) => {
      const overdue = !!facture.dateEcheance && isPast(facture.dateEcheance);
      list.push({
        id: `invoice-${facture.id}`,
        title: t("dashboard.overview.priorities.invoiceDue", { numero: facture.numero }),
        detail: facture.client?.nom || undefined,
        href: `/tableau-de-bord/factures/${facture.id}`,
        actionLabel: t("dashboard.overview.priorities.view"),
        badge: overdue
          ? t("dashboard.overview.priorities.urgent")
          : t("dashboard.overview.priorities.toHandle"),
        variant: overdue ? "danger" : "warning",
        icon: Receipt,
      });
    });

    dueExpenses.forEach((depense) => {
      list.push({
        id: `expense-${depense.id}`,
        title: t("dashboard.overview.priorities.expenseDue", { label: depense.label }),
        detail: formatMontant(depense.amount),
        href: "/tableau-de-bord/depenses",
        actionLabel: t("dashboard.overview.priorities.view"),
        badge: isPast(depense.date)
          ? t("dashboard.overview.priorities.urgent")
          : t("dashboard.overview.priorities.toHandle"),
        variant: isPast(depense.date) ? "danger" : "warning",
        icon: Wallet,
      });
    });

    planningGaps.forEach((gap) => {
      list.push({
        id: `planning-${gap.id}`,
        title: t("dashboard.overview.priorities.planningSlots", {
          count: gap.free,
          name: gap.name,
        }),
        href: `/tableau-de-bord/plannings/${gap.id}`,
        actionLabel: t("dashboard.overview.priorities.complete"),
        badge: t("dashboard.overview.priorities.toHandle"),
        variant: "info",
        icon: Calendar2,
      });
    });

    if (sponsorAlerts.expired > 0) {
      list.push({
        id: "sponsors-expired",
        title: t("dashboard.overview.priorities.sponsorsExpired"),
        detail: String(sponsorAlerts.expired),
        href: "/tableau-de-bord/sponsoring",
        actionLabel: t("dashboard.overview.priorities.view"),
        badge: t("dashboard.overview.priorities.urgent"),
        variant: "danger",
        icon: Handshake,
      });
    } else if (sponsorAlerts.expiringSoon > 0) {
      list.push({
        id: "sponsors-soon",
        title: t("dashboard.overview.priorities.sponsorsExpiring"),
        detail: String(sponsorAlerts.expiringSoon),
        href: "/tableau-de-bord/sponsoring",
        actionLabel: t("dashboard.overview.priorities.view"),
        badge: t("dashboard.overview.priorities.soon"),
        variant: "warning",
        icon: Handshake,
      });
    }

    return list.slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, unpaidInvoices, dueExpenses, planningGaps, sponsorAlerts, t]);

  const kpis = [
    {
      href: "/tableau-de-bord/clients",
      label: t("dashboard.overview.kpis.activeMembers"),
      value: loading ? "—" : String(stats.totalClients),
      icon: Users,
    },
    {
      href: "/tableau-de-bord/devis",
      label: t("dashboard.overview.kpis.membershipsCollected"),
      value: loading ? "—" : formatMontant(stats.montantCotisationsPayees),
      icon: FileText,
    },
    {
      href: "/tableau-de-bord/sponsoring",
      label: t("dashboard.overview.kpis.activeSponsors"),
      value: loading ? "—" : String(activeSponsors),
      icon: Handshake,
    },
    {
      href: "/tableau-de-bord/evenements",
      label: t("dashboard.overview.kpis.upcomingEventsCount"),
      value: loading ? "—" : String(upcomingEventsCount),
      icon: Calendar2,
    },
  ];

  return (
    <PageLayout maxWidth="7xl" stack="comfortable">
      <Suspense fallback={null}>
        <CheckoutHandler />
      </Suspense>

      <PageHeader
        title={t("dashboard.overview.title")}
        subtitle={t("dashboard.overview.subtitle")}
      />

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
        <Link
          href="/tableau-de-bord/paiements"
          className="relative flex min-h-[17.5rem] flex-col overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#3B82F6] via-[#1A23FF] to-[#102d78] p-7 text-white shadow-[0_16px_40px_rgba(26,35,255,0.28)] sm:p-8"
        >
          <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <span className="pointer-events-none absolute -bottom-16 right-10 h-48 w-48 rounded-full bg-sky-300/10" />
          <p className="relative text-sm font-medium text-white/80">
            {t("dashboard.overview.kpis.toCollect")}
          </p>
          <p className="relative mt-5 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
            {loading ? "—" : formatMontant(aEncaisser)}
          </p>
          <p className="relative mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            {t("dashboard.overview.kpis.toCollectHint")}
          </p>
          <span className="relative mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/35 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
            {t("dashboard.overview.kpis.toCollectCta")}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.href}
                href={kpi.href}
                className="flex flex-col rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] transition hover:border-[rgba(26,35,255,0.16)] sm:p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-[#1A23FF]">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                  {kpi.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[#0F172A] sm:text-[1.75rem]">
                  {kpi.value}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
            {t("dashboard.overview.priorities.title")}
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-[#64748B]">{t("dashboard.common.loading")}</p>
        ) : priorities.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-sm text-emerald-800">
            {t("dashboard.overview.priorities.empty")}
          </div>
        ) : (
          <EntityCardList>
            {priorities.map((item) => {
              const Icon = item.icon;
              return (
                <EntityCard
                  key={item.id}
                  layout="row"
                  href={item.href}
                  leading={
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-[#1A23FF]">
                      <Icon className="h-5 w-5" />
                    </span>
                  }
                  title={item.title}
                  subtitle={item.detail}
                  status={
                    <DashboardBadge variant={item.variant}>{item.badge}</DashboardBadge>
                  }
                  actions={
                    <ActionButton href={item.href} className="inline-flex items-center gap-1.5">
                      {item.actionLabel}
                      <ArrowRight className="h-4 w-4" />
                    </ActionButton>
                  }
                />
              );
            })}
          </EntityCardList>
        )}
      </section>
    </PageLayout>
  );
}
