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
  dashboardListRowClass,
} from "@/components/ui";

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
            {/* Vue liste moderne */}
            <div className="divide-y divide-slate-100">
              {devis.map((devisItem) => {
                const montant = calculerTotalTTC(devisItem.lignes);
                return (
                  <div
                    key={devisItem.id}
                    className={dashboardListRowClass}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "var(--obillz-blue-light)" }}
                        >
                          <FileText className="w-6 h-6 text-[var(--obillz-hero-blue)]" />
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
                            {t("dashboard.quotes.createdOn")} {formatDate(devisItem.dateCreation)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">{formatMontant(montant)}</p>
                          <p className="text-xs text-slate-400">TTC</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <ActionButton href={`/tableau-de-bord/devis/${devisItem.id}`} className="inline-flex items-center gap-2">
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
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer avec compteur */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
              <p className="text-center text-sm text-slate-500">
                {t("dashboard.quotes.totalCount", { count: devis.length })}
              </p>
            </div>
          </>
        )}
      </TableCard>
    </PageLayout>
  );
}
