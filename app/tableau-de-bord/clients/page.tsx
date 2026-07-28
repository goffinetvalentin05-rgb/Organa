"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import DeleteClientButton from "./components/DeleteClientButton";
import { Edit, Users, Filter } from "@/lib/icons";
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
  ListCard,
  EmptyState,
  ActionButton,
  EntityCard,
  EntityCardGrid,
  EntityAvatar,
  EntityMetaRow,
  glassCardClass,
  dashboardSecondaryButtonClass,
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

// Couleurs pour les rôles
const roleColors: Record<string, string> = {
  player: "bg-blue-100 text-blue-700",
  coach: "bg-green-100 text-green-700",
  volunteer: "bg-purple-100 text-purple-700",
  staff: "bg-orange-100 text-orange-700",
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
            <div className={cn("h-64 animate-pulse rounded-2xl bg-slate-200/50", glassCardClass)} />
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
            {!permissionsLoading && canManageMembers && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImportOpen(true);
                }}
                className={dashboardSecondaryButtonClass}
              >
                {t("dashboard.clients.import.action")}
              </button>
            )}
            <DashboardPrimaryButton href="/tableau-de-bord/clients/nouveau">
              {t("dashboard.clients.newClient")}
            </DashboardPrimaryButton>
          </div>
        }
      />

      {clients.length > 0 && (vis.role.enabled || vis.category.enabled) && (
        <ListCard>
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{t("dashboard.clients.filtersLabel")}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <MemberFilterSelects
              members={clients}
              roleFilter={roleFilter}
              categoryFilter={categoryFilter}
              onRoleFilterChange={setRoleFilter}
              onCategoryFilterChange={setCategoryFilter}
              showRole={vis.role.enabled}
              showCategory={vis.category.enabled}
            />

            {(roleFilter || categoryFilter) && (
              <button
                type="button"
                onClick={() => {
                  setRoleFilter("");
                  setCategoryFilter("");
                }}
                className="rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900"
              >
                {t("dashboard.clients.filters.resetFilters")}
              </button>
            )}
          </div>
        </ListCard>
      )}

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
              <EntityCard
                key={client.id}
                href={`/tableau-de-bord/clients/${client.id}`}
                leading={<EntityAvatar label={client.nom || "?"} />}
                title={displayName}
                badges={
                  <>
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
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                        {formatCategoryLabel(client.category, t)}
                      </span>
                    ) : null}
                  </>
                }
                meta={
                  <>
                    {vis.email.enabled ? (
                      <EntityMetaRow
                        label="Email"
                        value={client.email || t("dashboard.clients.notProvided")}
                      />
                    ) : null}
                    {vis.phone.enabled ? (
                      <EntityMetaRow
                        label="Tél."
                        value={client.telephone || t("dashboard.clients.notProvided")}
                      />
                    ) : null}
                    {vis.address.enabled ? (
                      <EntityMetaRow
                        label="Adresse"
                        value={
                          client.adresse || client.postal_code || client.city
                            ? [
                                client.adresse,
                                [client.postal_code, client.city].filter(Boolean).join(" "),
                              ]
                                .filter(Boolean)
                                .join(", ")
                            : t("dashboard.clients.addressNotProvided")
                        }
                      />
                    ) : null}
                  </>
                }
                actions={
                  <>
                    <ActionButton
                      href={`/tableau-de-bord/clients/${client.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      {t("dashboard.clients.editAction")}
                    </ActionButton>
                    <DeleteClientButton
                      clientId={client.id}
                      onDeleted={(removedId) =>
                        setClients((prev) => prev.filter((c) => c.id !== removedId))
                      }
                    />
                  </>
                }
              />
            );
          })}
        </EntityCardGrid>
      )}

      {/* Footer avec compteur */}
      {clients.length > 0 && (
        <div className="text-center text-sm text-slate-400">
          {filteredClients.length === clients.length
            ? `${clients.length} membre${clients.length > 1 ? "s" : ""} au total`
            : `${filteredClients.length} sur ${clients.length} membre${clients.length > 1 ? "s" : ""}`}
        </div>
      )}

      {importModal}
    </PageLayout>
  );
}
