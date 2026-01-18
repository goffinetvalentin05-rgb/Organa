"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { calculerTotalTTC } from "@/lib/utils/calculations";
import { Eye, Trash, Plus } from "@/lib/icons";
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
      brouillon: "bg-slate-100 text-slate-700",
      envoye: "bg-blue-100 text-blue-700",
      accepte: "bg-green-100 text-green-700",
      refuse: "bg-red-100 text-red-700",
    };
    return colors[statut] || "bg-slate-100 text-slate-700";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.quotes.title")}</h1>
          <p className="mt-2 text-secondary">{t("dashboard.quotes.subtitle")}</p>
        </div>
        <Link
          href="/tableau-de-bord/devis/nouveau"
          className="px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t("dashboard.quotes.newAction")}
        </Link>
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
        ) : devis.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-secondary mb-4">{t("dashboard.quotes.emptyState")}</p>
            <Link
              href="/tableau-de-bord/devis/nouveau"
              className="inline-block px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all"
            >
              {t("dashboard.quotes.emptyCta")}
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
                {devis.map((devisItem) => {
                  const montant = calculerTotalTTC(devisItem.lignes);
                  return (
                    <tr
                      key={devisItem.id}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">
                        {devisItem.numero}
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        {devisItem.client?.nom || t("dashboard.common.unknownClient")}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatMontant(montant)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(
                            devisItem.statut
                          )}`}
                        >
                          {getStatutLabel(devisItem.statut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        {formatDate(devisItem.dateCreation)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/tableau-de-bord/devis/${devisItem.id}`}
                            className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all text-sm flex items-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            {t("dashboard.common.view")}
                          </Link>
                          <button
                            onClick={() => handleDelete(devisItem.id)}
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



























