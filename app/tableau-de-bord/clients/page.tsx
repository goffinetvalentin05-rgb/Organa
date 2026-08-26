"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import DeleteClientButton from "./components/DeleteClientButton";
import { Edit, Users, Filter, UserCheck, Shield } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import ImportMembersModal from "@/components/members/ImportMembersModal";
import { useMemberFieldSettings } from "@/components/member-fields/MemberFieldSettingsProvider";
import { usePermissions } from "@/lib/auth/permissions-client";
import MemberFilterSelects from "@/components/members/MemberFilterSelects";
import { formatCategoryLabel, formatRoleLabel } from "@/lib/members/taxonomy";
import {
  PageLayout,
  PageHeader,
  GlassCard,
  EmptyState,
  ActionButton,
  EntityAvatar,
  EntityCardGrid,
  dashboardSelectClass,
  cn,
} from "@/components/ui";

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  postal_code: string | null;
  city: string | null;
  user_id: string;
  role: string;
  category: string | null;
  prenom?: string | null;
}

const COMMITTEE_ROLES = new Set([
  "president",
  "vice_president",
  "treasurer",
  "secretary",
  "committee",
]);

const headerButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#334155] shadow-sm transition hover:border-[rgba(26,35,255,0.22)] hover:text-[#1A23FF]";

const roleColors: Record<string, string> = {
  player: "bg-blue-50 text-blue-700",
  coach: "bg-emerald-50 text-emerald-700",
  volunteer: "bg-violet-50 text-violet-700",
  staff: "bg-orange-50 text-orange-700",
  committee: "bg-[#EEF2FF] text-[#1A23FF]",
  president: "bg-[#EEF2FF] text-[#1A23FF]",
  vice_president: "bg-[#EEF2FF] text-[#1A23FF]",
  treasurer: "bg-[#EEF2FF] text-[#1A23FF]",
  secretary: "bg-[#EEF2FF] text-[#1A23FF]",
};

export default function ClientsPage() {
  const { t } = useI18n();
  const vis = useMemberFieldSettings();
  const { has: hasPermission, loading: permissionsLoading } = usePermissions();
  const canManageMembers = hasPermission("manage_members");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  
  // Filtres
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(t("dashboard.clients.authError"));
        }
        if (res.status === 403) {
          throw new Error(t("dashboard.clients.loadForbidden"));
        }
        throw new Error(t("dashboard.clients.loadErrorDetail"));
      }
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Charger les clients
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleImportSuccess = useCallback(
    (imported: number, duplicates: number) => {
      toast.success(
        t("dashboard.clients.import.toastSuccess")
          .replace("{imported}", String(imported))
          .replace("{duplicates}", String(duplicates))
      );
      setImportOpen(false);
      fetchClients();
    },
    [fetchClients, t]
  );

  // Filtrer les clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (vis.role.enabled && roleFilter && client.role !== roleFilter) return false;
      if (vis.category.enabled && categoryFilter && client.category !== categoryFilter)
        return false;
      return true;
    });
  }, [clients, roleFilter, categoryFilter, vis.role.enabled, vis.category.enabled]);

  const memberStats = useMemo(
    () => ({
      total: clients.length,
      committee: clients.filter((client) => COMMITTEE_ROLES.has(client.role)).length,
      coaches: clients.filter((client) => client.role === "coach").length,
      players: clients.filter((client) => client.role === "player").length,
    }),
    [clients]
  );

  const filtersAvailable = vis.role.enabled || vis.category.enabled;
  const filtersActive = Boolean(roleFilter || categoryFilter);
  const showFilters = filtersAvailable && (filtersOpen || filtersActive);

  useEffect(() => {
    if (!vis.role.enabled) setRoleFilter("");
    if (!vis.category.enabled) setCategoryFilter("");
  }, [vis.role.enabled, vis.category.enabled]);

  const handleCloseImport = useCallback(() => setImportOpen(false), []);

  const importModal = (
    <ImportMembersModal
      open={importOpen}
      onClose={handleCloseImport}
      existingMembers={clients.map((c) => ({ nom: c.nom, email: c.email }))}
      onImported={fetchClients}
      onSuccess={handleImportSuccess}
    />
  );

  if (loading) {
    return (
      <>
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-1/3 rounded-xl bg-slate-200/80" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="h-28 rounded-2xl bg-slate-200/50" />
              <div className="h-28 rounded-2xl bg-slate-200/50" />
              <div className="h-28 rounded-2xl bg-slate-200/50" />
              <div className="h-28 rounded-2xl bg-slate-200/50" />
            </div>
          </div>
        </div>
        {importModal}
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="mx-auto max-w-7xl">
          <GlassCard className="border-red-200/90 bg-gradient-to-br from-red-50/90 to-white text-center">
            <p className="font-medium text-red-700">{t("dashboard.clients.loadError")}</p>
            <p className="mt-2 text-sm text-red-600/90">{error}</p>
          </GlassCard>
        </div>
        {importModal}
      </>
    );
  }

  return (
    <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.clients.title")}
        subtitle={t("dashboard.clients.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {clients.length > 0 && filtersAvailable ? (
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={cn(
                  headerButtonClass,
                  (filtersOpen || filtersActive) && "border-[rgba(26,35,255,0.28)] text-[#1A23FF]"
                )}
                aria-expanded={showFilters}
              >
                <Filter className="h-4 w-4" />
                {t("dashboard.clients.filterAction")}
                {filtersActive ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1A23FF]" />
                ) : null}
              </button>
            ) : null}
            {!permissionsLoading && canManageMembers ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImportOpen(true);
                }}
                className={headerButtonClass}
              >
                {t("dashboard.clients.import.action")}
              </button>
            ) : null}
            <DashboardPrimaryButton href="/tableau-de-bord/clients/nouveau" size="sm">
              {t("dashboard.clients.newClient")}
            </DashboardPrimaryButton>
          </div>
        }
      />

      {clients.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[
            {
              label: t("dashboard.clients.stats.total"),
              value: memberStats.total,
              icon: Users,
              iconClass: "bg-[#EEF2FF] text-[#1A23FF]",
            },
            {
              label: t("dashboard.clients.stats.committee"),
              value: memberStats.committee,
              icon: Shield,
              iconClass: "bg-[#EEF2FF] text-[#1A23FF]",
            },
            {
              label: t("dashboard.clients.stats.coaches"),
              value: memberStats.coaches,
              icon: UserCheck,
              iconClass: "bg-emerald-50 text-emerald-600",
            },
            {
              label: t("dashboard.clients.stats.players"),
              value: memberStats.players,
              icon: Users,
              iconClass: "bg-blue-50 text-blue-600",
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
      ) : null}

      {showFilters && clients.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:flex-wrap sm:items-center sm:px-5">
          <MemberFilterSelects
            members={clients}
            roleFilter={roleFilter}
            categoryFilter={categoryFilter}
            onRoleFilterChange={setRoleFilter}
            onCategoryFilterChange={setCategoryFilter}
            showRole={vis.role.enabled}
            showCategory={vis.category.enabled}
            className={cn(dashboardSelectClass, "sm:max-w-[16rem]")}
          />
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setRoleFilter("");
                setCategoryFilter("");
              }}
              className="rounded-full px-3 py-2 text-sm font-medium text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            >
              {t("dashboard.clients.filters.resetFilters")}
            </button>
          ) : null}
        </div>
      ) : null}

      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            clients.length === 0
              ? t("dashboard.clients.emptyState")
              : t("dashboard.clients.noMatchFilter")
          }
          action={
            clients.length === 0 ? (
              <DashboardPrimaryButton href="/tableau-de-bord/clients/nouveau" className="inline-flex">
                {t("dashboard.clients.emptyCta")}
              </DashboardPrimaryButton>
            ) : null
          }
        />
      ) : (
        <EntityCardGrid>
          {filteredClients.map((client) => {
            const displayName = `${client.prenom ? `${client.prenom} ` : ""}${
              client.nom || t("dashboard.clients.noName")
            }`;
            return (
              <article
                key={client.id}
                className="group flex h-full flex-col rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[rgba(26,35,255,0.16)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:p-6"
              >
                <Link
                  href={`/tableau-de-bord/clients/${client.id}`}
                  className="flex min-w-0 flex-1 flex-col"
                >
                  <EntityAvatar label={displayName} />
                  <h3 className="mt-4 truncate text-base font-semibold tracking-tight text-[#0F172A] transition-colors group-hover:text-[#1A23FF]">
                    {displayName}
                  </h3>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {vis.role.enabled ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          roleColors[client.role] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {formatRoleLabel(client.role, t)}
                      </span>
                    ) : null}
                    {vis.category.enabled && client.category ? (
                      <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#475569]">
                        {formatCategoryLabel(client.category, t)}
                      </span>
                    ) : null}
                  </div>
                </Link>
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[rgba(15,23,42,0.06)] pt-4">
                  <ActionButton
                    href={`/tableau-de-bord/clients/${client.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    {t("dashboard.clients.editAction")}
                  </ActionButton>
                  <DeleteClientButton
                    clientId={client.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    onDeleted={(removedId) =>
                      setClients((prev) => prev.filter((c) => c.id !== removedId))
                    }
                  />
                </div>
              </article>
            );
          })}
        </EntityCardGrid>
      )}

      {clients.length > 0 ? (
        <div className="text-center text-sm text-[#94A3B8]">
          {filteredClients.length === clients.length
            ? `${clients.length} membre${clients.length > 1 ? "s" : ""} au total`
            : `${filteredClients.length} sur ${clients.length} membre${clients.length > 1 ? "s" : ""}`}
        </div>
      ) : null}

      {importModal}
    </PageLayout>
  );
}
