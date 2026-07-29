"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  LigneDocument,
  calculerTotalHT,
  calculerTVA,
  calculerTotalTTC,
} from "@/lib/utils/calculations";
import { Plus, Eye, Download, Trash, Loader, Mail } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  GlassCard,
  ActionButton,
} from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import { useSafeSubmit } from "@/hooks/useSafeSubmit";
import { idempotentFetch } from "@/lib/api/idempotentFetch";
import { sendCotisationEmail } from "@/lib/documents/sendDocumentEmail";
import {
  createAndSend,
  createOnly,
  markDocumentAsSent,
  retryDocumentEmail,
  type DocumentFlowPhase,
  type SubmissionMode,
} from "@/lib/documents/createDocumentFlow";
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
import {
  computeBulkRunId,
  runBulkCotisations,
  type BulkLogEntry,
  type BulkMemberInput,
  type BulkMemberState,
  type BulkProgress,
  type BulkStep,
  type BulkSubmissionMode,
  type BulkSummary,
} from "@/lib/quotes/bulkCotisations";

const COTISATIONS_LIST_PATH = "/tableau-de-bord/devis";

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
  const {
    isSubmitting,
    showOverlay,
    run: runQuoteSubmit,
  } = useSafeSubmit({ overlayDelayMs: 450 });
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  // Verrou synchrone : `setState` est asynchrone, un double clic rapide
  // passerait avant le re-render qui désactive le bouton.
  const bulkLockRef = useRef(false);
  const [bulkProgress, setBulkProgress] = useState<BulkProgress | null>(null);
  const [bulkStates, setBulkStates] = useState<BulkMemberState[] | null>(null);
  const [bulkSummary, setBulkSummary] = useState<BulkSummary | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<BulkSummary | null>(null);
  const [lastBulkMode, setLastBulkMode] =
    useState<BulkSubmissionMode>("create-and-send");
  const [activeMode, setActiveMode] = useState<SubmissionMode | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<DocumentFlowPhase | null>(
    null
  );
  /** Document créé mais e-mail en échec — retry sans recreate. */
  const [emailFailedDocId, setEmailFailedDocId] = useState<string | null>(null);
  const [retryingEmail, setRetryingEmail] = useState(false);

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

  useEffect(() => {
    if (!submitSuccess) return;
    router.replace(COTISATIONS_LIST_PATH);
  }, [submitSuccess, router]);

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

  const parseLocaleNumber = (raw: string, fallback: number) => {
    const s = String(raw ?? "")
      .trim()
      // espaces + séparateurs milliers
      .replace(/\s/g, "")
      .replace(/'/g, "")
      // virgule -> point (fr/CH)
      .replace(/,/g, ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };

  const getLignesValides = () =>
    lignes.filter((l) => l.designation.trim() !== "");

  /** Extrait le message le plus parlant d'une réponse d'erreur d'API. */
  const readApiError = async (response: Response): Promise<string> => {
    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw) as {
        error?: string;
        details?: string;
        step?: string;
      };
      const parts = [parsed.error, parsed.details].filter(
        (part): part is string => typeof part === "string" && part.trim() !== ""
      );
      if (parts.length > 0) return parts.join(" — ");
    } catch {
      // Réponse non JSON : le texte brut reste la meilleure information.
    }
    return raw.trim() !== "" ? raw : `HTTP ${response.status}`;
  };

  const buildQuotePayload = (targetClientId: string, lignesValides: LigneDocument[]) => ({
    type: "quote",
    clientId: targetClientId,
    lignes: lignesValides,
    statut,
    dateCreation: new Date().toISOString().split("T")[0],
    ...(dateEcheance && dateEcheance.trim() !== "" ? { dateEcheance } : {}),
    ...(notes && notes.trim() !== "" ? { notes } : {}),
  });

  const createQuoteForClient = async (
    targetClientId: string,
    lignesValides: LigneDocument[],
    idempotencyKey?: string
  ): Promise<{ id: string; numero?: string; alreadyExisted: boolean }> => {
    const payload = buildQuotePayload(targetClientId, lignesValides);

    const response = idempotencyKey
      ? await idempotentFetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          idempotencyKey,
          body: JSON.stringify(payload),
        })
      : await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

    if (!response.ok) {
      const message = await readApiError(response);
      console.error("ERREUR DOCUMENT COTISATION", {
        step: "frontend.createQuoteForClient.response-not-ok",
        error: message,
        message,
        status: response.status,
        memberId: targetClientId,
        documentPayload: payload,
      });
      throw new Error(`Erreur document: ${message}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      numero: data.numero,
      alreadyExisted: data.alreadyExisted === true,
    };
  };

  const fetchQuotePdfBlob = async (id: string, download: boolean): Promise<Blob> => {
    const url = `/api/documents/${id}/pdf?type=quote${download ? "&download=true" : ""}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      const message = await readApiError(response);
      console.error("ERREUR DOCUMENT COTISATION", {
        step: "frontend.pdf.fetchQuotePdfBlob.response-not-ok",
        error: message,
        message,
        status: response.status,
        documentPayload: { id },
        pdfPayload: { url, download },
      });
      throw new Error(message);
    }
    return await response.blob();
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const objectUrl = URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const openBlobInNewTab = (blob: Blob) => {
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    // On laisse un peu de temps au nouvel onglet de charger.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
  };

  const deleteDocumentSafe = async (id: string) => {
    try {
      const res = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const raw = await res.text();
        console.warn("[Cotisation] Rollback delete document a échoué", {
          id,
          status: res.status,
          raw,
        });
      }
    } catch (error) {
      console.warn("[Cotisation] Rollback delete document exception", { id, error });
    }
  };

  /**
   * Trace structurée de chaque étape, pour pouvoir rattacher une erreur à un
   * membre, une cotisation et une étape précise dans la console navigateur.
   */
  const logBulkEntry = (entry: BulkLogEntry) => {
    const payload = {
      memberId: entry.memberId,
      memberName: entry.memberName,
      documentId: entry.documentId,
      step: entry.step,
      outcome: entry.outcome,
      message: entry.message ?? null,
      stack: entry.stack ?? null,
      response: entry.response ?? null,
    };

    if (entry.outcome === "error") {
      console.error("[Cotisation][Bulk]", payload);
      return;
    }
    console.info("[Cotisation][Bulk]", payload);
  };

  const stepLabel = useCallback(
    (step: BulkStep | null): string => {
      if (step === "create") return t("dashboard.quotes.recipients.bulkStepCreate");
      if (step === "pdf") return t("dashboard.quotes.recipients.bulkStepPdf");
      if (step === "email") return t("dashboard.quotes.recipients.bulkStepEmail");
      return "";
    },
    [t]
  );

  const runBulk = async (
    targets: BulkMemberInput[],
    lignesValides: LigneDocument[],
    submissionMode: BulkSubmissionMode,
    previous?: BulkMemberState[]
  ) => {
    if (targets.length === 0) {
      toast.error(t("dashboard.quotes.recipients.noTargets"));
      return;
    }

    if (bulkLockRef.current) return;
    bulkLockRef.current = true;

    setIsBulkProcessing(true);
    setLastBulkMode(submissionMode);
    setBulkSummary(null);
    setBulkProgress({
      processed: 0,
      total: targets.length,
      currentMemberName: null,
      currentStep: null,
    });

    // L'empreinte du formulaire rend les clés d'idempotence reproductibles :
    // relancer la même saisie ne peut pas créer une seconde cotisation.
    const runId = computeBulkRunId({
      memberIds: targets.map((target) => target.id),
      payload: buildQuotePayload("", lignesValides),
    });

    try {
      const { states, summary } = await runBulkCotisations({
        members: targets.map((target) => ({
          id: target.id,
          nom: target.nom,
          email: target.email,
        })),
        runId,
        submissionMode,
        previous,
        deps: {
          createCotisation: ({ memberId, idempotencyKey }) =>
            createQuoteForClient(memberId, lignesValides, idempotencyKey),
          generatePdf: async ({ documentId }) => {
            await fetchQuotePdfBlob(documentId, true);
          },
          // Exactement la fonction du bouton « Envoyer par mail ».
          sendEmail: async ({ documentId, memberId, email }) => {
            await sendCotisationEmail({
              cotisationId: documentId,
              recipientEmail: email,
              memberId,
            });
            await markDocumentAsSent({
              type: "cotisation",
              documentId,
            });
          },
        },
        onProgress: (progress, states) => {
          setBulkProgress(progress);
          setBulkStates(states);
        },
        onLog: logBulkEntry,
      });

      setBulkStates(states);
      setBulkSummary(summary);

      if (summary.failed > 0) {
        toast.error(
          t("dashboard.quotes.recipients.bulkSummaryFailed", {
            count: String(summary.failed),
          })
        );
        return;
      }

      if (submissionMode === "create-only") {
        toast.success(
          t("dashboard.quotes.recipients.bulkDoneToastCreateOnly", {
            created: String(summary.created + summary.alreadyExisting),
          })
        );
      } else {
        toast.success(
          t("dashboard.quotes.recipients.bulkDoneToastCreateAndSend", {
            created: String(summary.created + summary.alreadyExisting),
            emailed: String(summary.emailed),
            failed: String(summary.failed),
          })
        );
      }
      setSubmitSuccess(summary);
    } finally {
      setIsBulkProcessing(false);
      setBulkProgress(null);
      bulkLockRef.current = false;
    }
  };

  const retryFailedOnly = async () => {
    if (!bulkStates || isBulkProcessing) return;

    const lignesValides = getLignesValides();
    if (lignesValides.length === 0) {
      toast.error(t("dashboard.quotes.lineRequiredError"));
      return;
    }

    if (!bulkStates.some((state) => state.status === "error")) return;

    // On rejoue la liste complète en fournissant l'état précédent : l'orchestrateur
    // ignore les membres déjà traités et reprend les autres à l'étape exacte où ils
    // se sont arrêtés, sans jamais recréer de cotisation. Les destinataires sont
    // reconstruits depuis l'état, pour rester valides même si la sélection a bougé.
    const targets: BulkMemberInput[] = bulkStates.map((state) => ({
      id: state.memberId,
      nom: state.memberName,
      email: state.email,
    }));

    await runBulk(targets, lignesValides, lastBulkMode, bulkStates);
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

  const handleCreate = async (submissionMode: SubmissionMode) => {
    if (bulkLockRef.current || isBulkProcessing || isSubmitting || activeMode) {
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
      await runBulk(targetMembers, lignesValides, submissionMode);
      return;
    }

    const selectedClient = clients.find((c) => c.id === memberId);
    const recipientEmail = (selectedClient?.email || "").trim();

    if (submissionMode === "create-and-send" && recipientEmail === "") {
      toast.error(t("dashboard.quotes.detail.missingClientEmail"));
      return;
    }

    const existingIdForSend =
      submissionMode === "create-and-send" ? emailFailedDocId : null;
    if (submissionMode === "create-only") {
      setEmailFailedDocId(null);
    }

    await runQuoteSubmit(async (idempotencyKey) => {
      setActiveMode(submissionMode);
      setLoadingPhase("creating");
      try {
        if (submissionMode === "create-only") {
          const outcome = await createOnly({
            type: "cotisation",
            createFn: async () => {
              const data = await createQuoteForClient(
                memberId,
                lignesValides,
                idempotencyKey
              );
              return { documentId: data.id, meta: { numero: data.numero } };
            },
          });
          setDocumentId(outcome.document.documentId);
          toast.success(t("dashboard.quotes.createdOnlySuccess"));
          router.replace(
            `/tableau-de-bord/devis/${outcome.document.documentId}`
          );
          return;
        }

        const outcome = await createAndSend({
          type: "cotisation",
          recipientEmail,
          memberId,
          existingDocumentId: existingIdForSend,
          onPhase: setLoadingPhase,
          createFn: async () => {
            const data = await createQuoteForClient(
              memberId,
              lignesValides,
              idempotencyKey
            );
            return { documentId: data.id, meta: { numero: data.numero } };
          },
        });

        setDocumentId(outcome.document.documentId);

        if (outcome.emailSent) {
          setEmailFailedDocId(null);
          toast.success(t("dashboard.quotes.createdAndSentSuccess"));
          router.replace(
            `/tableau-de-bord/devis/${outcome.document.documentId}`
          );
          return;
        }

        setEmailFailedDocId(outcome.document.documentId);
        const errMsg =
          outcome.emailError instanceof Error
            ? outcome.emailError.message
            : t("dashboard.common.unknownError");
        toast.error(
          `${t("dashboard.quotes.createdButEmailFailed")} ${errMsg}`
        );
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : t("dashboard.common.unknownError");
        console.error("[Devis] Erreur lors de la création:", error);
        toast.error(`${t("dashboard.quotes.createError")}: ${message}`);
      } finally {
        setActiveMode(null);
        setLoadingPhase(null);
      }
    });
  };

  const handleRetryEmail = async () => {
    if (!emailFailedDocId || retryingEmail || isSubmitting) return;

    const selectedClient = clients.find((c) => c.id === memberId);
    const recipientEmail = (selectedClient?.email || "").trim();

    setRetryingEmail(true);
    setLoadingPhase("sending");
    try {
      await retryDocumentEmail({
        type: "cotisation",
        documentId: emailFailedDocId,
        recipientEmail,
        memberId,
      });
      toast.success(t("dashboard.quotes.createdAndSentSuccess"));
      router.replace(`/tableau-de-bord/devis/${emailFailedDocId}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("dashboard.common.unknownError");
      toast.error(
        `${t("dashboard.quotes.createdButEmailFailed")} ${message}`
      );
    } finally {
      setRetryingEmail(false);
      setLoadingPhase(null);
    }
  };

  // Empêche le submit natif du formulaire (Entrée) : les actions passent
  // explicitement par les boutons avec submissionMode.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    let createdDocumentId: string | null = null;

    try {
      let id = documentId;
      let numero: string | undefined;

      if (!id) {
        const payload = {
          type: "quote",
          clientId: memberId,
          lignes: lignesValides,
          statut,
          dateCreation: new Date().toISOString().split("T")[0],
          ...(dateEcheance && dateEcheance.trim() !== "" ? { dateEcheance } : {}),
          ...(notes && notes.trim() !== "" ? { notes } : {}),
        };
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const message = await readApiError(response);
          console.error("ERREUR DOCUMENT COTISATION", {
            step: "frontend.saveAndOpenPdf.post.response-not-ok",
            error: message,
            message,
            status: response.status,
            memberId,
            documentPayload: payload,
          });
          throw new Error(`Erreur document: ${message}`);
        }

        const data = await response.json();
        id = data.id.toString();
        numero = data.numero;
        setDocumentId(id);
        createdDocumentId = id;
      } else {
        const payload = {
          id,
          type: "quote",
          clientId: memberId,
          lignes: lignesValides,
          statut,
          ...(dateEcheance && dateEcheance.trim() !== ""
            ? { dateEcheance }
            : { dateEcheance: null }),
          ...(notes && notes.trim() !== "" ? { notes } : { notes: null }),
        };
        const response = await fetch("/api/documents", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const message = await readApiError(response);
          console.error("ERREUR DOCUMENT COTISATION", {
            step: "frontend.saveAndOpenPdf.patch.response-not-ok",
            error: message,
            message,
            status: response.status,
            memberId,
            documentPayload: payload,
          });
          throw new Error(`Erreur document: ${message}`);
        }

        const data = await response.json();
        numero = data.numero;
      }

      if (!id) {
        throw new Error("ID document manquant après sauvegarde");
      }

      // Générer le PDF d’abord (pour capturer l’erreur technique et éviter un doc “à moitié créé”).
      const blob = await fetchQuotePdfBlob(id, download);
      if (download) {
        downloadBlob(blob, `obillz-quote-${numero || id}.pdf`);
      } else {
        openBlobInNewTab(blob);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("dashboard.common.unknownError");
      console.error("ERREUR DOCUMENT COTISATION", {
        step: "frontend.saveAndOpenPdf.catch",
        error,
        message,
        stack: error instanceof Error ? error.stack : undefined,
        data: null,
        clubId: undefined,
        memberId,
        documentPayload: null,
        pdfPayload: { download },
        storagePath: null,
      });
      // Toast propre côté utilisateur
      toast.error(t("dashboard.quotes.saveForPdfError"));

      // Si on a créé un document juste pour tenter le PDF, on rollback.
      if (createdDocumentId) {
        await deleteDocumentSafe(createdDocumentId);
        setDocumentId(null);
      }
    } finally {
      setSavingForPdf(false);
    }
  };

  const resetForm = () => {
    setSubmitSuccess(null);
    setBulkSummary(null);
    setBulkProgress(null);
    setBulkStates(null);
    setLastBulkMode("create-and-send");
    setEmailFailedDocId(null);
    setActiveMode(null);
    setLoadingPhase(null);
    setRecipientType("individual");
    setMemberId("");
    setTeamCategory("");
    setLignes([{ id: "1", designation: "", quantite: 1, prixUnitaire: 0, tva: 7.7 }]);
    setStatut("brouillon");
    setDateEcheance("");
    setNotes("");
    setDocumentId(null);
  };

  const handleRecipientTypeChange = (next: RecipientType) => {
    setRecipientType(next);
    setMemberId("");
    setTeamCategory("");
    setDocumentId(null);
    setBulkSummary(null);
    setBulkStates(null);
  };

  const failedStates = bulkStates?.filter((state) => state.status === "error") ?? [];

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

  if (submitSuccess) {
    return (
      <PageLayout maxWidth="4xl">
        <GlassCard padding="lg" className="space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <span className="text-2xl font-bold" aria-hidden>
              ✓
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">
              {t("dashboard.quotes.recipients.successTitle")}
            </h2>
            <p className="text-secondary">
              {lastBulkMode === "create-only"
                ? t("dashboard.quotes.recipients.successMessageCreateOnly", {
                    count: String(
                      submitSuccess.created + submitSuccess.alreadyExisting
                    ),
                  })
                : t("dashboard.quotes.recipients.successMessageCreateAndSend", {
                    created: String(
                      submitSuccess.created + submitSuccess.alreadyExisting
                    ),
                    emailed: String(submitSuccess.emailed),
                    failed: String(submitSuccess.failed),
                  })}
            </p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface-hover px-4 py-3 text-left text-sm text-secondary space-y-1">
            <p>
              {t("dashboard.quotes.recipients.bulkSummaryCreated", {
                count: String(submitSuccess.created),
              })}
            </p>
            <p>
              {lastBulkMode === "create-only"
                ? t("dashboard.quotes.recipients.bulkSummaryNoEmailSent")
                : t("dashboard.quotes.recipients.bulkSummaryEmailed", {
                    count: String(submitSuccess.emailed),
                  })}
            </p>
            <p>
              {t("dashboard.quotes.recipients.bulkSummaryExisting", {
                count: String(submitSuccess.alreadyExisting),
              })}
            </p>
            <p>
              {t("dashboard.quotes.recipients.bulkSummaryNoEmail", {
                count: String(submitSuccess.skippedNoEmail),
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <DashboardPrimaryButton href={COTISATIONS_LIST_PATH} icon="none">
              {t("dashboard.quotes.recipients.viewQuotes")}
            </DashboardPrimaryButton>
            <ActionButton type="button" onClick={resetForm}>
              {t("dashboard.quotes.recipients.createAnother")}
            </ActionButton>
          </div>
        </GlassCard>
      </PageLayout>
    );
  }

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
                          quantite: parseLocaleNumber(e.target.value, 1),
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
                          prixUnitaire: parseLocaleNumber(e.target.value, 0),
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
                          tva: parseLocaleNumber(e.target.value, 0),
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
            <p className="text-sm font-medium text-slate-900">
              {bulkProgress.currentMemberName
                ? t("dashboard.quotes.recipients.bulkCurrentStep", {
                    name: bulkProgress.currentMemberName,
                    step: stepLabel(bulkProgress.currentStep),
                  })
                : t("dashboard.quotes.recipients.bulkInitializing")}
            </p>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] transition-all"
                style={{
                  width: `${
                    bulkProgress.total > 0
                      ? (bulkProgress.processed / bulkProgress.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-600">
              {bulkProgress.processed} / {bulkProgress.total}
            </p>
          </GlassCard>
        )}

        {bulkSummary && (
          <GlassCard padding="md" className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">
              {t("dashboard.quotes.recipients.bulkSummaryTitle")}
            </h3>
            <div className="space-y-1">
              <p className="text-slate-600">
                {t("dashboard.quotes.recipients.bulkSummaryCreated", {
                  count: String(bulkSummary.created),
                })}
              </p>
              <p className="text-slate-600">
                {lastBulkMode === "create-only"
                  ? t("dashboard.quotes.recipients.bulkSummaryNoEmailSent")
                  : t("dashboard.quotes.recipients.bulkSummaryEmailed", {
                      count: String(bulkSummary.emailed),
                    })}
              </p>
              <p className="text-slate-600">
                {t("dashboard.quotes.recipients.bulkSummaryExisting", {
                  count: String(bulkSummary.alreadyExisting),
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
            </div>

            {failedStates.length > 0 && (
              <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-semibold text-red-700">
                  {t("dashboard.quotes.recipients.bulkErrorsTitle")}
                </p>
                <ul className="space-y-1.5">
                  {failedStates.map((state) => (
                    <li key={state.memberId} className="text-sm text-red-700">
                      <span className="font-medium">{state.memberName}</span>
                      {" — "}
                      {t("dashboard.quotes.recipients.bulkErrorStep", {
                        step: stepLabel(state.failedStep),
                      })}
                      {state.errorMessage && (
                        <span className="block text-xs text-red-600 break-words">
                          {state.errorMessage}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <ActionButton
                  type="button"
                  onClick={retryFailedOnly}
                  disabled={isBulkProcessing}
                  className="inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {t("dashboard.quotes.recipients.bulkRetryFailed")}
                </ActionButton>
              </div>
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

          {emailFailedDocId ? (
            <ActionButton
              type="button"
              onClick={() => void handleRetryEmail()}
              disabled={retryingEmail || isSubmitting || isBulkProcessing}
              className="flex-1 justify-center min-w-[180px] inline-flex items-center gap-2"
            >
              {retryingEmail ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {t("dashboard.quotes.sendingEmail")}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  {t("dashboard.quotes.retrySend")}
                </>
              )}
            </ActionButton>
          ) : null}

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-1">
            <ActionButton
              type="button"
              onClick={() => void handleCreate("create-only")}
              disabled={
                isBulkProcessing ||
                isSubmitting ||
                activeMode !== null ||
                retryingEmail ||
                Boolean(emailFailedDocId)
              }
              className="flex-1 justify-center min-w-[160px] inline-flex items-center gap-2 disabled:opacity-50"
            >
              {(activeMode === "create-only" ||
                (isBulkProcessing && lastBulkMode === "create-only")) ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {t("dashboard.quotes.creating")}
                </>
              ) : recipientType === "individual" ? (
                t("dashboard.quotes.createOnly")
              ) : (
                t("dashboard.quotes.recipients.bulkCreateOnly")
              )}
            </ActionButton>
            <DashboardPrimaryButton
              type="button"
              onClick={() => void handleCreate("create-and-send")}
              disabled={
                isBulkProcessing ||
                isSubmitting ||
                activeMode !== null ||
                retryingEmail
              }
              aria-busy={
                isBulkProcessing ||
                isSubmitting ||
                activeMode === "create-and-send"
              }
              icon="none"
              className="flex-1 justify-center min-w-[180px] rounded-xl"
            >
              {isBulkProcessing && lastBulkMode === "create-and-send" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  {t("dashboard.quotes.recipients.bulkInProgressCreateAndSend")}
                </span>
              ) : isBulkProcessing && lastBulkMode === "create-only" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  {t("dashboard.quotes.recipients.bulkInProgressCreateOnly")}
                </span>
              ) : activeMode === "create-and-send" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  {loadingPhase === "sending"
                    ? t("dashboard.quotes.sendingEmail")
                    : t("dashboard.quotes.creating")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {recipientType === "individual"
                    ? t("dashboard.quotes.createAndSend")
                    : t("dashboard.quotes.recipients.bulkCreateAndSend")}
                </span>
              )}
            </DashboardPrimaryButton>
          </div>
        </div>
      </form>
    </PageLayout>
  );
}
