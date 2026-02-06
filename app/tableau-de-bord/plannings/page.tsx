"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Trash, ClipboardList, Calendar, Users } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
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
      setErrorMessage(error.message || "Erreur lors du chargement");
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
    switch (status) {
      case "published":
        return "Publié";
      case "archived":
        return "Archivé";
      default:
        return "Brouillon";
    }
  };

  const getFillRateColor = (rate: number) => {
    if (rate === 100) return "text-green-600 bg-green-50";
    if (rate >= 50) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plannings</h1>
          <p className="mt-2 text-secondary">
            Organisez vos événements et affectez vos membres aux créneaux
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-subtle bg-white text-secondary"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="archived">Archivé</option>
          </select>
          <Link
            href="/tableau-de-bord/plannings/nouveau"
            className="px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau planning
          </Link>
        </div>
      </div>

      {limitReached && (
        <LimitReachedAlert message="Limite de plannings atteinte. Passez au plan Pro pour en créer plus." />
      )}

      <div className="rounded-2xl border border-subtle bg-surface/80 overflow-hidden shadow-premium">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-secondary">Chargement...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-12 text-center">
            <p className="text-red-600 mb-2">Erreur de chargement</p>
            <p className="text-secondary text-sm">{errorMessage}</p>
          </div>
        ) : filteredPlannings.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-secondary mb-4">Aucun planning trouvé</p>
            <Link
              href="/tableau-de-bord/plannings/nouveau"
              className="inline-block px-6 py-3 accent-bg text-white font-medium rounded-full transition-all"
            >
              Créer votre premier planning
            </Link>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {filteredPlannings.map((planning) => (
              <div
                key={planning.id}
                className="rounded-2xl border border-subtle bg-surface/60 p-5 transition-all duration-200 hover:border-accent-border hover:bg-surface-hover"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-primary">{planning.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(planning.status)}`}>
                          {getStatusLabel(planning.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {formatDate(planning.date)}
                        </span>
                        {planning.event && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            {planning.event.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <ClipboardList className="w-4 h-4" />
                          {planning.slotsCount} créneau{planning.slotsCount > 1 ? "x" : ""}
                        </span>
                      </div>
                      {planning.description && (
                        <p className="mt-2 text-sm text-secondary line-clamp-2">{planning.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs uppercase text-tertiary mb-1">Affectations</p>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-secondary" />
                            <span className="font-semibold">
                              {planning.totalAssigned} / {planning.totalRequired}
                            </span>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${getFillRateColor(planning.fillRate)}`}>
                          <p className="text-2xl font-bold">{planning.fillRate}%</p>
                          <p className="text-xs">complet</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-subtle">
                    <Link
                      href={`/tableau-de-bord/plannings/${planning.id}`}
                      className="px-4 py-2 rounded-full bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all text-sm flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Voir / Gérer
                    </Link>
                    <button
                      onClick={() => handleDelete(planning.id)}
                      className="px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-all text-sm flex items-center justify-center"
                      title="Supprimer"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
