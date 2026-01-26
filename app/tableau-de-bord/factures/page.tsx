"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { calculerTotalTTC } from "@/lib/utils/calculations";
import { Eye, Trash, Plus, Download } from "@/lib/icons";
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
      brouillon: "bg-slate-100 text-slate-700",
      envoye: "bg-blue-100 text-blue-700",
      paye: "bg-green-100 text-green-700",
      "en-retard": "bg-red-100 text-red-700",
    };
    return colors[statut] || "bg-slate-100 text-slate-700";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.invoices.title")}</h1>
          <p className="mt-2 text-secondary">{t("dashboard.invoices.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAccountingExport((value) => !value)}
              className="px-4 py-3 rounded-lg border border-subtle bg-white text-secondary hover:text-primary transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              {t("dashboard.invoices.exportAccountingAction")}
            </button>
            {showAccountingExport && (
              <div className="absolute right-0 mt-3 w-64 rounded-xl border border-subtle bg-white p-4 shadow-premium z-10">
                <label className="block text-sm text-secondary mb-2">
                  {t("dashboard.invoices.exportAccountingYearLabel")}
                </label>
                <select
                  value={accountingYear}
                  onChange={(event) => setAccountingYear(event.target.value)}
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
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
                  className="mt-4 w-full rounded-lg accent-bg text-white py-2 text-sm font-medium"
                >
                  {t("dashboard.invoices.exportAccountingDownload")}
                </button>
              </div>
            )}
          </div>
          <Link
            href="/tableau-de-bord/factures/nouvelle"
            className="px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t("dashboard.invoices.newAction")}
          </Link>
        </div>
      </div>

      {/* Liste */}
      <div className="rounded-xl border border-subtle bg-surface overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-secondary">{t("dashboard.common.loading")}</p>
          </div>
        ) : errorMessage ? (
          <div className="p-12 text-center">
            <p className="text-red-600 mb-2">{t("dashboard.common.loadFailed")}</p>
            <p className="text-secondary text-sm">{errorMessage}</p>
          </div>
        ) : factures.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-secondary mb-4">{t("dashboard.invoices.emptyState")}</p>
            <Link
              href="/tableau-de-bord/factures/nouvelle"
              className="inline-block px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all"
            >
              {t("dashboard.invoices.emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-subtle">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                    {t("dashboard.common.number")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                    {t("dashboard.common.client")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                    {t("dashboard.common.amount")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                    {t("dashboard.common.status")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                    {t("dashboard.common.date")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-primary">
                    {t("dashboard.common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {factures.map((facture) => {
                  const montant = calculerTotalTTC(facture.lignes);
                  return (
                    <tr
                      key={facture.id}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">
                        {facture.numero}
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        {facture.client?.nom || t("dashboard.common.unknownClient")}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatMontant(montant)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(
                            facture.statut
                          )}`}
                        >
                          {getStatutLabel(facture.statut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        {formatDate(facture.dateCreation)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/tableau-de-bord/factures/${facture.id}`}
                            className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all text-sm flex items-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            {t("dashboard.common.view")}
                          </Link>
                          <button
                            onClick={() => handleDelete(facture.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all text-sm flex items-center justify-center"
                            title={t("dashboard.common.delete")}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



























