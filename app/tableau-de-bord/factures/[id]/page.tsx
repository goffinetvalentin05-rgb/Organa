"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  calculerTotalHT,
  calculerTVA,
  calculerTotalTTC,
  type LigneDocument,
} from "@/lib/utils/calculations";
import { getErrorMessage } from "@/lib/utils/error-message";
import { formatCurrency } from "@/lib/utils/currency";
import { Eye, Download, Mail, Trash, Calendar, Edit } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import LinkInvoiceToEventModal, {
  type EventListItem,
} from "./LinkInvoiceToEventModal";
import EditDocumentIdentityModal from "@/components/documents/EditDocumentIdentityModal";
import ClubDocumentLogo from "@/components/documents/ClubDocumentLogo";
import {
  PageLayout,
  DetailPageHeader,
  GlassCard,
  ActionButton,
  dashboardSelectLgClass,
  documentPreviewSurfaceClass,
} from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import { useSafeSubmit } from "@/hooks/useSafeSubmit";
import { sendInvoiceEmail } from "@/lib/documents/sendDocumentEmail";
import { notifyError, notifySuccess } from "@/lib/notify";
import MarkPaidDialog from "@/components/documents/MarkPaidDialog";
import { documentDetailFailure, documentIdFromRoute } from "@/lib/documents/detailNavigation";
import DeleteDocumentDialog from "@/components/documents/DeleteDocumentDialog";

interface Facture {
  id: string;
  numero: string;
  title?: string;
  clientId?: string | null;
  recipientType?: "member" | "sponsor" | "external";
  recipient?: {
    type: "member" | "sponsor" | "external";
    name: string;
    contactName?: string | null;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
    email?: string | null;
    phone?: string | null;
    formattedAddress?: string | null;
  };
  client?: { nom?: string; email?: string; adresse?: string; telephone?: string };
  lignes: LigneDocument[];
  statut: "brouillon" | "envoye" | "paye" | "en-retard";
  dateCreation: string;
  dateEcheance?: string | null;
  datePaiement?: string | null;
  notes?: string | null;
  type?: string;
  eventId?: string | null;
  linkedEvent?: { id: string; name: string } | null;
  archived?: boolean;
}

interface CompanySettings {
  company_name?: string;
  company_address?: string;
  company_email?: string;
  company_phone?: string;
  logo_url?: string | null;
  iban?: string;
  bank_name?: string;
  payment_terms?: string;
  primary_color?: string;
  currency_symbol?: string;
}

export default function FactureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const id = documentIdFromRoute(params?.id, pathname, "factures");
  const { t, locale } = useI18n();
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const {
    isSubmitting: envoiEmail,
    showOverlay: showEmailOverlay,
    run: runEmailSend,
  } = useSafeSubmit({ overlayDelayMs: 280 });
  const [currency, setCurrency] = useState<string>("CHF");
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventsList, setEventsList] = useState<EventListItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadFacture = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      const failure = documentDetailFailure({
        ok: response.ok,
        document: data.document ?? null,
        expectedType: "invoice",
        error: typeof data.error === "string" ? data.error : null,
        fallback: t("dashboard.invoices.loadError"),
      });
      if (failure) {
        setFacture(null);
        setLoadError(failure);
        return;
      }
      setLoadError(null);
      setFacture(data.document);
    } catch (error) {
      console.error("[Facture] Erreur chargement:", error);
      setFacture(null);
      setLoadError(t("dashboard.invoices.loadError"));
    }
  }, [id, t]);

  useEffect(() => {
    if (!id) return;

    const loadCurrency = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const data = await res.json();
        if (data.settings?.currency) {
          setCurrency(data.settings.currency);
        }
        if (data.settings) {
          setCompanySettings(data.settings);
        }
      } catch (err) {
        console.error("Erreur lors du chargement de la devise:", err);
      }
    };

    void loadFacture();
    void loadCurrency();
  }, [id, loadFacture]);

  const loadEventsForModal = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("events");
      }
      const data = await res.json();
      const raw = (data.events || []) as {
        id: string;
        name: string;
        start_date?: string;
      }[];
      setEventsList(
        raw.map((e) => ({
          id: e.id,
          name: e.name,
          start_date: e.start_date,
        }))
      );
    } catch {
      toast.error(t("dashboard.invoices.detail.loadEventsError"));
      setEventsList([]);
    } finally {
      setEventsLoading(false);
    }
  }, [t]);

  const openEventModal = useCallback(() => {
    setSelectedEventId(facture?.linkedEvent?.id || facture?.eventId || "");
    setEventModalOpen(true);
    void loadEventsForModal();
  }, [facture?.eventId, facture?.linkedEvent?.id, loadEventsForModal]);

  const handleConfirmEventLink = async () => {
    if (!selectedEventId || !facture || !id) return;
    setLinkSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          type: "invoice",
          eventId: selectedEventId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t("dashboard.invoices.detail.linkError"));
      }
      toast.success(t("dashboard.invoices.detail.linkSuccess"));
      setEventModalOpen(false);
      await loadFacture();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : t("dashboard.invoices.detail.linkError");
      toast.error(message);
    } finally {
      setLinkSaving(false);
    }
  };

  const handleUnlinkEvent = async () => {
    if (!facture?.eventId || !id) return;
    if (!confirm(t("dashboard.invoices.detail.unlinkConfirm"))) return;
    setLinkSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          type: "invoice",
          eventId: null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t("dashboard.invoices.detail.linkError"));
      }
      toast.success(t("dashboard.invoices.detail.unlinkSuccess"));
      await loadFacture();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : t("dashboard.invoices.detail.linkError");
      toast.error(message);
    } finally {
      setLinkSaving(false);
    }
  };

  const handleDelete = () => {
    setDeleteOpen(true);
  };

  const recipientName =
    facture?.recipient?.name || facture?.client?.nom || t("dashboard.common.unknownClient");
  const recipientEmail = facture?.recipient?.email || facture?.client?.email || null;
  const recipientAddress =
    facture?.recipient?.formattedAddress || facture?.client?.adresse || null;
  const recipientPhone = facture?.recipient?.phone || facture?.client?.telephone || null;

  const handleEnvoyerEmail = async () => {
    if (!facture || !recipientEmail) {
      if (typeof toast !== "undefined" && toast.error) {
        toast.error(t("dashboard.invoices.detail.missingClientEmail"));
      }
      return;
    }
    if (envoiEmail) return;

    await runEmailSend(async () => {
      try {
        await sendInvoiceEmail({
          invoiceId: id,
          recipientEmail,
        });

        notifySuccess(t("dashboard.invoices.detail.sendSuccess"), "email-send");

        // Mettre à jour le statut si c'est un brouillon
        if (facture.statut === "brouillon") {
          handleChangerStatut("envoye");
        }
      } catch (error: unknown) {
        const errorMessage =
          getErrorMessage(error) || t("dashboard.invoices.detail.sendErrorFallback");
        notifyError(String(errorMessage), "email-send");
      }
    });
  };

  const handleImprimer = () => {
    window.print();
  };

  const handleChangerStatut = async (nouveauStatut: Facture["statut"]) => {
    if (!facture) return;
    if (nouveauStatut === "paye") {
      setReceiptOpen(true);
      return;
    }
    try {
      const response = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          type: "invoice",
          statut: nouveauStatut,
        }),
      });

      if (!response.ok) {
        throw new Error(t("dashboard.invoices.detail.statusUpdateError"));
      }

      setFacture({ ...facture, statut: nouveauStatut });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || t("dashboard.invoices.detail.statusUpdateError"));
    }
  };


  if (!facture) {
    return (
      <PageLayout maxWidth="7xl">
        <GlassCard padding="lg" className={loadError ? "text-center border-red-200/80 bg-red-50/70" : "text-center"}>
          <p className={loadError ? "font-medium text-red-700" : "text-slate-600"}>
            {loadError || t("dashboard.common.loading")}
          </p>
          {loadError ? (
            <Link
              href="/tableau-de-bord/factures"
              className="mt-3 inline-block text-sm font-semibold text-[var(--obillz-hero-blue)] hover:underline"
            >
              ← {t("dashboard.invoices.detail.backToList")}
            </Link>
          ) : null}
        </GlassCard>
      </PageLayout>
    );
  }

  if (!facture.lignes || !Array.isArray(facture.lignes)) {
    return (
      <PageLayout maxWidth="7xl">
        <GlassCard padding="lg" className="text-center border-red-200/80 bg-red-50/70">
          <p className="text-red-700 font-medium">{t("dashboard.invoices.detail.invalidData")}</p>
          <Link
            href="/tableau-de-bord/factures"
            className="mt-3 inline-block text-sm font-semibold text-[var(--obillz-hero-blue)] hover:underline"
          >
            ← {t("dashboard.invoices.detail.backToList")}
          </Link>
        </GlassCard>
      </PageLayout>
    );
  }

  const totalHT = calculerTotalHT(facture.lignes);
  const totalTVA = calculerTVA(facture.lignes);
  const totalTTC = calculerTotalTTC(facture.lignes);

  const formatMontant = (montant: number) => {
    return formatCurrency(montant, currency);
  };

  const formatDate = (value?: string | null) => {
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

  const statutLabelKey =
    facture.statut === "brouillon"
      ? "draft"
      : facture.statut === "envoye"
        ? "sent"
        : facture.statut === "paye"
          ? "paid"
          : "overdue";

  return (
    <>
      <SubmittingOverlay visible={showEmailOverlay} title="Envoi de la facture…" />
      <PageLayout maxWidth="7xl">
      <DetailPageHeader
        backHref="/tableau-de-bord/factures"
        backLabel={t("dashboard.invoices.detail.backToList")}
        reference={facture.numero}
        title={facture.title || undefined}
        subject={recipientName}
        meta={
          <span>
            {t("dashboard.invoices.detail.createdOn")} {formatDate(facture.dateCreation)}
            {facture.dateEcheance
              ? ` • ${t("dashboard.invoices.detail.dueOn")} ${formatDate(facture.dateEcheance)}`
              : ""}
          </span>
        }
        status={
          <span className={`badge-obillz ${getStatutColor(facture.statut)}`}>
            {t(`dashboard.status.invoice.${statutLabelKey}`)}
          </span>
        }
        actions={
          <>
            {facture.archived ? null : (
            <>
            <ActionButton
              type="button"
              onClick={() => setIdentityModalOpen(true)}
              className="inline-flex items-center gap-2"
              title={t("dashboard.common.edit")}
            >
              <Edit className="h-4 w-4" />
              {t("dashboard.common.edit")}
            </ActionButton>
            <ActionButton
              type="button"
              onClick={handleEnvoyerEmail}
              disabled={envoiEmail || !recipientEmail}
              className="inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              {envoiEmail ? t("dashboard.invoices.detail.sending") : t("dashboard.invoices.detail.sendEmail")}
            </ActionButton>
            </>
            )}
            <ActionButton
              type="button"
              onClick={() => {
                if (!id) {
                  toast.error(t("dashboard.common.missingDocumentId"));
                  return;
                }
                window.open(`/api/documents/${id}/pdf?type=invoice`, "_blank");
              }}
              disabled={!id}
              className="inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              {t("dashboard.invoices.detail.previewPdf")}
            </ActionButton>
            <ActionButton
              type="button"
              onClick={() => {
                if (!id) {
                  toast.error(t("dashboard.common.missingDocumentId"));
                  return;
                }
                const link = document.createElement("a");
                link.href = `/api/documents/${id}/pdf?type=invoice&download=true`;
                link.download = `obillz-invoice-${facture?.numero || id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              disabled={!id}
              className="inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {t("dashboard.invoices.detail.downloadPdf")}
            </ActionButton>
            {facture.archived ? null : (
            <ActionButton
              type="button"
              variant="dangerSoft"
              onClick={handleDelete}
              className="inline-flex items-center gap-2"
            >
              <Trash className="h-4 w-4" />
              {t("dashboard.common.delete")}
            </ActionButton>
            )}
          </>
        }
      />

      {facture.archived ? (
        <GlassCard padding="md" className="border-amber-200/80 bg-amber-50/80 text-sm text-amber-950">
          Cette facture est archivée. Elle n’est plus modifiable. L’écriture, les paiements et le justificatif restent consultables.
        </GlassCard>
      ) : null}
 
      {/* Aperçu */}
      <div className={documentPreviewSurfaceClass}>
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <ClubDocumentLogo
              logoUrl={companySettings?.logo_url}
              clubName={companySettings?.company_name}
            />
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {companySettings?.company_name || ""}
              </p>
              <p className="text-sm text-slate-500 whitespace-pre-line">
                {companySettings?.company_address || ""}
              </p>
              <p className="text-sm text-slate-500">
                {companySettings?.company_email || ""}
                {companySettings?.company_phone
                  ? ` • ${companySettings.company_phone}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="min-w-[220px] rounded-lg border border-slate-200 bg-slate-50 p-4 text-right">
            <p
              className="text-2xl font-semibold"
              style={{ color: companySettings?.primary_color || "#1A23FF" }}
            >
              Facture
            </p>
            <p className="text-sm text-slate-500 mt-1">
              N° {facture.numero}
            </p>
            {facture.title ? (
              <p className="text-sm font-medium text-slate-700 mt-2">{facture.title}</p>
            ) : null}
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <span>{t("dashboard.invoices.detail.createdAt")}</span>
                <span className="font-medium">{formatDate(facture.dateCreation)}</span>
              </div>
              {facture.dateEcheance && (
                <div className="flex items-center justify-between gap-4">
                  <span>{t("dashboard.invoices.detail.dueDate")}</span>
                  <span className="font-medium">{formatDate(facture.dateEcheance)}</span>
                </div>
              )}
              {facture.datePaiement && (
                <div className="flex items-center justify-between gap-4">
                  <span>{t("dashboard.invoices.detail.paidAt")}</span>
                  <span className="font-medium">{formatDate(facture.datePaiement)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t("dashboard.invoices.detail.recipientSection")}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {recipientName}
          </p>
          {facture.recipient?.contactName && (
            <p className="text-sm text-slate-500">{facture.recipient.contactName}</p>
          )}
          {recipientAddress && (
            <p className="text-sm text-slate-500 whitespace-pre-line">
              {recipientAddress}
            </p>
          )}
          {recipientEmail && (
            <p className="text-sm text-slate-500">{recipientEmail}</p>
          )}
          {recipientPhone && (
            <p className="text-sm text-slate-500">{recipientPhone}</p>
          )}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left font-semibold uppercase tracking-[0.12em]">
                  {t("dashboard.common.designation")}
                </th>
                <th className="px-3 py-3 text-right font-semibold uppercase tracking-[0.12em]">
                  {t("dashboard.common.quantity")}
                </th>
                <th className="px-3 py-3 text-right font-semibold uppercase tracking-[0.12em]">
                  {t("dashboard.common.unitPrice")}
                </th>
                <th className="px-3 py-3 text-right font-semibold uppercase tracking-[0.12em]">
                  {t("dashboard.common.total")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {facture.lignes?.length ? (
                facture.lignes.map((ligne) => {
                  if (!ligne) return null;
                  const sousTotal = (ligne.quantite || 0) * (ligne.prixUnitaire || 0);
                  return (
                    <tr key={ligne.id || Math.random()}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">
                          {ligne.designation || ""}
                        </div>
                        {ligne.description && (
                          <div className="text-xs text-slate-500 mt-1 whitespace-pre-line">
                            {ligne.description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">{ligne.quantite || 0}</td>
                      <td className="px-3 py-3 text-right">
                        {formatMontant(ligne.prixUnitaire || 0)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-slate-900">
                        {formatMontant(sousTotal)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                    {t("dashboard.common.noLines")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>{t("dashboard.common.totalHT")}</span>
              <span>{formatMontant(totalHT)}</span>
            </div>
            {totalTVA > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span>{t("dashboard.common.vatLabel")}</span>
                <span>{formatMontant(totalTVA)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg font-semibold text-slate-900">
              <span>{t("dashboard.common.totalTTC")}</span>
              <span>{formatMontant(totalTTC)}</span>
            </div>
          </div>
        </div>

        {(facture.notes ||
          companySettings?.iban ||
          companySettings?.bank_name ||
          companySettings?.payment_terms) && (
          <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-500 space-y-2">
            {facture.notes && <p className="whitespace-pre-line">{facture.notes}</p>}
            {(companySettings?.iban || companySettings?.bank_name) && (
              <p>
                {companySettings?.bank_name ? `${companySettings.bank_name} • ` : ""}
                {companySettings?.iban ? `IBAN ${companySettings.iban}` : ""}
              </p>
            )}
            {companySettings?.payment_terms && (
              <p className="whitespace-pre-line">{companySettings.payment_terms}</p>
            )}
          </div>
        )}
      </div>

      {/* Événement lié */}
      <GlassCard padding="md">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <Calendar className="w-5 h-5 text-[var(--obillz-hero-blue)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-slate-900">
              {t("dashboard.invoices.detail.eventSectionTitle")}
            </h2>
            {facture.linkedEvent ? (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("dashboard.invoices.detail.eventLinkedLabel")}
                  </p>
                  <Link
                    href={`/tableau-de-bord/evenements/${facture.linkedEvent.id}`}
                    className="mt-1 inline-block text-lg font-semibold text-[var(--obillz-hero-blue)] hover:underline"
                  >
                    {facture.linkedEvent.name}
                  </Link>
                </div>
                {facture.archived ? null : (
                <div className="flex flex-wrap gap-2">
                  <ActionButton type="button" onClick={openEventModal} disabled={linkSaving} className="disabled:opacity-50">
                    {t("dashboard.invoices.detail.changeEvent")}
                  </ActionButton>
                  <ActionButton type="button" variant="dangerSoft" onClick={handleUnlinkEvent} disabled={linkSaving} className="disabled:opacity-50">
                    {t("dashboard.invoices.detail.unlinkEvent")}
                  </ActionButton>
                </div>
                )}
              </div>
            ) : facture.eventId ? (
              <div className="mt-3 space-y-3">
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {t("dashboard.invoices.detail.eventOrphan")}
                </p>
                {facture.archived ? null : (
                <DashboardPrimaryButton type="button" onClick={openEventModal} disabled={linkSaving} icon="none" className="rounded-xl">
                  {t("dashboard.invoices.detail.linkToEvent")}
                </DashboardPrimaryButton>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <p className="mb-3 text-sm text-slate-600">
                  {t("dashboard.invoices.detail.eventNone")}
                </p>
                {facture.archived ? null : (
                <DashboardPrimaryButton type="button" onClick={openEventModal} disabled={linkSaving} icon="none" className="rounded-xl">
                  {t("dashboard.invoices.detail.linkToEvent")}
                </DashboardPrimaryButton>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <LinkInvoiceToEventModal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        events={eventsList}
        eventsLoading={eventsLoading}
        selectedEventId={selectedEventId}
        onSelectedEventIdChange={setSelectedEventId}
        onConfirm={handleConfirmEventLink}
        saving={linkSaving}
      />

      <EditDocumentIdentityModal
        open={identityModalOpen}
        onClose={() => setIdentityModalOpen(false)}
        kind="invoice"
        documentId={id}
        initialNumero={facture.numero}
        initialTitle={facture.title || ""}
        onSaved={(next) => {
          setFacture((prev) => (prev ? { ...prev, numero: next.numero, title: next.title } : prev));
          setIdentityModalOpen(false);
          toast.success(t("dashboard.documents.identityEdit.success"));
        }}
      />

      {/* Statut et notes */}
      <GlassCard padding="md">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-[#E2E8F0]">{t("dashboard.common.status")}</label>
          <select
            value={facture.statut}
            disabled={Boolean(facture.archived)}
            onChange={(e) =>
              handleChangerStatut(
                e.target.value as "brouillon" | "envoye" | "paye" | "en-retard"
              )
            }
            className={dashboardSelectLgClass}
          >
            <option value="brouillon">{t("dashboard.status.invoice.draft")}</option>
            <option value="envoye">{t("dashboard.status.invoice.sent")}</option>
            <option value="paye">{t("dashboard.status.invoice.paid")}</option>
            <option value="en-retard">{t("dashboard.status.invoice.overdue")}</option>
          </select>
          {!facture.archived && facture.statut !== "paye" ? (
            <button
              type="button"
              className="mt-3 rounded-lg bg-[#0F172A] px-3 py-1.5 text-sm font-semibold text-white"
              onClick={() => setReceiptOpen(true)}
            >
              Marquer comme payée
            </button>
          ) : null}
        </div>
        {facture.notes && (
          <div>
            <label className="mb-2 block text-sm font-medium text-[#E2E8F0]">{t("dashboard.common.notes")}</label>
            <p className="whitespace-pre-line text-[#F1F5F9]">{facture.notes}</p>
          </div>
        )}
      </GlassCard>
      <DeleteDocumentDialog
        target={deleteOpen ? { id, numero: facture.numero, kind: "invoice" } : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => router.push("/tableau-de-bord/factures")}
      />
      {receiptOpen && !facture.archived ? (
        <MarkPaidDialog
          documentId={id}
          onClose={() => setReceiptOpen(false)}
          onDone={(status) => {
            setFacture((current) => (current ? { ...current, statut: status as Facture["statut"] } : current));
            setReceiptOpen(false);
            toast.success(status === "paye" ? "Facture payée" : "Encaissement enregistré");
          }}
        />
      ) : null}
      </PageLayout>
    </>
  );
}




