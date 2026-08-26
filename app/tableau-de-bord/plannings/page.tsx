"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Trash, ClipboardList } from "@/lib/icons";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { useI18n } from "@/components/I18nProvider";
import {
  PageLayout,
  PageHeader,
  GlassCard,
  EmptyState,
  ActionButton,
  EntityCard,
  EntityCardList,
  EntityMetaRow,
  dashboardInputClass,
  dashboardSelectClass,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700";
      case "archived":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "published") return t("dashboard.plannings.status.published");
    if (status === "archived") return t("dashboard.plannings.status.archived");
    return t("dashboard.plannings.status.draft");
  };

  const getFillRateColor = (rate: number) => {
    if (rate === 100) return "text-green-600";
    if (rate >= 50) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <PageLayout maxWidth="7xl" className="pb-10">
      <PageHeader
        title={t("dashboard.plannings.title")}
        subtitle={t("dashboard.plannings.subtitle")}
        actions={
          <>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={dashboardSelectClass}
            >
              <option value="all">{t("dashboard.plannings.filters.all")}</option>
              <option value="draft">{t("dashboard.plannings.filters.draft")}</option>
              <option value="published">{t("dashboard.plannings.filters.published")}</option>
              <option value="archived">{t("dashboard.plannings.filters.archived")}</option>
            </select>
            <DashboardPrimaryButton href="/tableau-de-bord/plannings/nouveau">
              {t("dashboard.plannings.newPlanning")}
            </DashboardPrimaryButton>
          </>
        }
      />

      {limitReached && (
        <LimitReachedAlert message="Limite de plannings atteinte. Passez au plan Pro pour en créer plus." />
      )}

      {loading ? (
        <div className="rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white p-12 text-center text-slate-500 shadow-sm">
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
        <EntityCardList>
          {filteredPlannings.map((planning) => (
            <EntityCard
              key={planning.id}
              layout="row"
              href={`/tableau-de-bord/plannings/${planning.id}`}
              title={planning.name}
              subtitle={planning.description || undefined}
              status={
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(planning.status)}`}>
                  {getStatusLabel(planning.status)}
                </span>
              }
              badges={
                planning.event ? (
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800">
                    {planning.event.name}
                  </span>
                ) : null
              }
              amount={
                <>
                  <span className={getFillRateColor(planning.fillRate)}>
                    {planning.fillRate}%
                  </span>
                  <span className="ml-1.5 text-sm font-medium text-[#94A3B8]">
                    {t("dashboard.plannings.complete")}
                  </span>
                </>
              }
              meta={
                <>
                  <EntityMetaRow inline label={t("dashboard.common.date")} value={formatDate(planning.date)} />
                  <EntityMetaRow
                    inline
                    label={t("dashboard.plannings.slots")}
                    value={`${planning.slotsCount} ${
                      planning.slotsCount > 1
                        ? t("dashboard.plannings.slots")
                        : t("dashboard.plannings.slot")
                    }`}
                  />
                  <EntityMetaRow
                    inline
                    label={t("dashboard.plannings.assignments")}
                    value={`${planning.totalAssigned} / ${planning.totalRequired}`}
                  />
                </>
              }
              actions={
                <>
                  <ActionButton
                    href={`/tableau-de-bord/plannings/${planning.id}`}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    {t("dashboard.plannings.viewManage")}
                  </ActionButton>
                  <ActionButton
                    type="button"
                    variant="dangerSoft"
                    onClick={() => handleDelete(planning.id)}
                    title={t("dashboard.common.delete")}
                    className="inline-flex p-2"
                  >
                    <Trash className="h-4 w-4" />
                  </ActionButton>
                </>
              }
            />
          ))}
        </EntityCardList>
      )}
    </PageLayout>
  );
}
