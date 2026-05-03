"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import DeleteClientButton from "./components/DeleteClientButton";
import { Edit, Users, Filter } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { useMemberFieldSettings } from "@/components/member-fields/MemberFieldSettingsProvider";

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
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Charger les clients
  useEffect(() => {
    async function fetchClients() {
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
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [t]);

  // Filtrer les clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (vis.role.enabled && roleFilter && client.role !== roleFilter) return false;
      if (vis.category.enabled && categoryFilter && client.category !== categoryFilter)
        return false;
      return true;
    });
  }, [clients, roleFilter, categoryFilter, vis.role.enabled, vis.category.enabled]);

  // Obtenir les catégories uniques présentes
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    clients.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats);
  }, [clients]);

  useEffect(() => {
    if (!vis.role.enabled) setRoleFilter("");
    if (!vis.category.enabled) setCategoryFilter("");
  }, [vis.role.enabled, vis.category.enabled]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 rounded-2xl border border-red-200 p-8 text-center">
          <p className="text-red-600 font-medium mb-2">
            {t("dashboard.clients.loadError")}
          </p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {t("dashboard.clients.title")}
          </h1>
          <p className="mt-1 text-slate-500">
            {t("dashboard.clients.subtitle")}
          </p>
        </div>
        <DashboardPrimaryButton href="/tableau-de-bord/clients/nouveau">
          {t("dashboard.clients.newClient")}
        </DashboardPrimaryButton>
      </div>

      {/* Filtres */}
      {clients.length > 0 && (vis.role.enabled || vis.category.enabled) && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{t("dashboard.clients.filtersLabel")}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {vis.role.enabled && (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("dashboard.clients.filters.allRoles")}</option>
                <option value="player">{t("dashboard.clients.roles.player")}</option>
                <option value="coach">{t("dashboard.clients.roles.coach")}</option>
                <option value="volunteer">{t("dashboard.clients.roles.volunteer")}</option>
                <option value="staff">{t("dashboard.clients.roles.staff")}</option>
              </select>
            )}

            {vis.category.enabled && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("dashboard.clients.filters.allCategories")}</option>
                <option value="first_team">{t("dashboard.clients.categories.first_team")}</option>
                <option value="second_team">{t("dashboard.clients.categories.second_team")}</option>
                <option value="junior">{t("dashboard.clients.categories.junior")}</option>
                <option value="president">{t("dashboard.clients.categories.president")}</option>
                <option value="treasurer">{t("dashboard.clients.categories.treasurer")}</option>
                <option value="secretary">{t("dashboard.clients.categories.secretary")}</option>
                <option value="other">{t("dashboard.clients.categories.other")}</option>
              </select>
            )}

            {(roleFilter || categoryFilter) && (
              <button
                type="button"
                onClick={() => {
                  setRoleFilter("");
                  setCategoryFilter("");
                }}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t("dashboard.clients.filters.resetFilters")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Liste des clients */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">
              {clients.length === 0 
                ? t("dashboard.clients.emptyState")
                : "Aucun membre ne correspond aux filtres sélectionnés."
              }
            </p>
            {clients.length === 0 && (
              <DashboardPrimaryButton href="/tableau-de-bord/clients/nouveau" className="inline-flex">
                {t("dashboard.clients.emptyCta")}
              </DashboardPrimaryButton>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="p-5 md:p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <Link
                    href={`/tableau-de-bord/clients/${client.id}`}
                    className="flex items-start gap-4 min-w-0 flex-1 text-left group rounded-xl outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 group-hover:opacity-95 transition-opacity"
                      style={{ backgroundColor: "var(--obillz-hero-blue)" }}
                    >
                      {(client.nom || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                          {client.prenom ? `${client.prenom} ` : ""}
                          {client.nom || t("dashboard.clients.noName")}
                        </h3>
                        {vis.role.enabled && (
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleColors[client.role] || "bg-slate-100 text-slate-700"}`}
                          >
                            {t(`dashboard.clients.roles.${client.role}`) || client.role}
                          </span>
                        )}
                        {vis.category.enabled && client.category && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                            {t(`dashboard.clients.categories.${client.category}`) ||
                              client.category}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 grid gap-1 text-sm">
                        {vis.email.enabled && (
                          <p className="text-slate-500 flex items-center gap-2">
                            <span className="text-slate-400 w-16 shrink-0">Email</span>
                            <span className="truncate">
                              {client.email || t("dashboard.clients.notProvided")}
                            </span>
                          </p>
                        )}
                        {vis.phone.enabled && (
                          <p className="text-slate-500 flex items-center gap-2">
                            <span className="text-slate-400 w-16 shrink-0">Tél.</span>
                            <span>{client.telephone || t("dashboard.clients.notProvided")}</span>
                          </p>
                        )}
                        {vis.address.enabled && (
                          <p className="text-slate-500 flex items-center gap-2">
                            <span className="text-slate-400 w-16 shrink-0">Adresse</span>
                            <span className="truncate">
                              {client.adresse || client.postal_code || client.city
                                ? [
                                    client.adresse,
                                    [client.postal_code, client.city].filter(Boolean).join(" "),
                                  ]
                                    .filter(Boolean)
                                    .join(", ")
                                : t("dashboard.clients.addressNotProvided")}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 md:ml-4 shrink-0">
                    <Link
                      href={`/tableau-de-bord/clients/${client.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all text-sm flex items-center gap-2 border border-slate-200 shadow-sm"
                    >
                      <Edit className="w-4 h-4" />
                      {t("dashboard.clients.editAction")}
                    </Link>
                    <DeleteClientButton
                      clientId={client.id}
                      onDeleted={(removedId) =>
                        setClients((prev) => prev.filter((c) => c.id !== removedId))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer avec compteur */}
      {clients.length > 0 && (
        <div className="text-center text-sm text-slate-400">
          {filteredClients.length === clients.length 
            ? `${clients.length} membre${clients.length > 1 ? "s" : ""} au total`
            : `${filteredClients.length} sur ${clients.length} membre${clients.length > 1 ? "s" : ""}`
          }
        </div>
      )}
    </div>
  );
}
