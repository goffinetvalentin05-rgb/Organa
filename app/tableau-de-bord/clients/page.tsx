"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import DeleteClientButton from "./components/DeleteClientButton";
import { Info, Plus, Users, Filter } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";

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
        const res = await fetch("/api/clients");
        if (!res.ok) {
          throw new Error("Erreur lors du chargement");
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
  }, []);

  // Filtrer les clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (roleFilter && client.role !== roleFilter) return false;
      if (categoryFilter && client.category !== categoryFilter) return false;
      return true;
    });
  }, [clients, roleFilter, categoryFilter]);

  // Obtenir les catégories uniques présentes
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    clients.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats);
  }, [clients]);

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
        <Link
          href="/tableau-de-bord/clients/nouveau"
          className="btn-obillz"
        >
          <Plus className="w-5 h-5" />
          {t("dashboard.clients.newClient")}
        </Link>
      </div>

      {/* Filtres */}
      {clients.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filtres</span>
          </div>
          <div className="flex flex-wrap gap-3">
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

            {(roleFilter || categoryFilter) && (
              <button
                onClick={() => {
                  setRoleFilter("");
                  setCategoryFilter("");
                }}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}

      {/* Message informatif */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-amber-900">
              {t("dashboard.clients.editDisabledTitle")}
            </p>
            <p className="text-sm text-amber-700 mt-1">
              {t("dashboard.clients.editDisabledText")}
            </p>
          </div>
        </div>
      </div>

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
              <Link
                href="/tableau-de-bord/clients/nouveau"
                className="btn-obillz inline-flex"
              >
                <Plus className="w-5 h-5" />
                {t("dashboard.clients.emptyCta")}
              </Link>
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
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                      style={{ backgroundColor: "var(--obillz-hero-blue)" }}
                    >
                      {(client.nom || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {client.nom || t("dashboard.clients.noName")}
                        </h3>
                        {/* Badge Rôle */}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleColors[client.role] || "bg-slate-100 text-slate-700"}`}>
                          {t(`dashboard.clients.roles.${client.role}`) || client.role}
                        </span>
                        {/* Badge Catégorie */}
                        {client.category && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                            {t(`dashboard.clients.categories.${client.category}`) || client.category}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 grid gap-1 text-sm">
                        <p className="text-slate-500 flex items-center gap-2">
                          <span className="text-slate-400 w-16 shrink-0">Email</span>
                          <span className="truncate">{client.email || t("dashboard.clients.notProvided")}</span>
                        </p>
                        <p className="text-slate-500 flex items-center gap-2">
                          <span className="text-slate-400 w-16 shrink-0">Tél.</span>
                          <span>{client.telephone || t("dashboard.clients.notProvided")}</span>
                        </p>
                        <p className="text-slate-500 flex items-center gap-2">
                          <span className="text-slate-400 w-16 shrink-0">Adresse</span>
                          <span className="truncate">
                            {client.adresse || client.postal_code || client.city
                              ? [
                                  client.adresse,
                                  [client.postal_code, client.city].filter(Boolean).join(" ")
                                ].filter(Boolean).join(", ")
                              : t("dashboard.clients.addressNotProvided")}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:ml-4">
                    <DeleteClientButton clientId={client.id} />
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
