"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { calculerTotalTTC } from "@/lib/utils/calculations";
import { Eye, Trash, Download, Receipt } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  TableCard,
  EmptyState,
  ActionButton,
  GlassCard,
} from "@/components/ui";

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
    <PageLayout maxWidth="7xl" className="space-y-6">
      <PageHeader
        title={t("dashboard.invoices.title")}
        subtitle={t("dashboard.invoices.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountingExport((value) => !value)}
                className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900"
              >
                <Download className="h-4 w-4" />
                {t("dashboard.invoices.exportAccountingAction")}
              </button>
              {showAccountingExport ? (
                <div className="absolute right-0 z-10 mt-2 w-64 rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md">
                  <label className="mb-2 block text-sm text-slate-600">
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
                  <DashboardPrimaryButton
                    type="button"
                    onClick={handleExportAccounting}
                    icon="none"
                    className="mt-4 w-full justify-center text-sm"
                    size="sm"
                  >
                    {t("dashboard.invoices.exportAccountingDownload")}
                  </DashboardPrimaryButton>
                </div>
              ) : null}
            </div>
            <DashboardPrimaryButton href="/tableau-de-bord/factures/nouvelle">
              {t("dashboard.invoices.newAction")}
            </DashboardPrimaryButton>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-blue-50/90 px-3 py-1 text-xs font-medium text-blue-800 backdrop-blur-sm">
          Sponsors
        </span>
        <span className="inline-flex items-center rounded-full bg-purple-50/90 px-3 py-1 text-xs font-medium text-purple-800 backdrop-blur-sm">
          Locations de salle
        </span>
        <span className="inline-flex items-center rounded-full bg-emerald-50/90 px-3 py-1 text-xs font-medium text-emerald-800 backdrop-blur-sm">
          Événements
        </span>
        <span className="inline-flex items-center rounded-full bg-amber-50/90 px-3 py-1 text-xs font-medium text-amber-900 backdrop-blur-sm">
          Buvette
        </span>
      </div>

      <TableCard bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-3 text-slate-500">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t("dashboard.common.loading")}
            </div>
          </div>
        ) : errorMessage ? (
          <GlassCard className="m-5 border-red-200/80 bg-red-50/50 text-center">
            <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
            <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
          </GlassCard>
        ) : factures.length === 0 ? (
          <EmptyState
            embedded
            icon={Receipt}
            title={t("dashboard.invoices.emptyState")}
            action={
              <DashboardPrimaryButton href="/tableau-de-bord/factures/nouvelle" className="inline-flex">
                {t("dashboard.invoices.emptyCta")}
              </DashboardPrimaryButton>
            }
          />
        ) : (
          <>
            {/* Vue liste moderne */}
            <div className="divide-y divide-slate-100">
              {factures.map((facture) => {
                const montant = calculerTotalTTC(facture.lignes);
                return (
                  <div
                    key={facture.id}
                    className="p-5 transition-colors hover:bg-blue-50/25 md:p-6"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "var(--obillz-blue-light)" }}
                        >
                          <Receipt className="w-6 h-6 text-[var(--obillz-hero-blue)]" />
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
                          <ActionButton href={`/tableau-de-bord/factures/${facture.id}`} className="inline-flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">{t("dashboard.common.view")}</span>
                          </ActionButton>
                          <ActionButton
                            type="button"
                            variant="dangerSoft"
                            onClick={() => handleDelete(facture.id)}
                            title={t("dashboard.common.delete")}
                            className="inline-flex p-2"
                          >
                            <Trash className="h-4 w-4" />
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer avec compteur */}
            <div className="border-t border-slate-100/90 bg-slate-50/80 px-6 py-4 backdrop-blur-sm">
              <p className="text-center text-sm text-slate-500">
                {factures.length} facture{factures.length > 1 ? "s" : ""} au total
              </p>
            </div>
          </>
        )}
      </TableCard>
    </PageLayout>
  );
}
