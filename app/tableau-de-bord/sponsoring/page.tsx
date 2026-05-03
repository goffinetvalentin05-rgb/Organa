"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Edit, Trash, Handshake } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  TableCard,
  EmptyState,
  GlassCard,
  ActionButton,
} from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";

type ContractRow = {
  id: string;
  sponsorName: string;
  title: string;
  amount: number | null;
  startDate: string;
  endDate: string;
  status: "pending" | "active" | "expired";
  sponsorType: string | null;
};

export default function SponsoringPage() {
  const { t, locale } = useI18n();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/sponsor-contracts", { cache: "no-store" });
      if (!res.ok) throw new Error(t("dashboard.sponsoring.loadError"));
      const data = await res.json();
      setContracts(data.contracts || []);
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : t("dashboard.sponsoring.loadError"));
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const formatMontant = (n: number | null) => {
    if (n == null || Number.isNaN(n)) return "—";
    return new Intl.NumberFormat(localeToIntl[locale], {
      style: "currency",
      currency: "CHF",
    }).format(n);
  };

  const formatDate = (value: string) => {
    if (!value) return "—";
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(localeToIntl[locale]);
  };

  const statusLabel = (s: string) => {
    if (s === "active") return t("dashboard.sponsoring.status.active");
    if (s === "pending") return t("dashboard.sponsoring.status.pending");
    if (s === "expired") return t("dashboard.sponsoring.status.expired");
    return s;
  };

  const statusClass = (s: string) => {
    if (s === "active") return "badge-success";
    if (s === "pending") return "badge-info";
    if (s === "expired") return "badge-error";
    return "bg-slate-100 text-slate-600";
  };

  const sponsorTypeLabel = (type: string | null) => {
    if (!type) return t("dashboard.sponsoring.sponsorTypes.none");
    if (type === "gold") return t("dashboard.sponsoring.sponsorTypes.gold");
    if (type === "silver") return t("dashboard.sponsoring.sponsorTypes.silver");
    if (type === "bronze") return t("dashboard.sponsoring.sponsorTypes.bronze");
    return type;
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("dashboard.sponsoring.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/sponsor-contracts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      alert(t("dashboard.sponsoring.deleteError"));
    }
  };

  return (
    <PageLayout maxWidth="7xl" className="space-y-6">
      <PageHeader
        title={t("dashboard.sponsoring.title")}
        subtitle={t("dashboard.sponsoring.subtitle")}
        actions={
          <DashboardPrimaryButton href="/tableau-de-bord/sponsoring/nouveau" icon="none">
            {t("dashboard.sponsoring.newAction")}
          </DashboardPrimaryButton>
        }
      />

      <TableCard bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-slate-500">{t("dashboard.common.loading")}</div>
        ) : errorMessage ? (
          <GlassCard className="m-5 border-red-200/80 bg-red-50/50 text-center">
            <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
            <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
          </GlassCard>
        ) : contracts.length === 0 ? (
          <EmptyState
            embedded
            icon={Handshake}
            title={t("dashboard.sponsoring.emptyState")}
            action={
              <DashboardPrimaryButton href="/tableau-de-bord/sponsoring/nouveau" className="inline-flex" icon="none">
                {t("dashboard.sponsoring.emptyCta")}
              </DashboardPrimaryButton>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.sponsoring.columns.sponsor")}</th>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.sponsoring.columns.contractName")}</th>
                  <th className="hidden px-4 py-3 md:table-cell sm:px-6">
                    {t("dashboard.sponsoring.columns.type")}
                  </th>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.sponsoring.columns.amount")}</th>
                  <th className="hidden px-4 py-3 lg:table-cell sm:px-6">
                    {t("dashboard.sponsoring.columns.start")}
                  </th>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.sponsoring.columns.end")}</th>
                  <th className="px-4 py-3 sm:px-6">{t("dashboard.common.status")}</th>
                  <th className="px-4 py-3 text-right sm:px-6">{t("dashboard.common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((c) => (
                  <tr key={c.id} className="bg-white/80 transition-colors hover:bg-blue-50/30">
                    <td className="px-4 py-3 font-medium text-slate-900 sm:px-6">{c.sponsorName}</td>
                    <td className="px-4 py-3 text-slate-700 sm:px-6">{c.title}</td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell sm:px-6">
                      {sponsorTypeLabel(c.sponsorType)}
                    </td>
                    <td className="px-4 py-3 text-slate-800 sm:px-6">{formatMontant(c.amount)}</td>
                    <td className="hidden px-4 py-3 text-slate-600 lg:table-cell sm:px-6">
                      {formatDate(c.startDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 sm:px-6">{formatDate(c.endDate)}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <span className={`badge-obillz ${statusClass(c.status)}`}>{statusLabel(c.status)}</span>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <ActionButton href={`/tableau-de-bord/sponsoring/${c.id}`} className="inline-flex items-center gap-1.5 p-2">
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("dashboard.common.view")}</span>
                        </ActionButton>
                        <ActionButton
                          href={`/tableau-de-bord/sponsoring/${c.id}/modifier`}
                          className="inline-flex items-center gap-1.5 p-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("dashboard.common.edit")}</span>
                        </ActionButton>
                        <ActionButton
                          type="button"
                          variant="dangerSoft"
                          className="inline-flex p-2"
                          title={t("dashboard.common.delete")}
                          onClick={() => void handleDelete(c.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </PageLayout>
  );
}
