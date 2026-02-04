"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { calculerTotalTTC } from "@/lib/utils/calculations";
import { Eye, Trash, Plus, FileText, ArrowRight } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";

interface Devis {
  id: string;
  numero: string;
  client?: { nom?: string };
  lignes: any[];
  statut: string;
  dateCreation: string;
}

export default function DevisPage() {
  const { t, locale } = useI18n();
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadDevis();
  }, []);

  const loadDevis = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/documents?type=quote", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(t("dashboard.quotes.loadError"));
      }
      const data = await response.json();
      setDevis(data.documents || []);
    } catch (error: any) {
      setErrorMessage(error?.message || t("dashboard.quotes.loadError"));
      setDevis([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("dashboard.quotes.deleteConfirm"))) return;
    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(t("dashboard.quotes.deleteError"));
      }
      await loadDevis();
    } catch (error) {
      console.error(error);
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat(localeToIntl[locale], {
      style: "currency",
      currency: "CHF",
    }).format(montant);
  };

  const formatDate = (value: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(localeToIntl[locale]);
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: "bg-slate-100 text-slate-600",
      envoye: "badge-info",
      accepte: "badge-success",
      refuse: "badge-error",
    };
    return colors[statut] || "bg-slate-100 text-slate-600";
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: t("dashboard.status.quote.draft"),
      envoye: t("dashboard.status.quote.sent"),
      accepte: t("dashboard.status.quote.accepted"),
      refuse: t("dashboard.status.quote.refused"),
    };
    return labels[statut] || statut;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{t("dashboard.quotes.title")}</h1>
          <p className="mt-1 text-slate-500">{t("dashboard.quotes.subtitle")}</p>
        </div>
        <Link
          href="/tableau-de-bord/devis/nouveau"
          className="btn-obillz"
        >
          <Plus className="w-5 h-5" />
          {t("dashboard.quotes.newAction")}
        </Link>
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-3 text-slate-500">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t("dashboard.common.loading")}
            </div>
          </div>
        ) : errorMessage ? (
          <div className="p-12 text-center">
            <p className="text-red-600 font-medium mb-2">{t("dashboard.common.loadFailed")}</p>
            <p className="text-slate-500 text-sm">{errorMessage}</p>
          </div>
        ) : devis.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">{t("dashboard.quotes.emptyState")}</p>
            <Link
              href="/tableau-de-bord/devis/nouveau"
              className="btn-obillz inline-flex"
            >
              <Plus className="w-5 h-5" />
              {t("dashboard.quotes.emptyCta")}
            </Link>
          </div>
        ) : (
          <>
            {/* Vue liste moderne */}
            <div className="divide-y divide-slate-100">
              {devis.map((devisItem) => {
                const montant = calculerTotalTTC(devisItem.lignes);
                return (
                  <div
                    key={devisItem.id}
                    className="p-5 md:p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "var(--obillz-blue-light)" }}
                        >
                          <FileText className="w-6 h-6" style={{ color: "var(--obillz-hero-blue)" }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{devisItem.numero}</h3>
                            <span className={`badge-obillz ${getStatutColor(devisItem.statut)}`}>
                              {getStatutLabel(devisItem.statut)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {devisItem.client?.nom || t("dashboard.common.unknownClient")}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Créé le {formatDate(devisItem.dateCreation)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">{formatMontant(montant)}</p>
                          <p className="text-xs text-slate-400">TTC</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/tableau-de-bord/devis/${devisItem.id}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">{t("dashboard.common.view")}</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(devisItem.id)}
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title={t("dashboard.common.delete")}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer avec compteur */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50">
              <p className="text-sm text-slate-500 text-center">
                {devis.length} devis au total
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
