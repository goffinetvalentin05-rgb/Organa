"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  calculerTotalHT,
  calculerTVA,
  calculerTotalTTC,
} from "@/lib/utils/calculations";
import { formatCurrency } from "@/lib/utils/currency";
import { Eye, Download, Mail, Trash, ArrowRight } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";

interface Devis {
  id: string;
  numero: string;
  clientId?: string | null;
  client?: { nom?: string; email?: string };
  lignes: any[];
  statut: "brouillon" | "envoye" | "accepte" | "refuse";
  dateCreation: string;
  dateEcheance?: string | null;
  notes?: string | null;
  type?: string;
}

export default function DevisDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";
  const { t, locale } = useI18n();
  const [devis, setDevis] = useState<Devis | null>(null);
  const [envoiEmail, setEnvoiEmail] = useState(false);
  const [currency, setCurrency] = useState<string>("CHF");

  useEffect(() => {
    if (!id) {
      router.push("/tableau-de-bord/devis");
      return;
    }

    const loadDevis = async () => {
      try {
        const response = await fetch(`/api/documents?id=${id}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          router.push("/tableau-de-bord/devis");
          return;
        }
        const data = await response.json();
        if (!data.document || data.document.type !== "quote") {
          router.push("/tableau-de-bord/devis");
          return;
        }
        setDevis(data.document);
      } catch (error) {
        console.error("[Devis] Erreur chargement:", error);
        router.push("/tableau-de-bord/devis");
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

    void loadDevis();
    void loadCurrency();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm(t("dashboard.quotes.detail.deleteConfirm"))) return;
    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(t("dashboard.quotes.detail.deleteError"));
      }
      router.push("/tableau-de-bord/devis");
    } catch (error: any) {
      toast.error(error?.message || t("dashboard.quotes.detail.deleteErrorFallback"));
    }
  };

  const handleTransformerEnFacture = async () => {
    if (!devis) return;
    if (!confirm(t("dashboard.quotes.detail.convertConfirm"))) return;
    if (!devis.clientId) {
      toast.error(t("dashboard.quotes.detail.missingClient"));
      return;
    }
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "invoice",
          clientId: devis.clientId,
          lignes: devis.lignes,
          statut: "brouillon",
          dateCreation: new Date().toISOString().split("T")[0],
          ...(devis.dateEcheance ? { dateEcheance: devis.dateEcheance } : {}),
          ...(devis.notes ? { notes: devis.notes } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || t("dashboard.quotes.detail.convertError"));
      }

      const data = await response.json();
      router.push(`/tableau-de-bord/factures/${data.id}`);
    } catch (error: any) {
      toast.error(error?.message || t("dashboard.quotes.detail.convertErrorFallback"));
    }
  };

  const handleChangerStatut = async (nouveauStatut: Devis["statut"]) => {
    if (!devis) return;
    try {
      const response = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          type: "quote",
          statut: nouveauStatut,
        }),
      });

      if (!response.ok) {
        throw new Error(t("dashboard.quotes.detail.statusUpdateError"));
      }

      setDevis({ ...devis, statut: nouveauStatut });
    } catch (error: any) {
      toast.error(error?.message || t("dashboard.quotes.detail.statusUpdateError"));
    }
  };

  const handleEnvoyerEmail = async () => {
    if (!devis || !devis.client?.email) {
      if (typeof toast !== "undefined" && toast.error) {
        toast.error(t("dashboard.quotes.detail.missingClientEmail"));
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
          type: "devis",
          documentId: id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || t("dashboard.quotes.detail.sendError"));
      }

      if (typeof toast !== "undefined" && toast.success) {
        toast.success(t("dashboard.quotes.detail.sendSuccess"));
      }
      if (devis.statut === "brouillon") {
        handleChangerStatut("envoye");
      }
    } catch (error: any) {
      if (typeof toast !== "undefined" && toast.error) {
        const errorMessage = error?.message || t("dashboard.quotes.detail.sendErrorFallback");
        toast.error(String(errorMessage));
      }
    } finally {
      setEnvoiEmail(false);
    }
  };

  if (!devis) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-secondary">{t("dashboard.common.loading")}</p>
      </div>
    );
  }

  if (!devis.lignes || !Array.isArray(devis.lignes)) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-secondary">{t("dashboard.quotes.detail.invalidData")}</p>
        <Link
          href="/tableau-de-bord/devis"
          className="text-secondary hover:text-primary mt-4 inline-block"
        >
          ← {t("dashboard.quotes.detail.backToList")}
        </Link>
      </div>
    );
  }

  const totalHT = calculerTotalHT(devis.lignes);
  const totalTVA = calculerTVA(devis.lignes);
  const totalTTC = calculerTotalTTC(devis.lignes);

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
      accepte: "bg-green-100 text-green-700",
      refuse: "bg-red-100 text-red-700",
    };
    return colors[statut] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/tableau-de-bord/devis"
            className="text-secondary hover:text-primary mb-2 inline-block"
          >
            ← {t("dashboard.quotes.detail.backToList")}
          </Link>
          <h1 className="text-3xl font-bold">{devis.numero}</h1>
          <p className="mt-2 text-secondary">
            {t("dashboard.common.client")}: {devis.client?.nom || t("dashboard.common.unknownClient")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleEnvoyerEmail}
            disabled={envoiEmail || !devis.client?.email}
            className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            <Mail className="w-4 h-4" />
            {envoiEmail ? t("dashboard.quotes.detail.sending") : t("dashboard.quotes.detail.sendEmail")}
          </button>
          <button
            onClick={() => {
              if (!id) {
                toast.error(t("dashboard.common.missingDocumentId"));
                return;
              }
              const url = `/api/documents/${id}/pdf?type=quote`;
              console.log("Opening PDF URL:", url);
              window.open(url, "_blank");
            }}
            disabled={!id}
            className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            <Eye className="w-4 h-4" />
            {t("dashboard.quotes.detail.previewPdf")}
          </button>
          <button
            onClick={() => {
              if (!id) {
                toast.error(t("dashboard.common.missingDocumentId"));
                return;
              }
              const url = `/api/documents/${id}/pdf?type=quote&download=true`;
              console.log("Downloading PDF URL:", url);
              const link = document.createElement("a");
              link.href = url;
              link.download = `organa-quote-${devis?.numero || id}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            disabled={!id}
            className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            <Download className="w-4 h-4" />
            {t("dashboard.quotes.detail.downloadPdf")}
          </button>
          <button
            onClick={handleTransformerEnFacture}
            className="px-4 py-2 rounded-lg accent-bg text-white font-medium transition-all flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            {t("dashboard.quotes.detail.convertAction")}
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

      <div className="rounded-xl border border-subtle bg-surface p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-secondary">{t("dashboard.quotes.detail.createdAt")}</label>
            <p className="font-medium">{formatDate(devis.dateCreation)}</p>
          </div>
          {devis.dateEcheance && (
            <div>
              <label className="text-sm text-secondary">{t("dashboard.quotes.detail.dueDate")}</label>
              <p className="font-medium">{formatDate(devis.dateEcheance)}</p>
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="text-sm text-secondary mb-2 block">{t("dashboard.common.status")}</label>
          <select
            value={devis.statut}
            onChange={(e) =>
              handleChangerStatut(
                e.target.value as "brouillon" | "envoye" | "accepte" | "refuse"
              )
            }
            className="rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          >
            <option value="brouillon">{t("dashboard.status.quote.draft")}</option>
            <option value="envoye">{t("dashboard.status.quote.sent")}</option>
            <option value="accepte">{t("dashboard.status.quote.accepted")}</option>
            <option value="refuse">{t("dashboard.status.quote.refused")}</option>
          </select>
        </div>
        {devis.notes && (
          <div>
            <label className="text-sm text-secondary mb-2 block">{t("dashboard.common.notes")}</label>
            <p className="text-primary">{devis.notes}</p>
          </div>
        )}
      </div>

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
              {devis.lignes && devis.lignes.length > 0 ? (
                devis.lignes.map((ligne) => {
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

    </div>
  );
}



