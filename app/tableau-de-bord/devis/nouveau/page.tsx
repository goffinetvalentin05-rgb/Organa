"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  PageLayout,
  PageHeader,
  GlassCard,
  ActionButton,
} from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import {
  type CotisationClient,
  type RecipientType,
  type ExistingQuoteSummary,
  findDuplicateTargets,
  getCategoryLabel,
  getPlayers,
  getTeamsWithCounts,
  resolveCotisationTargets,
} from "@/lib/quotes/recipients";

export default function NouveauDevisPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [clients, setClients] = useState<CotisationClient[]>([]);
  const [existingQuotes, setExistingQuotes] = useState<ExistingQuoteSummary[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [recipientType, setRecipientType] = useState<RecipientType>("individual");
  const [memberId, setMemberId] = useState("");
  const [teamCategory, setTeamCategory] = useState("");
  const [lignes, setLignes] = useState<LigneDocument[]>([
    { id: "1", designation: "", quantite: 1, prixUnitaire: 0, tva: 7.7 },
  ]);
  const [statut, setStatut] = useState<"brouillon" | "envoye" | "accepte" | "refuse">("brouillon");
  const [dateEcheance, setDateEcheance] = useState("");
  const [notes, setNotes] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [savingForPdf, setSavingForPdf] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
    created: number;
    message: string;
  } | null>(null);
  const [bulkSummary, setBulkSummary] = useState<{
    created: number;
    emailed: number;
    skippedNoEmail: number;
    failed: number;
    total: number;
  } | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(localeToIntl[locale], {
        style: "currency",
        currency: "CHF",
      }),
    [locale]
  );

  const translateCategory = useCallback((key: string) => t(key), [t]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingClients(true);
        const [clientsRes, quotesRes] = await Promise.all([
          fetch("/api/clients", { cache: "no-store" }),
          fetch("/api/documents?type=quote", { cache: "no-store" }),
        ]);

        if (!clientsRes.ok) {
          console.error("[Devis] Erreur chargement clients:", clientsRes.statusText);
          toast.error(t("dashboard.quotes.clientsLoadError"));
        } else {
          const data = await clientsRes.json();
          setClients(data.clients || []);
        }

        if (quotesRes.ok) {
          const quotesData = await quotesRes.json();
          const summaries: ExistingQuoteSummary[] = (quotesData.documents || []).map(
            (doc: {
              clientId?: string | null;
              dateEcheance?: string | null;
              totalTTC?: number;
              statut?: string;
            }) => ({
              client_id: doc.clientId || "",
              date_echeance: doc.dateEcheance ?? null,
              total_ttc: Number(doc.totalTTC ?? 0),
              status: doc.statut ?? "brouillon",
            })
          );
          setExistingQuotes(summaries);
        }
      } catch (error) {
        console.error("[Devis] Erreur chargement données:", error);
        toast.error(t("dashboard.quotes.clientsLoadError"));
      } finally {
        setLoadingClients(false);
      }
    };

    loadData();
  }, [t]);

  const teamsWithCounts = useMemo(() => getTeamsWithCounts(clients), [clients]);

  const targetMembers = useMemo(
    () => resolveCotisationTargets(recipientType, clients, memberId, teamCategory),
    [recipientType, clients, memberId, teamCategory]
  );

  const selectedTeamLabel = useMemo(() => {
    if (!teamCategory) return "";
    return getCategoryLabel(teamCategory, translateCategory);
  }, [teamCategory, translateCategory]);

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

  const getLignesValides = () =>
    lignes.filter((l) => l.designation.trim() !== "");

  const createQuoteForClient = async (
    targetClientId: string,
    lignesValides: LigneDocument[]
  ): Promise<{ id: string; numero?: string }> => {
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "quote",
        clientId: targetClientId,
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
    return { id: data.id, numero: data.numero };
  };

  const generateQuotePdf = async (id: string): Promise<void> => {
    const response = await fetch(
      `/api/documents/${id}/pdf?type=quote&download=true`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Erreur génération PDF");
    }
  };

  const sendQuoteEmail = async (id: string): Promise<void> => {
    const response = await fetch("/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "cotisation",
        documentId: id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.error || t("dashboard.quotes.detail.sendError"));
    }
  };

  const handleBulkSubmit = async (
    targets: CotisationClient[],
    lignesValides: LigneDocument[]
  ) => {
    if (targets.length === 0) {
      toast.error(t("dashboard.quotes.recipients.noTargets"));
      return;
    }

    setIsBulkProcessing(true);
    setBulkSummary(null);
    setBulkProgress({
      current: 0,
      total: targets.length,
      created: 0,
      message: t("dashboard.quotes.recipients.bulkInitializing"),
    });

    let created = 0;
    let emailed = 0;
    let skippedNoEmail = 0;
    let failed = 0;

    for (let index = 0; index < targets.length; index += 1) {
      const client = targets[index];
      const step = index + 1;

      try {
        setBulkProgress({
          current: index,
          total: targets.length,
          created,
          message: t("dashboard.quotes.recipients.bulkCreating", {
            step: String(step),
            total: String(targets.length),
            name: client.nom,
          }),
        });

        const createdQuote = await createQuoteForClient(client.id, lignesValides);
        created += 1;

        setBulkProgress({
          current: index,
          total: targets.length,
          created,
          message: t("dashboard.quotes.recipients.bulkPdf", {
            step: String(step),
            total: String(targets.length),
            name: client.nom,
          }),
        });

        await generateQuotePdf(createdQuote.id);

        if (client.email && client.email.trim() !== "") {
          setBulkProgress({
            current: index,
            total: targets.length,
            created,
            message: t("dashboard.quotes.recipients.bulkEmail", {
              step: String(step),
              total: String(targets.length),
              name: client.nom,
            }),
          });

          await sendQuoteEmail(createdQuote.id);
          emailed += 1;
        } else {
          skippedNoEmail += 1;
        }
      } catch (error) {
        failed += 1;
        console.error("[Cotisation][Bulk] Erreur traitement membre:", {
          memberId: client.id,
          memberName: client.nom,
          error,
        });
      } finally {
        setBulkProgress({
          current: step,
          total: targets.length,
          created,
          message: t("dashboard.quotes.recipients.bulkProgress", {
            created: String(created),
            total: String(targets.length),
          }),
        });
      }
    }

    const summary = {
      created,
      emailed,
      skippedNoEmail,
      failed,
      total: targets.length,
    };

    setBulkSummary(summary);
    setIsBulkProcessing(false);
    setBulkProgress(null);

    toast.success(
      t("dashboard.quotes.recipients.bulkDoneToast", {
        created: String(created),
        emailed: String(emailed),
        skipped: String(skippedNoEmail),
      })
    );
  };

  const validateRecipients = (): boolean => {
    if (recipientType === "individual") {
      if (!memberId) {
        toast.error(t("dashboard.quotes.selectClientError"));
        return false;
      }
      return true;
    }

    if (recipientType === "team") {
      if (teamsWithCounts.length === 0) {
        toast.error(t("dashboard.quotes.recipients.noTeams"));
        return false;
      }
      if (!teamCategory) {
        toast.error(t("dashboard.quotes.recipients.selectTeamError"));
        return false;
      }
      if (targetMembers.length === 0) {
        toast.error(t("dashboard.quotes.recipients.emptyTeam"));
        return false;
      }
      return true;
    }

    if (getPlayers(clients).length === 0) {
      toast.error(t("dashboard.quotes.recipients.noPlayers"));
      return false;
    }

    return true;
  };

  const confirmDuplicatesIfNeeded = (targets: CotisationClient[], totalTtc: number) => {
    const duplicates = findDuplicateTargets(
      targets,
      existingQuotes,
      dateEcheance,
      totalTtc
    );

    if (duplicates.length === 0) return true;

    const names = duplicates
      .slice(0, 5)
      .map((m) => m.nom)
      .join(", ");
    const suffix =
      duplicates.length > 5
        ? ` (+${duplicates.length - 5})`
        : "";

    return window.confirm(
      t("dashboard.quotes.recipients.duplicateConfirm", {
        count: String(duplicates.length),
        names: `${names}${suffix}`,
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBulkProcessing) {
      return;
    }

    if (!validateRecipients()) {
      return;
    }

    const lignesValides = getLignesValides();

    if (lignesValides.length === 0) {
      toast.error(t("dashboard.quotes.lineRequiredError"));
      return;
    }

    const totalTtc = calculerTotalTTC(lignesValides);

    if (recipientType !== "individual") {
      if (!confirmDuplicatesIfNeeded(targetMembers, totalTtc)) {
        return;
      }
      await handleBulkSubmit(targetMembers, lignesValides);
      return;
    }

    try {
      const data = await createQuoteForClient(memberId, lignesValides);
      setDocumentId(data.id);
      router.push(`/tableau-de-bord/devis/${data.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("dashboard.common.unknownError");
      console.error("[Devis] Erreur lors de la création:", error);
      toast.error(`${t("dashboard.quotes.createError")}: ${message}`);
    }
  };

  const saveAndOpenPdf = async (download: boolean = false) => {
    if (recipientType !== "individual") {
      toast.error(t("dashboard.quotes.recipients.pdfIndividualOnly"));
      return;
    }

    if (!memberId) {
      toast.error(t("dashboard.quotes.selectClientError"));
      return;
    }

    const lignesValides = getLignesValides();

    if (lignesValides.length === 0) {
      toast.error(t("dashboard.quotes.lineRequiredError"));
      return;
    }

    setSavingForPdf(true);

    try {
      let id = documentId;
      let numero: string | undefined;

      if (!id) {
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "quote",
            clientId: memberId,
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
      } else {
        const response = await fetch("/api/documents", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            type: "quote",
            clientId: memberId,
            lignes: lignesValides,
            statut,
            ...(dateEcheance && dateEcheance.trim() !== ""
              ? { dateEcheance }
              : { dateEcheance: null }),
            ...(notes && notes.trim() !== "" ? { notes } : { notes: null }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t("dashboard.quotes.updateDocumentError"));
        }

        const data = await response.json();
        numero = data.numero;
      }

      const url = `/api/documents/${id}/pdf?type=quote${download ? "&download=true" : ""}`;

      if (download) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `obillz-quote-${numero || id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url, "_blank");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("dashboard.common.unknownError");
      console.error("Erreur lors de la sauvegarde pour PDF:", error);
      toast.error(`${t("dashboard.quotes.saveForPdfError")}: ${message}`);
    } finally {
      setSavingForPdf(false);
    }
  };

  const handleRecipientTypeChange = (next: RecipientType) => {
    setRecipientType(next);
    setMemberId("");
    setTeamCategory("");
    setDocumentId(null);
    setBulkSummary(null);
  };

  const totalHT = calculerTotalHT(lignes);
  const totalTVA = calculerTVA(lignes);
  const totalTTC = calculerTotalTTC(lignes);

  const recipientTypeLabel =
    recipientType === "individual"
      ? t("dashboard.quotes.recipients.individual")
      : recipientType === "team"
        ? t("dashboard.quotes.recipients.team")
        : t("dashboard.quotes.recipients.all");

  const statutLabel = {
    brouillon: t("dashboard.status.quote.draft"),
    envoye: t("dashboard.status.quote.sent"),
    accepte: t("dashboard.status.quote.accepted"),
    refuse: t("dashboard.status.quote.refused"),
  }[statut];

  const showSubmitPreview =
    targetMembers.length > 0 &&
    getLignesValides().length > 0 &&
    (recipientType !== "individual" || memberId);

  return (
    <PageLayout maxWidth="4xl">
      <PageHeader
        title={t("dashboard.quotes.newTitle")}
        subtitle={t("dashboard.quotes.newSubtitle")}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard padding="lg" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.quotes.recipients.label")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  ["individual", t("dashboard.quotes.recipients.individual")],
                  ["team", t("dashboard.quotes.recipients.team")],
                  ["all", t("dashboard.quotes.recipients.all")],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  disabled={loadingClients || isBulkProcessing}
                  onClick={() => handleRecipientTypeChange(value)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    recipientType === value
                      ? "border-[#7C5CFF] bg-[#7C5CFF]/15 text-primary"
                      : "border-subtle-hover bg-surface text-secondary hover:border-[#7C5CFF]/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {recipientType === "individual" && (
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.quotes.recipients.selectMember")}
              </label>
              <select
                required
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                disabled={loadingClients || isBulkProcessing}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingClients
                    ? t("dashboard.quotes.loadingClients")
                    : t("dashboard.quotes.selectClient")}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {recipientType === "team" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.quotes.recipients.selectTeam")}
              </label>
              {teamsWithCounts.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg px-4 py-3">
                  {t("dashboard.quotes.recipients.noTeams")}
                </p>
              ) : (
                <>
                  <select
                    required
                    value={teamCategory}
                    onChange={(e) => setTeamCategory(e.target.value)}
                    disabled={loadingClients || isBulkProcessing}
                    className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50"
                  >
                    <option value="">
                      {t("dashboard.quotes.recipients.selectTeamPlaceholder")}
                    </option>
                    {teamsWithCounts.map((team) => (
                      <option key={team.value} value={team.value}>
                        {getCategoryLabel(team.value, translateCategory)} ({team.count})
                      </option>
                    ))}
                  </select>
                  {teamCategory && (
                    <p className="text-sm text-secondary">
                      {t("dashboard.quotes.recipients.teamPreview", {
                        count: String(targetMembers.length),
                        team: selectedTeamLabel,
                      })}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {recipientType === "all" && (
            <p className="text-sm text-secondary">
              {t("dashboard.quotes.recipients.allPreview", {
                count: String(getPlayers(clients).length),
              })}
            </p>
          )}

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
              disabled={isBulkProcessing}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50"
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
              disabled={isBulkProcessing}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50"
            />
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {t("dashboard.quotes.lines.title")}
            </h2>
            <ActionButton type="button" onClick={ajouterLigne} className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t("dashboard.quotes.lines.add")}
            </ActionButton>
          </div>

          <div className="space-y-4">
            {lignes.map((ligne) => (
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
                      {currencyFormatter.format(ligne.quantite * ligne.prixUnitaire)}
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
        </GlassCard>

        <GlassCard padding="lg">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            {t("dashboard.quotes.fields.notes")}
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={t("dashboard.quotes.fields.notesPlaceholder")}
            className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          />
        </GlassCard>

        <GlassCard padding="lg">
          <div className="space-y-2 text-right">
            <div className="flex justify-between text-slate-600">
              <span>{t("dashboard.quotes.summary.totalHT")}</span>
              <span>{currencyFormatter.format(totalHT)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t("dashboard.quotes.summary.vat")}</span>
              <span>{currencyFormatter.format(totalTVA)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold pt-2 border-t border-slate-200/70 text-slate-900">
              <span>{t("dashboard.quotes.summary.totalTTC")}</span>
              <span>{currencyFormatter.format(totalTTC)}</span>
            </div>
          </div>
        </GlassCard>

        {showSubmitPreview && recipientType !== "individual" && (
          <GlassCard padding="md" className="border-[#7C5CFF]/25 bg-[#7C5CFF]/5 space-y-2">
            <h3 className="text-sm font-semibold text-primary">
              {t("dashboard.quotes.recipients.previewTitle")}
            </h3>
            <p className="text-sm text-secondary">
              {t("dashboard.quotes.recipients.previewConfirm", {
                amount: currencyFormatter.format(totalTTC),
                count: String(targetMembers.length),
                team:
                  recipientType === "team"
                    ? selectedTeamLabel
                    : t("dashboard.quotes.recipients.allMembersLabel"),
                total: currencyFormatter.format(totalTTC * targetMembers.length),
                due: dateEcheance || t("dashboard.quotes.recipients.noDueDate"),
                status: statutLabel,
                type: recipientTypeLabel,
              })}
            </p>
          </GlassCard>
        )}

        {bulkProgress && (
          <GlassCard padding="md" className="space-y-3">
            <p className="text-sm font-medium text-slate-900">{bulkProgress.message}</p>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] transition-all"
                style={{
                  width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-600">
              {bulkProgress.created}/{bulkProgress.total}{" "}
              {t("dashboard.quotes.recipients.bulkCreatedLabel")}
            </p>
          </GlassCard>
        )}

        {bulkSummary && (
          <GlassCard padding="md" className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">
              {t("dashboard.quotes.recipients.bulkSummaryTitle")}
            </h3>
            <p className="text-slate-600">
              {t("dashboard.quotes.recipients.bulkSummaryCreated", {
                count: String(bulkSummary.created),
              })}
            </p>
            <p className="text-slate-600">
              {t("dashboard.quotes.recipients.bulkSummaryEmailed", {
                count: String(bulkSummary.emailed),
              })}
            </p>
            <p className="text-slate-600">
              {t("dashboard.quotes.recipients.bulkSummaryNoEmail", {
                count: String(bulkSummary.skippedNoEmail),
              })}
            </p>
            {bulkSummary.failed > 0 && (
              <p className="text-red-600 font-medium">
                {t("dashboard.quotes.recipients.bulkSummaryFailed", {
                  count: String(bulkSummary.failed),
                })}
              </p>
            )}
          </GlassCard>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            type="button"
            onClick={() => router.back()}
            className="flex-1 justify-center min-w-[150px]"
          >
            {t("dashboard.common.cancel")}
          </ActionButton>
          <ActionButton
            type="button"
            onClick={() => saveAndOpenPdf(false)}
            disabled={savingForPdf || isBulkProcessing || recipientType !== "individual"}
            className="inline-flex items-center gap-2 disabled:opacity-50"
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
          </ActionButton>
          <ActionButton
            type="button"
            onClick={() => saveAndOpenPdf(true)}
            disabled={savingForPdf || isBulkProcessing || recipientType !== "individual"}
            className="inline-flex items-center gap-2 disabled:opacity-50"
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
          </ActionButton>
          <DashboardPrimaryButton
            type="submit"
            disabled={isBulkProcessing}
            icon="none"
            className="flex-1 justify-center min-w-[180px] rounded-xl"
          >
            {isBulkProcessing ? (
              <span className="inline-flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                {t("dashboard.quotes.recipients.bulkInProgress")}
              </span>
            ) : (
              t("dashboard.quotes.createAction")
            )}
          </DashboardPrimaryButton>
        </div>
      </form>
    </PageLayout>
  );
}
