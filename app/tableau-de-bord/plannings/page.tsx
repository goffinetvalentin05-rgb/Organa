"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Trash, ClipboardList, Calendar, Users, FileText, Clock } from "@/lib/icons";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { useI18n } from "@/components/I18nProvider";
import {
  PageLayout,
  PageHeader,
  GlassCard,
  EmptyState,
  ActionButton,
  DashboardBadge,
  cn,
} from "@/components/ui";
import { localeToIntl } from "@/lib/i18n";
import LimitReachedAlert from "@/components/LimitReachedAlert";

interface Planning {
  id: string;
  name: string;
  description?: string;
  date: string;
  status: "draft" | "published" | "archived";
  event?: {
    id: string;
    name: string;
  };
  slotsCount: number;
  totalRequired: number;
  totalAssigned: number;
  fillRate: number;
}

const headerSelectClass =
  "dashboard-select h-[38px] w-full rounded-full border border-[#E5E7EB] bg-white px-3.5 text-sm font-medium text-[#334155] shadow-sm transition hover:border-[rgba(26,35,255,0.22)] focus:border-[#1A23FF] focus:outline-none focus:ring-2 focus:ring-[rgba(26,35,255,0.2)] sm:w-[13.5rem] [color-scheme:light]";

const ROW_GRID =
  "grid grid-cols-1 items-center gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(8.75rem,11rem)_minmax(7.5rem,9.5rem)_minmax(7.5rem,9rem)_6.75rem_minmax(13.5rem,auto)] lg:gap-4";

const dayKey = (value: string) => {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function PlanningsPage() {
  const { t, locale } = useI18n();
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [limitReached, setLimitReached] = useState(false);

  const formatDate = (value: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(localeToIntl[locale], {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    void loadPlannings();
  }, []);

  const loadPlannings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/plannings", { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur lors du chargement des plannings");
      }
      const data = await response.json();
      setPlannings(data?.plannings || []);
    } catch (error: any) {
      console.error("[Plannings] Error:", error);
      setErrorMessage(error.message || t("dashboard.plannings.loadError"));
      setPlannings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce planning ?")) return;
    try {
      const response = await fetch(`/api/plannings/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      await loadPlannings();
    } catch (error: any) {
      console.error("[Plannings] Delete error:", error);
      setErrorMessage(error.message);
    }
  };

  const filteredPlannings = useMemo(() => {
    let result = [...plannings];
    if (filterStatus !== "all") {
      result = result.filter((p) => p.status === filterStatus);
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [plannings, filterStatus]);

  const featuredPlanning = useMemo(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const upcoming = plannings
      .map((planning) => ({ planning, day: dayKey(planning.date) }))
      .filter((item) => item.day)
      .filter((item) => item.day >= todayKey)
      .sort((a, b) => a.day.localeCompare(b.day));
    const next = upcoming[0];
    if (!next) return null;
    return { planning: next.planning, isCurrent: next.day === todayKey };
  }, [plannings]);

  const stats = useMemo(() => {
    const totalAssigned = plannings.reduce((sum, planning) => sum + planning.totalAssigned, 0);
    const totalRequired = plannings.reduce((sum, planning) => sum + planning.totalRequired, 0);
    return {
      toFill: Math.max(0, totalRequired - totalAssigned),
      assignments: totalAssigned,
      drafts: plannings.filter((planning) => planning.status === "draft").length,
    };
  }, [plannings]);

  const getStatusLabel = (status: string) => {
    if (status === "published") return t("dashboard.plannings.status.published");
    if (status === "archived") return t("dashboard.plannings.status.archived");
    return t("dashboard.plannings.status.draft");
  };

  const getStatusVariant = (status: string): "success" | "warning" | "default" => {
    if (status === "published") return "success";
    if (status === "archived") return "default";
    return "warning";
  };

  const getFillRateColor = (rate: number) => {
    if (rate === 100) return "text-green-600";
    if (rate >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getFillBarClass = (rate: number) => {
    if (rate === 100) return "bg-emerald-500";
    if (rate >= 50) return "bg-amber-400";
    return "bg-rose-400";
  };

  const showDashboard = !loading && !errorMessage && plannings.length > 0;

  return (
    <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.plannings.title")}
        subtitle={t("dashboard.plannings.subtitle")}
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={headerSelectClass}
            >
              <option value="all">{t("dashboard.plannings.filters.all")}</option>
              <option value="draft">{t("dashboard.plannings.filters.draft")}</option>
              <option value="published">{t("dashboard.plannings.filters.published")}</option>
              <option value="archived">{t("dashboard.plannings.filters.archived")}</option>
            </select>
            <DashboardPrimaryButton href="/tableau-de-bord/plannings/nouveau" size="sm">
              {t("dashboard.plannings.newPlanning")}
            </DashboardPrimaryButton>
          </div>
        }
      />

      {limitReached && (
        <LimitReachedAlert message="Limite de plannings atteinte. Passez au plan Pro pour en créer plus." />
      )}

      {showDashboard ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <div className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFF] via-[#F4F7FF] to-[#EEF2FF] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] sm:p-5">
            <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[#1A23FF]/[0.06]" />
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1A23FF] shadow-sm">
              <Calendar className="h-5 w-5" />
            </span>
            <p className="relative mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
              {featuredPlanning?.isCurrent
                ? t("dashboard.plannings.stats.currentPlanning")
                : t("dashboard.plannings.stats.nextPlanning")}
            </p>
            <p className="relative mt-1.5 truncate text-lg font-semibold tracking-tight text-[#0F172A] sm:text-xl">
              {featuredPlanning
                ? featuredPlanning.planning.name
                : t("dashboard.plannings.stats.noneUpcoming")}
            </p>
            {featuredPlanning ? (
              <p className="relative mt-0.5 truncate text-xs text-[#64748B]">
                {formatDate(featuredPlanning.planning.date)}
              </p>
            ) : null}
          </div>

          {[
            {
              label: t("dashboard.plannings.stats.toFill"),
              value: stats.toFill,
              icon: Clock,
              iconClass: "bg-amber-50 text-amber-600",
            },
            {
              label: t("dashboard.plannings.stats.assignments"),
              value: stats.assignments,
              icon: Users,
              iconClass: "bg-emerald-50 text-emerald-600",
            },
            {
              label: t("dashboard.plannings.stats.drafts"),
              value: stats.drafts,
              icon: FileText,
              iconClass: "bg-[#EEF2FF] text-[#1A23FF]",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex min-w-0 flex-col rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] sm:p-5"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    item.iconClass
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                  {item.label}
                </p>
                <p className="mt-1.5 truncate text-2xl font-semibold tracking-tight tabular-nums text-[#0F172A] sm:text-[1.75rem]">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[1.25rem] border border-[#E5E7EB] bg-white p-12 text-center text-sm text-[#64748B] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {t("dashboard.plannings.loading")}
        </div>
      ) : errorMessage ? (
        <GlassCard className="border-red-200/80 bg-red-50/50 text-center">
          <p className="font-medium text-red-700">Erreur de chargement</p>
          <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
        </GlassCard>
      ) : filteredPlannings.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t("dashboard.plannings.emptyState")}
          action={
            <DashboardPrimaryButton href="/tableau-de-bord/plannings/nouveau" className="inline-flex">
              {t("dashboard.plannings.emptyCta")}
            </DashboardPrimaryButton>
          }
        />
      ) : (
        <div className="min-w-0 space-y-2">
          {filteredPlannings.map((planning) => {
            const fillWidth = Math.min(100, Math.max(0, planning.fillRate));
            return (
              <article
                key={planning.id}
                className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(26,35,255,0.16)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)] sm:px-5"
              >
                <div className={ROW_GRID}>
                  <div className="min-w-0">
                    <Link
                      href={`/tableau-de-bord/plannings/${planning.id}`}
                      className="block truncate text-sm font-semibold tracking-tight text-[#0F172A] transition-colors hover:text-[#1A23FF]"
                    >
                      {planning.name}
                    </Link>
                    {planning.description ? (
                      <p className="mt-0.5 truncate text-sm text-[#64748B]">{planning.description}</p>
                    ) : null}
                    {planning.event ? (
                      <span className="mt-1.5 inline-flex rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#1A23FF]">
                        {planning.event.name}
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#94A3B8]">
                      {t("dashboard.common.date")}
                    </p>
                    <p className="mt-0.5 truncate text-sm tabular-nums text-[#334155]">
                      {formatDate(planning.date)}
                    </p>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div>
                      <p className="text-[11px] text-[#94A3B8]">{t("dashboard.plannings.slots")}</p>
                      <p className="truncate text-sm font-medium tabular-nums text-[#0F172A]">
                        {planning.slotsCount}{" "}
                        {planning.slotsCount > 1
                          ? t("dashboard.plannings.slots")
                          : t("dashboard.plannings.slot")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#94A3B8]">{t("dashboard.plannings.assignments")}</p>
                      <p className="truncate text-sm font-medium tabular-nums text-[#0F172A]">
                        {planning.totalAssigned} / {planning.totalRequired}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className={cn("text-[15px] font-semibold tabular-nums", getFillRateColor(planning.fillRate))}>
                      {planning.fillRate}%
                      <span className="ml-1 text-xs font-medium text-[#94A3B8]">
                        {t("dashboard.plannings.complete")}
                      </span>
                    </p>
                    <div className="mt-1.5 h-1.5 w-full max-w-[6.5rem] overflow-hidden rounded-full bg-[#E5E7EB]">
                      <div
                        className={cn("h-full rounded-full", getFillBarClass(planning.fillRate))}
                        style={{ width: `${fillWidth}%` }}
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <DashboardBadge variant={getStatusVariant(planning.status)}>
                      {getStatusLabel(planning.status)}
                    </DashboardBadge>
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-2 overflow-visible lg:flex-nowrap lg:justify-end">
                    <ActionButton
                      href={`/tableau-de-bord/plannings/${planning.id}`}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t("dashboard.plannings.viewManage")}
                    </ActionButton>
                    <button
                      type="button"
                      onClick={() => handleDelete(planning.id)}
                      title={t("dashboard.common.delete")}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
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
