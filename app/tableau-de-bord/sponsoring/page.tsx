"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Edit, Trash, Handshake, Calendar2, Clock, Wallet } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  EmptyState,
  GlassCard,
  ActionButton,
  DashboardBadge,
  cn,
} from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";

type ContractRow = {
  id: string;
  sponsorName: string;
  title: string;
  amount: number | null;
  startDate: string;
  endDate: string;
  status: "pending" | "active" | "expired";
  sponsorType: string | null;
};

const ROW_GRID =
  "grid grid-cols-1 items-center gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(12rem,1.05fr)_8.75rem_7.5rem_minmax(12.5rem,auto)] lg:gap-4";

export default function SponsoringPage() {
  const { t, locale } = useI18n();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/sponsor-contracts", { cache: "no-store" });
      if (!res.ok) throw new Error(t("dashboard.sponsoring.loadError"));
      const data = await res.json();
      setContracts(data.contracts || []);
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : t("dashboard.sponsoring.loadError"));
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const formatMontant = (n: number | null) => {
    if (n == null || Number.isNaN(n)) return "—";
    return new Intl.NumberFormat(localeToIntl[locale], {
      style: "currency",
      currency: "CHF",
    }).format(n);
  };

  const formatDate = (value: string) => {
    if (!value) return "—";
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(localeToIntl[locale]);
  };

  const statusLabel = (s: string) => {
    if (s === "active") return t("dashboard.sponsoring.status.active");
    if (s === "pending") return t("dashboard.sponsoring.status.pending");
    if (s === "expired") return t("dashboard.sponsoring.status.expired");
    return s;
  };

  const statusVariant = (s: string): "success" | "info" | "danger" | "default" => {
    if (s === "active") return "success";
    if (s === "pending") return "info";
    if (s === "expired") return "danger";
    return "default";
  };

  const sponsorTypeLabel = (type: string | null) => {
    if (!type) return t("dashboard.sponsoring.sponsorTypes.none");
    if (type === "gold") return t("dashboard.sponsoring.sponsorTypes.gold");
    if (type === "silver") return t("dashboard.sponsoring.sponsorTypes.silver");
    if (type === "bronze") return t("dashboard.sponsoring.sponsorTypes.bronze");
    return type;
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("dashboard.sponsoring.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/sponsor-contracts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      alert(t("dashboard.sponsoring.deleteError"));
    }
  };

  const stats = useMemo(() => {
    const totalAmount = contracts.reduce((sum, contract) => {
      if (contract.amount == null || Number.isNaN(contract.amount)) return sum;
      return sum + contract.amount;
    }, 0);
    return {
      totalAmount,
      active: contracts.filter((contract) => contract.status === "active").length,
      expired: contracts.filter((contract) => contract.status === "expired").length,
      upcoming: contracts.filter((contract) => contract.status === "pending").length,
      total: contracts.length,
    };
  }, [contracts]);

  const summaryCards = [
    {
      label: t("dashboard.sponsoring.stats.active"),
      value: stats.active,
      icon: Handshake,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      label: t("dashboard.sponsoring.stats.expired"),
      value: stats.expired,
      icon: Calendar2,
      iconClass: "bg-rose-50 text-rose-600",
    },
    {
      label: t("dashboard.sponsoring.stats.upcoming"),
      value: stats.upcoming,
      icon: Clock,
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      label: t("dashboard.sponsoring.stats.total"),
      value: stats.total,
      icon: Handshake,
      iconClass: "bg-[#EEF2FF] text-[#1A23FF]",
    },
  ];

  return (
    <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.sponsoring.title")}
        subtitle={t("dashboard.sponsoring.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DashboardPrimaryButton href="/tableau-de-bord/sponsoring/nouveau" icon="none" size="sm">
              {t("dashboard.sponsoring.newAction")}
            </DashboardPrimaryButton>
          </div>
        }
      />

      {!loading && !errorMessage && contracts.length > 0 ? (
        <div className="space-y-4 sm:space-y-5">
          <div className="relative flex flex-col overflow-hidden rounded-[1.5rem] border border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFF] via-[#F4F7FF] to-[#EEF2FF] px-6 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
            <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#1A23FF]/[0.06]" />
            <span className="pointer-events-none absolute -bottom-12 right-16 h-36 w-36 rounded-full bg-[#3B82F6]/[0.05]" />
            <div className="relative min-w-0">
              <p className="text-sm font-medium text-[#64748B]">
                {t("dashboard.sponsoring.stats.totalAmount")}
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-[#0F172A] sm:text-4xl">
                {formatMontant(stats.totalAmount)}
              </p>
              <p className="mt-1.5 text-sm text-[#64748B]">
                {t("dashboard.sponsoring.stats.totalAmountHint")}
              </p>
            </div>
            <span className="relative mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#E5E7EB] bg-white/80 px-3 py-1.5 text-xs font-medium text-[#475569] sm:mt-0">
              <Wallet className="h-3.5 w-3.5 text-[#1A23FF]" />
              {stats.total} {t("dashboard.sponsoring.stats.total").toLowerCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {summaryCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex min-w-0 flex-col rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] sm:p-5"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      item.iconClass
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-[#0F172A] sm:text-[1.75rem]">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[1.25rem] border border-[#E5E7EB] bg-white p-12 text-center text-sm text-[#64748B] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {t("dashboard.common.loading")}
        </div>
      ) : errorMessage ? (
        <GlassCard className="border-red-200/80 bg-red-50/50 text-center">
          <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
          <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
        </GlassCard>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={t("dashboard.sponsoring.emptyState")}
          action={
            <DashboardPrimaryButton href="/tableau-de-bord/sponsoring/nouveau" className="inline-flex" icon="none">
              {t("dashboard.sponsoring.emptyCta")}
            </DashboardPrimaryButton>
          }
        />
      ) : (
        <div className="min-w-0 space-y-2">
          {contracts.map((c) => {
            const typeLabel = sponsorTypeLabel(c.sponsorType);
            const hasType = Boolean(c.sponsorType);
            return (
              <article
                key={c.id}
                className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(26,35,255,0.16)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)] sm:px-5"
              >
                <div className={ROW_GRID}>
                  <div className="min-w-0">
                    <Link
                      href={`/tableau-de-bord/sponsoring/${c.id}`}
                      className="block truncate text-sm font-semibold tracking-tight text-[#0F172A] transition-colors hover:text-[#1A23FF]"
                    >
                      {c.sponsorName}
                    </Link>
                    <p className="mt-0.5 truncate text-sm text-[#64748B]">
                      {c.title}
                      {hasType ? ` · ${typeLabel}` : ""}
                    </p>
                  </div>
                  <div className="min-w-0 text-sm text-[#475569]">
                    <p className="truncate tabular-nums">
                      {formatDate(c.startDate)}
                      <span className="mx-1.5 text-[#CBD5E1]">→</span>
                      {formatDate(c.endDate)}
                    </p>
                  </div>
                  <p className="min-w-0 truncate text-sm font-semibold tabular-nums text-[#0F172A] lg:text-right">
                    {formatMontant(c.amount)}
                  </p>
                  <div className="min-w-0">
                    <DashboardBadge variant={statusVariant(c.status)}>
                      {statusLabel(c.status)}
                    </DashboardBadge>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
                    <ActionButton
                      href={`/tableau-de-bord/sponsoring/${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t("dashboard.common.view")}
                    </ActionButton>
                    <ActionButton
                      href={`/tableau-de-bord/sponsoring/${c.id}/modifier`}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      {t("dashboard.common.edit")}
                    </ActionButton>
                    <ActionButton
                      type="button"
                      variant="dangerSoft"
                      className="inline-flex rounded-full p-1.5"
                      title={t("dashboard.common.delete")}
                      onClick={() => void handleDelete(c.id)}
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </ActionButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
