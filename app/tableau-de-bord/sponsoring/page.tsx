"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Edit, Trash, Handshake } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  EmptyState,
  GlassCard,
  ActionButton,
  EntityCard,
  EntityCardGrid,
  EntityMetaRow,
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
    return "badge-neutral";
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
    <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.sponsoring.title")}
        subtitle={t("dashboard.sponsoring.subtitle")}
        actions={
          <DashboardPrimaryButton href="/tableau-de-bord/sponsoring/nouveau" icon="none">
            {t("dashboard.sponsoring.newAction")}
          </DashboardPrimaryButton>
        }
      />

      {loading ? (
        <div className="rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white p-12 text-center shadow-sm text-slate-500">
          {t("dashboard.common.loading")}
        </div>
      ) : errorMessage ? (
        <GlassCard className="border-red-200/80 bg-red-50/50 text-center">
          <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
          <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
        </GlassCard>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={t("dashboard.sponsoring.emptyState")}
          action={
            <DashboardPrimaryButton href="/tableau-de-bord/sponsoring/nouveau" className="inline-flex" icon="none">
              {t("dashboard.sponsoring.emptyCta")}
            </DashboardPrimaryButton>
          }
        />
      ) : (
        <EntityCardGrid>
          {contracts.map((c) => (
            <EntityCard
              key={c.id}
              href={`/tableau-de-bord/sponsoring/${c.id}`}
              title={c.sponsorName}
              subtitle={c.title}
              amount={formatMontant(c.amount)}
              status={
                <span className={`badge-obillz ${statusClass(c.status)}`}>{statusLabel(c.status)}</span>
              }
              meta={
                <>
                  <EntityMetaRow
                    label={t("dashboard.sponsoring.columns.type")}
                    value={sponsorTypeLabel(c.sponsorType)}
                  />
                  <EntityMetaRow
                    label={t("dashboard.sponsoring.columns.start")}
                    value={formatDate(c.startDate)}
                  />
                  <EntityMetaRow
                    label={t("dashboard.sponsoring.columns.end")}
                    value={formatDate(c.endDate)}
                  />
                </>
              }
              actions={
                <>
                  <ActionButton
                    href={`/tableau-de-bord/sponsoring/${c.id}`}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    {t("dashboard.common.view")}
                  </ActionButton>
                  <ActionButton
                    href={`/tableau-de-bord/sponsoring/${c.id}/modifier`}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Edit className="h-4 w-4" />
                    {t("dashboard.common.edit")}
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
                </>
              }
            />
          ))}
        </EntityCardGrid>
      )}
    </PageLayout>
  );
}
