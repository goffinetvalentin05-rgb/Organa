"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { calculerTotalHT, calculerTVA, calculerTotalTTC } from "@/lib/utils/calculations";
import { calendrierAPI } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils/currency";
import { Eye, Download, Mail, Trash, FileText } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import AssistantTriggerButton from "@/components/assistant/AssistantTriggerButton";
import EmailHistoryList from "@/components/assistant/EmailHistoryList";

interface Facture {
  id: string;
  numero: string;
  clientId?: string | null;
  client?: { nom?: string; email?: string };
  lignes: any[];
  statut: "brouillon" | "envoye" | "paye" | "en-retard";
  dateCreation: string;
  dateEcheance?: string | null;
  datePaiement?: string | null;
  notes?: string | null;
  type?: string;
}

export default function FactureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";
  const { t, locale } = useI18n();
  const [facture, setFacture] = useState<Facture | null>(null);
  const [envoiEmail, setEnvoiEmail] = useState(false);
  const [currency, setCurrency] = useState<string>("CHF");

  useEffect(() => {
    if (!id) {
      router.push("/tableau-de-bord/factures");
      return;
    }

    const loadFacture = async () => {
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
    };

    const loadCurrency = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const data = await res.json();
        if (data.settings?.currency) {
          setCurrency(data.settings.currency);
        }
      } catch (err) {
        console.error("Erreur lors du chargement de la devise:", err);
      }
    };

    void loadFacture();
    void loadCurrency();
  }, [id, router]);

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

  const handleCreerTacheRelance = () => {
    if (!facture) return;
    
    const dateEcheance = facture.dateEcheance 
      ? new Date(facture.dateEcheance)
      : new Date();
    dateEcheance.setDate(dateEcheance.getDate() + 7); // 7 jours après l'échéance

    calendrierAPI.create({
      titre: t("dashboard.invoices.detail.followupTaskTitle", { number: facture.numero || "" }),
      description: t("dashboard.invoices.detail.followupTaskDescription", {
        client: facture.client?.nom || "",
        number: facture.numero || "",
      }),
      date: new Date().toISOString().split("T")[0],
      type: "tache",
      statut: "a-faire",
      typeTache: "relance",
      dateEcheance: dateEcheance.toISOString().split("T")[0],
      factureId: facture.id || "",
    });

    if (typeof toast !== "undefined" && toast.success) {
      toast.success(t("dashboard.invoices.detail.followupTaskCreated"));
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
          <AssistantTriggerButton
            context={{
              source: "facture",
              client: {
                id: facture.clientId ?? undefined,
                nom: facture.client?.nom,
                email: facture.client?.email,
              },
              document: {
                id: facture.id,
                numero: facture.numero,
                type: "facture",
                montant: totalTTC,
                dateEcheance: facture.dateEcheance,
                currency,
              },
            }}
          />
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
              link.download = `organa-invoice-${facture?.numero || id}.pdf`;
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
          {facture.statut !== "paye" && (
            <button
              onClick={handleCreerTacheRelance}
              className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all flex items-center gap-2 border border-subtle"
            >
              <FileText className="w-4 h-4" />
              {t("dashboard.invoices.detail.createFollowup")}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all flex items-center gap-2"
          >
            <Trash className="w-4 h-4" />
            {t("dashboard.common.delete")}
          </button>
        </div>
      </div>

      {/* Informations */}
      <div className="rounded-xl border border-subtle bg-surface p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-secondary">{t("dashboard.invoices.detail.createdAt")}</label>
            <p className="font-medium">{formatDate(facture.dateCreation)}</p>
          </div>
          {facture.dateEcheance && (
            <div>
              <label className="text-sm text-secondary">{t("dashboard.invoices.detail.dueDate")}</label>
              <p className="font-medium">{formatDate(facture.dateEcheance)}</p>
            </div>
          )}
          {facture.datePaiement && (
            <div>
              <label className="text-sm text-secondary">{t("dashboard.invoices.detail.paidAt")}</label>
              <p className="font-medium">{formatDate(facture.datePaiement)}</p>
            </div>
          )}
        </div>
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

      {/* Lignes */}
      <div className="rounded-xl border border-subtle bg-surface p-6">
        <h2 className="text-xl font-semibold mb-4">{t("dashboard.common.lines")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-primary">
                  {t("dashboard.common.designation")}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-primary">
                  {t("dashboard.common.quantity")}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-primary">
                  {t("dashboard.common.unitPrice")}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-primary">
                  {t("dashboard.common.vat")}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-primary">
                  {t("dashboard.common.total")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {facture.lignes && facture.lignes.length > 0 ? (
                facture.lignes.map((ligne) => {
                  if (!ligne) return null;
                  const sousTotal = (ligne.quantite || 0) * (ligne.prixUnitaire || 0);
                  return (
                    <tr key={ligne.id || Math.random()}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{ligne.designation || ""}</div>
                        {ligne.description && (
                          <div className="text-sm text-secondary mt-1 whitespace-pre-line">
                            {ligne.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{ligne.quantite || 0}</td>
                      <td className="px-4 py-3 text-right">
                        {formatMontant(ligne.prixUnitaire || 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {ligne.tva || 0}%
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatMontant(sousTotal)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center text-secondary">
                    {t("dashboard.common.noLines")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="mt-6 pt-6 border-t border-subtle space-y-2 text-right">
          <div className="flex justify-between text-secondary">
            <span>{t("dashboard.common.totalHT")}</span>
            <span>{formatMontant(totalHT)}</span>
          </div>
          <div className="flex justify-between text-secondary">
            <span>{t("dashboard.common.vatLabel")}</span>
            <span>{formatMontant(totalTVA)}</span>
          </div>
          <div className="flex justify-between text-2xl font-bold pt-2">
            <span>{t("dashboard.common.totalTTC")}</span>
            <span>{formatMontant(totalTTC)}</span>
          </div>
        </div>
      </div>

      <EmailHistoryList relatedType="facture" relatedId={facture.id} clientId={facture.clientId ?? undefined} />
    </div>
  );
}




