"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { calculerTotalTTC } from "@/lib/utils/calculations";
import { Eye, Trash, Plus, Download, Receipt } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";

interface Facture {
  id: string;
  numero: string;
  client?: { nom?: string };
  lignes: any[];
  statut: string;
  dateCreation: string;
}

export default function FacturesPage() {
  const { t, locale } = useI18n();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const [showAccountingExport, setShowAccountingExport] = useState(false);
  const [accountingYear, setAccountingYear] = useState<string>(String(currentYear));
  const accountingYears = Array.from({ length: 5 }, (_, index) =>
    String(currentYear - index)
  );

  useEffect(() => {
    void loadFactures();
  }, []);

  const loadFactures = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/documents?type=invoice", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(t("dashboard.invoices.loadError"));
      }
      const data = await response.json();
      setFactures(data.documents || []);
    } catch (error: any) {
      setErrorMessage(error?.message || t("dashboard.invoices.loadError"));
      setFactures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("dashboard.invoices.deleteConfirm"))) return;
    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(t("dashboard.invoices.deleteError"));
      }
      await loadFactures();
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
      paye: "badge-success",
      "en-retard": "badge-error",
    };
    return colors[statut] || "bg-slate-100 text-slate-600";
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: t("dashboard.status.invoice.draft"),
      envoye: t("dashboard.status.invoice.sent"),
      paye: t("dashboard.status.invoice.paid"),
      "en-retard": t("dashboard.status.invoice.overdue"),
    };
    return labels[statut] || statut;
  };

  const handleExportAccounting = () => {
    const url = `/api/export/accounting?year=${accountingYear}`;
    window.location.href = url;
    setShowAccountingExport(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{t("dashboard.invoices.title")}</h1>
          <p className="mt-1 text-slate-500">{t("dashboard.invoices.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAccountingExport((value) => !value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              {t("dashboard.invoices.exportAccountingAction")}
            </button>
            {showAccountingExport && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg z-10">
                <label className="block text-sm text-slate-600 mb-2">
                  {t("dashboard.invoices.exportAccountingYearLabel")}
                </label>
                <select
                  value={accountingYear}
                  onChange={(event) => setAccountingYear(event.target.value)}
                  className="input-obillz"
                >
                  {accountingYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleExportAccounting}
                  className="mt-4 w-full btn-obillz justify-center text-sm"
                >
                  {t("dashboard.invoices.exportAccountingDownload")}
                </button>
              </div>
            )}
          </div>
          <Link
            href="/tableau-de-bord/factures/nouvelle"
            className="btn-obillz"
          >
            <Plus className="w-5 h-5" />
            {t("dashboard.invoices.newAction")}
          </Link>
        </div>
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
        ) : factures.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">{t("dashboard.invoices.emptyState")}</p>
            <Link
              href="/tableau-de-bord/factures/nouvelle"
              className="btn-obillz inline-flex"
            >
              <Plus className="w-5 h-5" />
              {t("dashboard.invoices.emptyCta")}
            </Link>
          </div>
        ) : (
          <>
            {/* Vue liste moderne */}
            <div className="divide-y divide-slate-100">
              {factures.map((facture) => {
                const montant = calculerTotalTTC(facture.lignes);
                return (
                  <div
                    key={facture.id}
                    className="p-5 md:p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "var(--obillz-blue-light)" }}
                        >
                          <Receipt className="w-6 h-6" style={{ color: "var(--obillz-hero-blue)" }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{facture.numero}</h3>
                            <span className={`badge-obillz ${getStatutColor(facture.statut)}`}>
                              {getStatutLabel(facture.statut)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {facture.client?.nom || t("dashboard.common.unknownClient")}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Créée le {formatDate(facture.dateCreation)}
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
                            href={`/tableau-de-bord/factures/${facture.id}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">{t("dashboard.common.view")}</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(facture.id)}
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
                {factures.length} facture{factures.length > 1 ? "s" : ""} au total
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
