"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Edit, Download, Eye, Handshake, FileText } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import { PageLayout, DetailPageHeader, GlassCard, SectionCard, ActionButton } from "@/components/ui";
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
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const previewAnchorRef = useRef<HTMLDivElement | null>(null);

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
      <PageLayout maxWidth="7xl">
        <GlassCard className="p-10 text-center text-slate-500">{t("dashboard.common.loading")}</GlassCard>
      </PageLayout>
    );
  }

  const previewPdfUrl = `/api/pdf/contrat-sponsor/preview?id=${contract.id}&locale=${locale}`;
  const downloadPdfUrl = `/api/pdf/contrat-sponsor/download?id=${contract.id}&locale=${locale}`;

  return (
    <PageLayout maxWidth="7xl">
      <DetailPageHeader
        backHref="/tableau-de-bord/sponsoring"
        backLabel={t("dashboard.sponsoring.backToList")}
        title={contract.title}
        subject={contract.sponsorName}
        meta={
          <span>
            {t("dashboard.sponsoring.detail.period")} : {formatDate(contract.startDate)} →{" "}
            {formatDate(contract.endDate)}
          </span>
        }
        status={
          <span className={`badge-obillz ${statusClass(contract.status)}`}>
            {statusLabel(contract.status)}
          </span>
        }
        actions={
          <>
            <ActionButton
              type="button"
              onClick={() => {
                setPdfPreviewOpen(true);
                requestAnimationFrame(() => {
                  previewAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
              }}
              className="inline-flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {t("dashboard.sponsoring.detail.previewPdf")}
            </ActionButton>
            <ActionButton
              type="button"
              onClick={() => {
                if (!pdfPreviewOpen) {
                  toast.error(t("dashboard.sponsoring.detail.downloadRequiresPreview"));
                  return;
                }
                const link = document.createElement("a");
                link.href = downloadPdfUrl;
                link.download = `contrat-sponsor-${contract.title.replace(/\s+/g, "-").slice(0, 40)}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="inline-flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t("dashboard.sponsoring.detail.downloadPdf")}
            </ActionButton>
            <DashboardPrimaryButton
              href={`/tableau-de-bord/sponsoring/${contract.id}/modifier`}
              icon="none"
              className="inline-flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {t("dashboard.sponsoring.detail.edit")}
            </DashboardPrimaryButton>
            <ActionButton
              type="button"
              variant="dangerSoft"
              onClick={() => void handleDelete()}
              className="inline-flex items-center gap-2"
            >
              {t("dashboard.common.delete")}
            </ActionButton>
          </>
        }
      />

      {pdfPreviewOpen ? (
        <div ref={previewAnchorRef}>
          <SectionCard
            title={t("dashboard.sponsoring.detail.previewPdf")}
            icon={Eye}
            className="overflow-hidden"
            bodyClassName="!p-0"
          >
            <iframe
              title={t("dashboard.sponsoring.detail.previewPdf")}
              src={previewPdfUrl}
              className="h-[min(78vh,920px)] w-full min-h-[420px] border-0 bg-white"
            />
          </SectionCard>
        </div>
      ) : null}

      <SectionCard
        title={t("dashboard.sponsoring.detail.title")}
        description={`${t("dashboard.sponsoring.detail.period")} : ${formatDate(contract.startDate)} → ${formatDate(contract.endDate)}`}
        icon={Handshake}
        headerRight={
          <span className={`badge-obillz ${statusClass(contract.status)}`}>
            {statusLabel(contract.status)}
          </span>
        }
      >
        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dashboard.sponsoring.columns.sponsor")}
            </dt>
            <dd className="text-base font-semibold text-slate-900">{contract.sponsorName}</dd>
          </div>
          <div className="space-y-1.5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dashboard.sponsoring.columns.amount")}
            </dt>
            <dd className="text-base font-semibold text-slate-900">{formatMontant(contract.amount)}</dd>
          </div>
          <div className="space-y-1.5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dashboard.sponsoring.columns.type")}
            </dt>
            <dd className="text-base font-semibold text-slate-900">{sponsorTypeLabel(contract.sponsorType)}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title={t("dashboard.sponsoring.detail.contentTitle")} icon={FileText}>
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800 sm:text-[0.9375rem] sm:leading-8">
          {contract.content || "—"}
        </p>
      </SectionCard>
    </PageLayout>
  );
}
