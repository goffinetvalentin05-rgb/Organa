"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { calculerTotalHT, calculerTVA, calculerTotalTTC } from "@/lib/utils/calculations";
import { formatCurrency } from "@/lib/utils/currency";
import { Eye, Download, Mail, Trash, Calendar } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import LinkInvoiceToEventModal, {
  type EventListItem,
} from "./LinkInvoiceToEventModal";

interface Facture {
  id: string;
  numero: string;
  clientId?: string | null;
  client?: { nom?: string; email?: string; adresse?: string; telephone?: string };
  lignes: any[];
  statut: "brouillon" | "envoye" | "paye" | "en-retard";
  dateCreation: string;
  dateEcheance?: string | null;
  datePaiement?: string | null;
  notes?: string | null;
  type?: string;
  eventId?: string | null;
  linkedEvent?: { id: string; name: string } | null;
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
  const id = (params?.id as string) || "";
  const { t, locale } = useI18n();
  const [facture, setFacture] = useState<Facture | null>(null);
  const [envoiEmail, setEnvoiEmail] = useState(false);
  const [currency, setCurrency] = useState<string>("CHF");
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventsList, setEventsList] = useState<EventListItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);

  const loadFacture = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        router.push("/tableau-de-bord/factures");
        return;
      }
      const data = await response.json();
      if (!data.document || data.document.type !== "invoice") {
        router.push("/tableau-de-bord/factures");
        return;
      }
      setFacture(data.document);
    } catch (error) {
      console.error("[Facture] Erreur chargement:", error);
      router.push("/tableau-de-bord/factures");
    }
  }, [id, router]);

  useEffect(() => {
    if (!id) {
      router.push("/tableau-de-bord/factures");
      return;
    }

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
  }, [id, router, loadFacture]);

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

  const handleDelete = async () => {
    if (!confirm(t("dashboard.invoices.detail.deleteConfirm"))) return;
    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(t("dashboard.invoices.detail.deleteError"));
      }
      router.push("/tableau-de-bord/factures");
    } catch (error: any) {
      toast.error(error?.message || t("dashboard.invoices.detail.deleteErrorFallback"));
    }
  };

  const handleEnvoyerEmail = async () => {
    if (!facture || !facture.client?.email) {
      if (typeof toast !== "undefined" && toast.error) {
        toast.error(t("dashboard.invoices.detail.missingClientEmail"));
      }
      return;
    }

    setEnvoiEmail(true);
    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "facture",
          documentId: id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || t("dashboard.invoices.detail.sendError"));
      }

      if (typeof toast !== "undefined" && toast.success) {
        toast.success(t("dashboard.invoices.detail.sendSuccess"));
      }
      // Mettre à jour le statut si c'est un brouillon
      if (facture.statut === "brouillon") {
        handleChangerStatut("envoye");
      }
    } catch (error: any) {
      if (typeof toast !== "undefined" && toast.error) {
        const errorMessage = error?.message || t("dashboard.invoices.detail.sendErrorFallback");
        toast.error(String(errorMessage));
      }
    } finally {
      setEnvoiEmail(false);
    }
  };

  const handleImprimer = () => {
    window.print();
  };

  const handleChangerStatut = async (nouveauStatut: Facture["statut"]) => {
    if (!facture) return;
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
    } catch (error: any) {
      toast.error(error?.message || t("dashboard.invoices.detail.statusUpdateError"));
    }
  };


  if (!facture) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-secondary">{t("dashboard.common.loading")}</p>
      </div>
    );
  }

  if (!facture.lignes || !Array.isArray(facture.lignes)) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-secondary">{t("dashboard.invoices.detail.invalidData")}</p>
        <Link
          href="/tableau-de-bord/factures"
          className="text-secondary hover:text-primary mt-4 inline-block"
        >
          ← {t("dashboard.invoices.detail.backToList")}
        </Link>
      </div>
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/tableau-de-bord/factures"
            className="text-secondary hover:text-primary mb-2 inline-block"
          >
            ← {t("dashboard.invoices.detail.backToList")}
          </Link>
          <h1 className="text-3xl font-bold">{facture.numero}</h1>
          <p className="mt-2 text-secondary">
            {t("dashboard.common.client")}: {facture.client?.nom || t("dashboard.common.unknownClient")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleEnvoyerEmail}
            disabled={envoiEmail || !facture.client?.email}
            className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            <Mail className="w-4 h-4" />
            {envoiEmail ? t("dashboard.invoices.detail.sending") : t("dashboard.invoices.detail.sendEmail")}
          </button>
          <button
            onClick={() => {
              if (!id) {
                toast.error(t("dashboard.common.missingDocumentId"));
                return;
              }
              const url = `/api/documents/${id}/pdf?type=invoice`;
              console.log("Opening PDF URL:", url);
              window.open(url, "_blank");
            }}
            disabled={!id}
            className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            <Eye className="w-4 h-4" />
            {t("dashboard.invoices.detail.previewPdf")}
          </button>
          <button
            onClick={() => {
              if (!id) {
                toast.error(t("dashboard.common.missingDocumentId"));
                return;
              }
              const url = `/api/documents/${id}/pdf?type=invoice&download=true`;
              console.log("Downloading PDF URL:", url);
              const link = document.createElement("a");
              link.href = url;
              link.download = `obillz-invoice-${facture?.numero || id}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            disabled={!id}
            className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            <Download className="w-4 h-4" />
            {t("dashboard.invoices.detail.downloadPdf")}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all flex items-center gap-2"
          >
            <Trash className="w-4 h-4" />
            {t("dashboard.common.delete")}
          </button>
        </div>
      </div>

      {/* Aperçu */}
      <div className="rounded-2xl border border-subtle bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            {companySettings?.logo_url && (
              <img
                src={companySettings.logo_url}
                alt={companySettings.company_name || "Logo"}
                className="h-12 w-auto object-contain"
              />
            )}
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
              style={{ color: companySettings?.primary_color || "#1D4ED8" }}
            >
              Facture
            </p>
            <p className="text-sm text-slate-500 mt-1">
              N° {facture.numero}
            </p>
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
            Client
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {facture.client?.nom || t("dashboard.common.unknownClient")}
          </p>
          {facture.client?.adresse && (
            <p className="text-sm text-slate-500 whitespace-pre-line">
              {facture.client.adresse}
            </p>
          )}
          {facture.client?.email && (
            <p className="text-sm text-slate-500">{facture.client.email}</p>
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
      <div className="rounded-xl border border-subtle bg-surface p-6">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--obillz-blue-light)" }}
          >
            <Calendar className="w-5 h-5 text-[var(--obillz-hero-blue)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-slate-900">
              {t("dashboard.invoices.detail.eventSectionTitle")}
            </h2>
            {facture.linkedEvent ? (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {t("dashboard.invoices.detail.eventLinkedLabel")}
                  </p>
                  <Link
                    href={`/tableau-de-bord/evenements/${facture.linkedEvent.id}`}
                    className="mt-1 inline-block text-lg font-semibold text-[var(--obillz-hero-blue)] hover:underline"
                  >
                    {facture.linkedEvent.name}
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openEventModal}
                    disabled={linkSaving}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {t("dashboard.invoices.detail.changeEvent")}
                  </button>
                  <button
                    type="button"
                    onClick={handleUnlinkEvent}
                    disabled={linkSaving}
                    className="px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
                  >
                    {t("dashboard.invoices.detail.unlinkEvent")}
                  </button>
                </div>
              </div>
            ) : facture.eventId ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {t("dashboard.invoices.detail.eventOrphan")}
                </p>
                <button
                  type="button"
                  onClick={openEventModal}
                  disabled={linkSaving}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[var(--obillz-hero-blue,#1d4ed8)] hover:opacity-95 disabled:opacity-50 transition-colors"
                >
                  {t("dashboard.invoices.detail.linkToEvent")}
                </button>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-slate-500 mb-3">
                  {t("dashboard.invoices.detail.eventNone")}
                </p>
                <button
                  type="button"
                  onClick={openEventModal}
                  disabled={linkSaving}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[var(--obillz-hero-blue,#1d4ed8)] hover:opacity-95 disabled:opacity-50 transition-colors"
                >
                  {t("dashboard.invoices.detail.linkToEvent")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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

      {/* Statut et notes */}
      <div className="rounded-xl border border-subtle bg-surface p-6">
        <div className="mb-4">
          <label className="text-sm text-secondary mb-2 block">{t("dashboard.common.status")}</label>
          <select
            value={facture.statut}
            onChange={(e) =>
              handleChangerStatut(
                e.target.value as "brouillon" | "envoye" | "paye" | "en-retard"
              )
            }
            className="rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          >
            <option value="brouillon">{t("dashboard.status.invoice.draft")}</option>
            <option value="envoye">{t("dashboard.status.invoice.sent")}</option>
            <option value="paye">{t("dashboard.status.invoice.paid")}</option>
            <option value="en-retard">{t("dashboard.status.invoice.overdue")}</option>
          </select>
        </div>
        {facture.notes && (
          <div>
            <label className="text-sm text-secondary mb-2 block">{t("dashboard.common.notes")}</label>
            <p className="text-primary">{facture.notes}</p>
          </div>
        )}
      </div>

    </div>
  );
}




