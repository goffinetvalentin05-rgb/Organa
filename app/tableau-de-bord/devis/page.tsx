"use client";

import { useEffect, useState } from "react";
import { calculerTotalTTC } from "@/lib/utils/calculations";
import { Eye, Trash, FileText } from "@/lib/icons";
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
  dashboardTableHeadRowClass,
} from "@/components/ui";

interface Devis {
  id: string;
  numero: string;
  title?: string;
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
    <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.quotes.title")}
        subtitle={t("dashboard.quotes.subtitle")}
        actions={
          <DashboardPrimaryButton href="/tableau-de-bord/devis/nouveau">
            {t("dashboard.quotes.newAction")}
          </DashboardPrimaryButton>
        }
      />

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
        ) : devis.length === 0 ? (
          <EmptyState
            embedded
            icon={FileText}
            title={t("dashboard.quotes.emptyState")}
            action={
              <DashboardPrimaryButton href="/tableau-de-bord/devis/nouveau" className="inline-flex">
                {t("dashboard.quotes.emptyCta")}
              </DashboardPrimaryButton>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className={dashboardTableHeadRowClass}>
                    <th className="px-4 py-3 sm:px-6">{t("dashboard.common.number")}</th>
                    <th className="px-4 py-3 sm:px-6">{t("dashboard.common.documentTitle")}</th>
                    <th className="px-4 py-3 sm:px-6">{t("dashboard.common.client")}</th>
                    <th className="px-4 py-3 sm:px-6">{t("dashboard.common.date")}</th>
                    <th className="px-4 py-3 sm:px-6">{t("dashboard.common.status")}</th>
                    <th className="px-4 py-3 sm:px-6">{t("dashboard.common.amount")}</th>
                    <th className="px-4 py-3 text-right sm:px-6">{t("dashboard.common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devis.map((devisItem) => {
                    const montant = calculerTotalTTC(devisItem.lignes);
                    return (
                      <tr
                        key={devisItem.id}
                        className="bg-transparent transition-colors hover:bg-indigo-500/[0.06]"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 sm:px-6">{devisItem.numero}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-slate-700 sm:max-w-[260px] sm:px-6">
                          {devisItem.title || "—"}
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3 text-slate-700 sm:max-w-[280px] sm:px-6">
                          {devisItem.client?.nom || t("dashboard.common.unknownClient")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 sm:px-6">
                          {formatDate(devisItem.dateCreation)}
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <span className={`badge-obillz ${getStatutColor(devisItem.statut)}`}>
                            {getStatutLabel(devisItem.statut)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-700 sm:px-6">
                          {formatMontant(montant)}
                          <span className="ml-1 text-xs font-normal text-slate-500">TTC</span>
                        </td>
                        <td className="px-4 py-3 text-right sm:px-6">
                          <ActionButton
                            href={`/tableau-de-bord/devis/${devisItem.id}`}
                            className="mr-1 inline-flex items-center gap-1.5 p-2"
                            title={t("dashboard.common.view")}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">{t("dashboard.common.view")}</span>
                          </ActionButton>
                          <ActionButton
                            type="button"
                            variant="dangerSoft"
                            onClick={() => handleDelete(devisItem.id)}
                            title={t("dashboard.common.delete")}
                            className="inline-flex p-2"
                          >
                            <Trash className="h-4 w-4" />
                          </ActionButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-6">
              <p className="text-center text-sm text-slate-600">
                {t("dashboard.quotes.totalCount", { count: devis.length })}
              </p>
            </div>
          </>
        )}
      </TableCard>
    </PageLayout>
  );
}
