"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Edit, Download } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import { PageLayout, PageHeader, GlassCard } from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";

type Contract = {
  id: string;
  sponsorName: string;
  title: string;
  content: string;
  amount: number | null;
  startDate: string;
  endDate: string;
  status: "pending" | "active" | "expired";
  sponsorType: string | null;
};

export default function ContratSponsorDetailPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sponsor-contracts/${id}`, { cache: "no-store" });
      if (!res.ok) {
        router.replace("/tableau-de-bord/sponsoring");
        return;
      }
      const data = await res.json();
      setContract(data.contract);
    } catch {
      router.replace("/tableau-de-bord/sponsoring");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

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

  const handleDelete = async () => {
    if (!contract || !confirm(t("dashboard.sponsoring.deleteConfirm"))) return;
    const res = await fetch(`/api/sponsor-contracts/${contract.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(t("dashboard.sponsoring.deleteError"));
      return;
    }
    router.push("/tableau-de-bord/sponsoring");
  };

  if (loading || !contract) {
    return (
      <PageLayout maxWidth="3xl" className="space-y-6">
        <GlassCard className="p-10 text-center text-slate-500">{t("dashboard.common.loading")}</GlassCard>
      </PageLayout>
    );
  }

  const pdfHref = `/api/pdf/contrat-sponsor/download?id=${contract.id}&locale=${locale}`;

  return (
    <PageLayout maxWidth="3xl" className="space-y-6">
      <div>
        <Link
          href="/tableau-de-bord/sponsoring"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("dashboard.sponsoring.backToList")}
        </Link>
        <PageHeader
          title={contract.title}
          subtitle={contract.sponsorName}
          actions={
            <div className="flex flex-wrap gap-2">
              <a
                href={pdfHref}
                className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/18"
              >
                <Download className="h-4 w-4" />
                {t("dashboard.sponsoring.detail.downloadPdf")}
              </a>
              <DashboardPrimaryButton
                href={`/tableau-de-bord/sponsoring/${contract.id}/modifier`}
                icon="none"
                className="inline-flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                {t("dashboard.sponsoring.detail.edit")}
              </DashboardPrimaryButton>
            </div>
          }
        />
      </div>

      <GlassCard className="p-6 sm:p-8">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`badge-obillz ${statusClass(contract.status)}`}>{statusLabel(contract.status)}</span>
            <span className="text-sm text-slate-600">
              {t("dashboard.sponsoring.detail.period")} : {formatDate(contract.startDate)} →{" "}
              {formatDate(contract.endDate)}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">{t("dashboard.sponsoring.columns.sponsor")}</dt>
              <dd className="font-medium text-slate-900">{contract.sponsorName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("dashboard.sponsoring.columns.amount")}</dt>
              <dd className="font-medium text-slate-900">{formatMontant(contract.amount)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("dashboard.sponsoring.columns.type")}</dt>
              <dd className="font-medium text-slate-900">{sponsorTypeLabel(contract.sponsorType)}</dd>
            </div>
          </dl>
        </div>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">{t("dashboard.sponsoring.detail.contentTitle")}</h2>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">
            {contract.content || "—"}
          </pre>
        </div>
      </GlassCard>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleDelete()}
          className="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-2.5 text-sm font-medium text-red-800 transition hover:bg-red-100"
        >
          {t("dashboard.common.delete")}
        </button>
      </div>
    </PageLayout>
  );
}
