/**
 * Orchestration de la création groupée de cotisations.
 *
 * Le traitement d'un membre est une suite de trois étapes (création,
 * génération du PDF, envoi de l'email) dont chacune peut échouer
 * indépendamment. L'état retourné conserve l'identifiant de la cotisation et
 * l'étape fautive, ce qui permet de relancer uniquement les membres en erreur
 * en repartant de l'étape exacte où le traitement s'est arrêté : une cotisation
 * déjà créée n'est jamais recréée, un PDF déjà produit n'est pas régénéré.
 *
 * La clé d'idempotence de la *création* est dérivée du contenu du formulaire
 * (`runId`) et de l'identifiant du membre. Elle est donc stable d'une tentative
 * à l'autre : un second clic ou un « réessayer » ne peut pas produire de
 * cotisation en double, même si l'état local a été perdu.
 *
 * L'*envoi*, lui, ne fabrique aucune clé ici : il délègue à
 * `sendCotisationEmail`, la fonction utilisée par le bouton « Envoyer par
 * mail ». Les deux flux exécutent ainsi rigoureusement le même code d'envoi.
 */

export type BulkStep = "create" | "pdf" | "email";

export type BulkMemberStatus =
  | "pending"
  | "processing"
  | "done"
  | "skippedNoEmail"
  | "error";

export type BulkMemberInput = {
  id: string;
  nom: string;
  email: string;
};

export type BulkMemberState = {
  memberId: string;
  memberName: string;
  email: string;
  /** Conservé même en cas d'échec, pour pouvoir reprendre le traitement. */
  documentId: string | null;
  documentNumber: string | null;
  status: BulkMemberStatus;
  /** Étape en cours (statut `processing`) ou dernière étape atteinte. */
  step: BulkStep | null;
  /** Étape ayant échoué, seule étape rejouée lors d'un « réessayer ». */
  failedStep: BulkStep | null;
  errorMessage: string | null;
  /** Vrai quand la cotisation existait déjà côté serveur. */
  alreadyExisted: boolean;
  pdfReady: boolean;
  emailSent: boolean;
};

export type BulkSummary = {
  total: number;
  /** Cotisations réellement insérées pendant ce traitement. */
  created: number;
  /** Cotisations retrouvées côté serveur au lieu d'être recréées. */
  alreadyExisting: number;
  emailed: number;
  skippedNoEmail: number;
  failed: number;
};

export type BulkProgress = {
  /** Nombre de membres entièrement traités. */
  processed: number;
  total: number;
  currentMemberName: string | null;
  currentStep: BulkStep | null;
};

export type BulkLogEntry = {
  memberId: string;
  memberName: string;
  documentId: string | null;
  step: BulkStep;
  outcome: "start" | "success" | "error";
  message?: string;
  stack?: string;
  /** Réponse brute du service (email, PDF) telle que reçue. */
  response?: unknown;
};

export type CreateCotisationResult = {
  id: string;
  numero?: string | null;
  /** Le serveur a renvoyé une cotisation préexistante au lieu d'en créer une. */
  alreadyExisted: boolean;
};

export type BulkCotisationsDeps = {
  createCotisation(input: {
    memberId: string;
    idempotencyKey: string;
  }): Promise<CreateCotisationResult>;
  generatePdf(input: {
    documentId: string;
    memberId: string;
  }): Promise<void>;
  /**
   * Doit appeler la fonction centrale d'envoi (`sendCotisationEmail`). Aucune
   * clé d'idempotence n'est fournie : elle est produite par cette fonction,
   * exactement comme lors d'un envoi manuel.
   */
  sendEmail(input: {
    documentId: string;
    memberId: string;
    email: string;
  }): Promise<void>;
};

export type RunBulkCotisationsParams = {
  members: BulkMemberInput[];
  /** Empreinte du formulaire : rend les clés d'idempotence reproductibles. */
  runId: string;
  deps: BulkCotisationsDeps;
  /** État d'une tentative précédente, pour ne rejouer que les erreurs. */
  previous?: BulkMemberState[];
  onProgress?: (progress: BulkProgress, states: BulkMemberState[]) => void;
  onLog?: (entry: BulkLogEntry) => void;
};

export type RunBulkCotisationsResult = {
  states: BulkMemberState[];
  summary: BulkSummary;
};

export function createCotisationIdempotencyKey(
  runId: string,
  memberId: string
): string {
  return `cotisation:${runId}:${memberId}`;
}

/**
 * Empreinte stable du formulaire.
 *
 * Deux soumissions du même formulaire produisent la même empreinte, donc les
 * mêmes clés d'idempotence et aucun doublon. Modifier le montant, l'échéance ou
 * la liste des destinataires produit une empreinte différente, ce qui autorise
 * une nouvelle série de cotisations.
 */
export function computeBulkRunId(parts: {
  memberIds: string[];
  payload: unknown;
}): string {
  const canonical = JSON.stringify({
    memberIds: [...parts.memberIds].sort(),
    payload: parts.payload,
  });

  // FNV-1a 32 bits, suffisant pour distinguer deux saisies de formulaire.
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i += 1) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).padStart(7, "0");
}

function initialState(member: BulkMemberInput): BulkMemberState {
  return {
    memberId: member.id,
    memberName: member.nom,
    email: (member.email || "").trim(),
    documentId: null,
    documentNumber: null,
    status: "pending",
    step: null,
    failedStep: null,
    errorMessage: null,
    alreadyExisted: false,
    pdfReady: false,
    emailSent: false,
  };
}

function errorMessageOf(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  if (typeof error === "string" && error.trim() !== "") return error;
  return "Erreur inconnue";
}

export function summarize(states: BulkMemberState[]): BulkSummary {
  return {
    total: states.length,
    created: states.filter((s) => s.documentId !== null && !s.alreadyExisted).length,
    alreadyExisting: states.filter((s) => s.alreadyExisted).length,
    emailed: states.filter((s) => s.emailSent).length,
    skippedNoEmail: states.filter((s) => s.status === "skippedNoEmail").length,
    failed: states.filter((s) => s.status === "error").length,
  };
}

/**
 * Traite chaque membre séquentiellement et retourne l'état détaillé.
 *
 * Aucune exception n'est propagée : un membre en échec est marqué `error` avec
 * l'étape et le message exacts, et le traitement continue avec le suivant.
 */
export async function runBulkCotisations(
  params: RunBulkCotisationsParams
): Promise<RunBulkCotisationsResult> {
  const { members, runId, deps, previous, onProgress, onLog } = params;

  const previousById = new Map(
    (previous ?? []).map((state) => [state.memberId, state])
  );

  const states: BulkMemberState[] = members.map((member) => {
    const known = previousById.get(member.id);
    return known ? { ...known } : initialState(member);
  });

  const isRetry = previousById.size > 0;

  const emit = (progress: BulkProgress) => {
    onProgress?.(progress, states.map((state) => ({ ...state })));
  };

  const log = (entry: BulkLogEntry) => onLog?.(entry);

  emit({
    processed: 0,
    total: states.length,
    currentMemberName: null,
    currentStep: null,
  });

  for (let index = 0; index < states.length; index += 1) {
    const state = states[index];
    const member = members[index];

    // Lors d'un « réessayer », seuls les membres en erreur sont rejoués.
    if (isRetry && state.status !== "error") {
      emit({
        processed: index + 1,
        total: states.length,
        currentMemberName: null,
        currentStep: null,
      });
      continue;
    }

    state.status = "processing";
    state.failedStep = null;
    state.errorMessage = null;

    const advance = (step: BulkStep) => {
      state.step = step;
      emit({
        processed: index,
        total: states.length,
        currentMemberName: state.memberName,
        currentStep: step,
      });
    };

    try {
      if (!state.documentId) {
        advance("create");
        log({
          memberId: state.memberId,
          memberName: state.memberName,
          documentId: null,
          step: "create",
          outcome: "start",
        });

        const created = await deps.createCotisation({
          memberId: member.id,
          idempotencyKey: createCotisationIdempotencyKey(runId, member.id),
        });

        state.documentId = created.id;
        state.documentNumber = created.numero ?? null;
        state.alreadyExisted = created.alreadyExisted;

        log({
          memberId: state.memberId,
          memberName: state.memberName,
          documentId: state.documentId,
          step: "create",
          outcome: "success",
          response: created,
        });
      }

      if (!state.pdfReady) {
        advance("pdf");
        log({
          memberId: state.memberId,
          memberName: state.memberName,
          documentId: state.documentId,
          step: "pdf",
          outcome: "start",
        });

        await deps.generatePdf({
          documentId: state.documentId,
          memberId: member.id,
        });
        state.pdfReady = true;

        log({
          memberId: state.memberId,
          memberName: state.memberName,
          documentId: state.documentId,
          step: "pdf",
          outcome: "success",
        });
      }

      if (state.email === "") {
        state.status = "skippedNoEmail";
        state.step = "pdf";
      } else if (!state.emailSent) {
        advance("email");
        log({
          memberId: state.memberId,
          memberName: state.memberName,
          documentId: state.documentId,
          step: "email",
          outcome: "start",
        });

        await deps.sendEmail({
          documentId: state.documentId,
          memberId: member.id,
          email: state.email,
        });
        state.emailSent = true;
        state.status = "done";
        state.step = "email";

        log({
          memberId: state.memberId,
          memberName: state.memberName,
          documentId: state.documentId,
          step: "email",
          outcome: "success",
        });
      } else {
        state.status = "done";
      }
    } catch (error) {
      const failedStep: BulkStep = state.step ?? "create";
      state.status = "error";
      state.failedStep = failedStep;
      state.errorMessage = errorMessageOf(error);

      log({
        memberId: state.memberId,
        memberName: state.memberName,
        documentId: state.documentId,
        step: failedStep,
        outcome: "error",
        message: state.errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        response: error,
      });
    }

    emit({
      processed: index + 1,
      total: states.length,
      currentMemberName: null,
      currentStep: null,
    });
  }

  return { states, summary: summarize(states) };
}
