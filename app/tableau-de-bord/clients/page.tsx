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
  EntityCardGrid,
  DashboardBadge,
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

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}

function memberRoleBadgeVariant(
  role: string
): "info" | "success" | "warning" | "neutral" | "default" {
  if (role === "coach") return "success";
  if (role === "staff" || role === "sponsor") return "warning";
  if (
    role === "player" ||
    role === "committee" ||
    role === "president" ||
    role === "vice_president" ||
    role === "treasurer" ||
    role === "secretary" ||
    role === "bar_manager" ||
    role === "sponsoring_manager" ||
    role === "equipment_manager" ||
    role === "events_manager"
  ) {
    return "info";
  }
  return "neutral";
}

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
            const roleLabel = vis.role.enabled ? formatRoleLabel(client.role, t) : null;
            const categoryLabel =
              vis.category.enabled && client.category
                ? formatCategoryLabel(client.category, t)
                : null;
            const hasBadges = Boolean(roleLabel || categoryLabel);

            return (
              <article
                key={client.id}
                className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFF] via-[#F4F7FF] to-[#EEF2FF] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(26,35,255,0.16)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)]"
              >
                <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#1A23FF]/[0.06]" />
                <span className="pointer-events-none absolute -bottom-12 right-4 h-32 w-32 rounded-full bg-[#3B82F6]/[0.05]" />

                <Link
                  href={`/tableau-de-bord/clients/${client.id}`}
                  className="relative flex min-w-0 flex-1 flex-col outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1A23FF]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E5E7EB]">
                    <span className="text-[13px] font-semibold tracking-[0.06em] text-[#1A23FF]">
                      {memberInitials(displayName)}
                    </span>
                  </div>

                  <h3 className="mt-3.5 truncate text-[1.05rem] font-semibold tracking-tight text-[#0F172A] transition-colors group-hover:text-[#1A23FF]">
                    {displayName}
                  </h3>

                  {hasBadges ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {roleLabel ? (
                        <DashboardBadge variant={memberRoleBadgeVariant(client.role)}>
                          {roleLabel}
                        </DashboardBadge>
                      ) : null}
                      {categoryLabel ? (
                        <DashboardBadge variant="neutral">{categoryLabel}</DashboardBadge>
                      ) : null}
                    </div>
                  ) : null}
                </Link>

                <div className="relative mt-5 flex items-center gap-2">
                  <ActionButton
                    href={`/tableau-de-bord/clients/${client.id}/edit`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    {t("dashboard.clients.editAction")}
                  </ActionButton>
                  <DeleteClientButton
                    iconOnly
                    clientId={client.id}
                    className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#94A3B8] transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
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
