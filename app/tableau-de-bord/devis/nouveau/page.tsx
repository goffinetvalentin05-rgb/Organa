"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  LigneDocument,
  calculerTotalHT,
  calculerTVA,
  calculerTotalTTC,
} from "@/lib/utils/calculations";
import { Plus, Eye, Download, Trash, Loader } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

export default function NouveauDevisPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientId, setClientId] = useState("");
  const [lignes, setLignes] = useState<LigneDocument[]>([
    { id: "1", designation: "", quantite: 1, prixUnitaire: 0, tva: 7.7 },
  ]);
  const [statut, setStatut] = useState<"brouillon" | "envoye" | "accepte" | "refuse">("brouillon");
  const [dateEcheance, setDateEcheance] = useState("");
  const [notes, setNotes] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [savingForPdf, setSavingForPdf] = useState(false);

  // Charger les clients depuis l'API Supabase
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const res = await fetch("/api/clients", { cache: "no-store" });
        if (!res.ok) {
          console.error("[Devis] Erreur chargement clients:", res.statusText);
          toast.error(t("dashboard.quotes.clientsLoadError"));
          return;
        }
        const data = await res.json();
        console.log(`[Devis] Clients source: API /api/clients, count=${data.clients?.length || 0}`);
        setClients(data.clients || []);
      } catch (error: any) {
        console.error("[Devis] Erreur chargement clients:", error);
        toast.error(t("dashboard.quotes.clientsLoadError"));
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      {
        id: Date.now().toString(),
        designation: "",
        quantite: 1,
        prixUnitaire: 0,
        tva: 7.7,
      },
    ]);
  };

  const supprimerLigne = (id: string) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((l) => l.id !== id));
    }
  };

  const modifierLigne = (
    id: string,
    updates: Partial<Omit<LigneDocument, "id">>
  ) => {
    setLignes(
      lignes.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error(t("dashboard.quotes.selectClientError"));
      return;
    }

    const lignesValides = lignes.filter(
      (l) => l.designation.trim() !== ""
    );

    if (lignesValides.length === 0) {
      toast.error(t("dashboard.quotes.lineRequiredError"));
      return;
    }

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "quote",
          clientId,
          lignes: lignesValides,
          statut,
          dateCreation: new Date().toISOString().split("T")[0],
          ...(dateEcheance && dateEcheance.trim() !== "" ? { dateEcheance } : {}),
          ...(notes && notes.trim() !== "" ? { notes } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("dashboard.quotes.createError"));
      }

      const data = await response.json();
      setDocumentId(data.id);
      console.log("[Devis] Devis créé via API avec ID:", data.id, "Numéro:", data.numero);
      router.push(`/tableau-de-bord/devis/${data.id}`);
    } catch (error: any) {
      console.error("[Devis] Erreur lors de la création:", error);
      toast.error(
        `${t("dashboard.quotes.createError")}: ${error.message || t("dashboard.common.unknownError")}`
      );
    }
  };

  // Fonction pour sauvegarder le document avant de générer le PDF
  const saveAndOpenPdf = async (download: boolean = false) => {
    // Validation
    if (!clientId) {
      toast.error(t("dashboard.quotes.selectClientError"));
      return;
    }

    const lignesValides = lignes.filter(
      (l) => l.designation.trim() !== ""
    );

    if (lignesValides.length === 0) {
      toast.error(t("dashboard.quotes.lineRequiredError"));
      return;
    }

    setSavingForPdf(true);

    try {
      let id = documentId;
      let numero: string | undefined;

      // Si le document n'existe pas encore, le créer via l'API
      if (!id) {
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        body: JSON.stringify({
          type: "quote",
          clientId,
          lignes: lignesValides,
          statut,
          dateCreation: new Date().toISOString().split("T")[0],
          ...(dateEcheance && dateEcheance.trim() !== "" ? { dateEcheance } : {}),
          ...(notes && notes.trim() !== "" ? { notes } : {}),
        }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t("dashboard.quotes.createDocumentError"));
        }

        const data = await response.json();
        id = data.id.toString();
        numero = data.numero;
        setDocumentId(id);
        console.log("[Devis][PDF] Document créé via API avec ID:", id, "Numéro:", numero);
      } else {
        // Sinon, mettre à jour le document existant via l'API
        const response = await fetch("/api/documents", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            type: "quote",
            clientId,
            lignes: lignesValides,
            statut,
            ...(dateEcheance && dateEcheance.trim() !== "" ? { dateEcheance } : { dateEcheance: null }),
            ...(notes && notes.trim() !== "" ? { notes } : { notes: null }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t("dashboard.quotes.updateDocumentError"));
        }

        const data = await response.json();
        numero = data.numero;
        console.log("[Devis][PDF] Document mis à jour via API avec ID:", id, "Numéro:", numero);
      }

      // Ouvrir le PDF
      const url = `/api/documents/${id}/pdf?type=quote${download ? "&download=true" : ""}`;
      console.log("[Devis][PDF] Opening PDF URL:", url, "Document ID:", id);
      
      if (download) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `organa-quote-${numero || id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url, "_blank");
      }
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde pour PDF:", error);
      toast.error(
        `${t("dashboard.quotes.saveForPdfError")}: ${error.message || t("dashboard.common.unknownError")}`
      );
    } finally {
      setSavingForPdf(false);
    }
  };

  const totalHT = calculerTotalHT(lignes);
  const totalTVA = calculerTVA(lignes);
  const totalTTC = calculerTotalTTC(lignes);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.quotes.newTitle")}</h1>
        <p className="mt-2 text-secondary">{t("dashboard.quotes.newSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-subtle bg-surface p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.quotes.fields.client")}
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={loadingClients}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingClients ? t("dashboard.quotes.loadingClients") : t("dashboard.quotes.selectClient")}
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.common.status")}
            </label>
            <select
              value={statut}
              onChange={(e) =>
                setStatut(
                  e.target.value as "brouillon" | "envoye" | "accepte" | "refuse"
                )
              }
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            >
              <option value="brouillon">{t("dashboard.status.quote.draft")}</option>
              <option value="envoye">{t("dashboard.status.quote.sent")}</option>
              <option value="accepte">{t("dashboard.status.quote.accepted")}</option>
              <option value="refuse">{t("dashboard.status.quote.refused")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.quotes.fields.dueDate")}
            </label>
            <input
              type="date"
              value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t("dashboard.quotes.lines.title")}</h2>
            <button
              type="button"
              onClick={ajouterLigne}
              className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary transition-all text-sm flex items-center gap-2 border border-subtle"
            >
              <Plus className="w-4 h-4" />
              {t("dashboard.quotes.lines.add")}
            </button>
          </div>

          <div className="space-y-4">
            {lignes.map((ligne, index) => (
              <div
                key={ligne.id}
                className="p-4 rounded-lg border border-subtle bg-surface-hover space-y-3"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-primary mb-2">
                      {t("dashboard.quotes.lines.titleLabel")}
                    </label>
                    <input
                      type="text"
                      value={ligne.designation}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          designation: e.target.value,
                        })
                      }
                      placeholder={t("dashboard.quotes.lines.titlePlaceholder")}
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-primary mb-2">
                      {t("dashboard.quotes.lines.descriptionLabel")}
                    </label>
                    <textarea
                      value={ligne.description || ""}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder={t("dashboard.quotes.lines.descriptionPlaceholder")}
                      rows={3}
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      {t("dashboard.quotes.lines.quantity")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ligne.quantite}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          quantite: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      {t("dashboard.quotes.lines.unitPrice")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ligne.prixUnitaire}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          prixUnitaire: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      {t("dashboard.quotes.lines.vat")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ligne.tva || 0}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          tva: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <div className="text-sm text-secondary">
                      {t("dashboard.quotes.lines.subtotal")}{" "}
                      {new Intl.NumberFormat(localeToIntl[locale], {
                        style: "currency",
                        currency: "CHF",
                      }).format(ligne.quantite * ligne.prixUnitaire)}
                    </div>
                    {lignes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => supprimerLigne(ligne.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm flex items-center gap-1.5"
                      >
                        <Trash className="w-4 h-4" />
                        {t("dashboard.common.delete")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="text-xl font-semibold mb-4">{t("dashboard.quotes.fields.notes")}</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={t("dashboard.quotes.fields.notesPlaceholder")}
            className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          />
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-6">
          <div className="space-y-2 text-right">
            <div className="flex justify-between text-secondary">
              <span>{t("dashboard.quotes.summary.totalHT")}</span>
              <span>
                {new Intl.NumberFormat(localeToIntl[locale], {
                  style: "currency",
                  currency: "CHF",
                }).format(totalHT)}
              </span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>{t("dashboard.quotes.summary.vat")}</span>
              <span>
                {new Intl.NumberFormat(localeToIntl[locale], {
                  style: "currency",
                  currency: "CHF",
                }).format(totalTVA)}
              </span>
            </div>
            <div className="flex justify-between text-2xl font-bold pt-2 border-t border-subtle">
              <span>{t("dashboard.quotes.summary.totalTTC")}</span>
              <span>
                {new Intl.NumberFormat(localeToIntl[locale], {
                  style: "currency",
                  currency: "CHF",
                }).format(totalTTC)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 rounded-lg bg-surface-hover hover:bg-surface text-primary transition-all"
          >
            {t("dashboard.common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => saveAndOpenPdf(false)}
            disabled={savingForPdf}
            className="px-6 py-3 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            {savingForPdf ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t("dashboard.quotes.saving")}
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                {t("dashboard.quotes.previewPdf")}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => saveAndOpenPdf(true)}
            disabled={savingForPdf}
            className="px-6 py-3 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            {savingForPdf ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t("dashboard.quotes.saving")}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {t("dashboard.quotes.downloadPdf")}
              </>
            )}
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 rounded-lg accent-bg text-white font-medium transition-all"
          >
            {t("dashboard.quotes.createAction")}
          </button>
        </div>
      </form>
    </div>
  );
}







