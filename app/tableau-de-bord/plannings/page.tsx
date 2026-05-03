"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Trash, ClipboardList, Calendar, Users } from "@/lib/icons";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { useI18n } from "@/components/I18nProvider";
import {
  PageLayout,
  PageHeader,
  TableCard,
  GlassCard,
  EmptyState,
  ActionButton,
  dashboardListRowClass,
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
    if (rate === 100) return "text-green-600 bg-green-50";
    if (rate >= 50) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <PageLayout maxWidth="7xl" className="space-y-6 pb-10">
      <PageHeader
        title={t("dashboard.plannings.title")}
        subtitle={t("dashboard.plannings.subtitle")}
        actions={
          <>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/35"
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

      <TableCard bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-slate-500">{t("dashboard.plannings.loading")}</div>
        ) : errorMessage ? (
          <GlassCard className="m-5 border-red-200/80 bg-red-50/50 text-center">
            <p className="font-medium text-red-700">Erreur de chargement</p>
            <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
          </GlassCard>
        ) : filteredPlannings.length === 0 ? (
          <EmptyState
            embedded
            icon={ClipboardList}
            title={t("dashboard.plannings.emptyState")}
            action={
              <DashboardPrimaryButton href="/tableau-de-bord/plannings/nouveau" className="inline-flex">
                {t("dashboard.plannings.emptyCta")}
              </DashboardPrimaryButton>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPlannings.map((planning) => (
              <div key={planning.id} className={dashboardListRowClass}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">{planning.name}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(planning.status)}`}>
                          {getStatusLabel(planning.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                          {formatDate(planning.date)}
                        </span>
                        {planning.event ? (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                            {planning.event.name}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1.5">
                          <ClipboardList className="h-4 w-4 shrink-0 text-slate-400" />
                          {planning.slotsCount}{" "}
                          {planning.slotsCount > 1 ? t("dashboard.plannings.slots") : t("dashboard.plannings.slot")}
                        </span>
                      </div>
                      {planning.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{planning.description}</p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-4">
                        <div className="text-center">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t("dashboard.plannings.assignments")}
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <Users className="h-4 w-4 text-slate-500" />
                            <span className="font-semibold text-slate-900">
                              {planning.totalAssigned} / {planning.totalRequired}
                            </span>
                          </div>
                        </div>
                        <div className={`rounded-xl px-4 py-2 ${getFillRateColor(planning.fillRate)}`}>
                          <p className="text-2xl font-bold">{planning.fillRate}%</p>
                          <p className="text-xs font-medium opacity-90">{t("dashboard.plannings.complete")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-100 pt-3">
                    <ActionButton href={`/tableau-de-bord/plannings/${planning.id}`} className="inline-flex items-center gap-1.5 p-2">
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">{t("dashboard.plannings.viewManage")}</span>
                    </ActionButton>
                    <ActionButton
                      type="button"
                      variant="dangerSoft"
                      onClick={() => handleDelete(planning.id)}
                      title={t("dashboard.common.delete")}
                      className="inline-flex items-center justify-center p-2"
                    >
                      <Trash className="h-4 w-4" />
                    </ActionButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </TableCard>
    </PageLayout>
  );
}
