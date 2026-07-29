/**
 * Orchestration commune création / envoi de documents.
 *
 * Les écrans de création (cotisation, facture, buvette) passent par ici pour
 * séparer explicitement « créer uniquement » et « créer et envoyer », sans
 * dupliquer la logique métier ni appeler `/api/email` directement.
 */

import {
  sendCotisationEmail,
  sendInvoiceEmail,
  type SendDocumentEmailResult,
} from "@/lib/documents/sendDocumentEmail";

export type SubmissionMode = "create-only" | "create-and-send";

export type DocumentFlowType = "cotisation" | "facture";

export type CreateDocumentResult = {
  documentId: string;
  /** Données supplémentaires renvoyées par la création (numéro, etc.). */
  meta?: Record<string, unknown>;
};

export type CreateDocumentParams<T extends CreateDocumentResult = CreateDocumentResult> = {
  type: DocumentFlowType;
  createFn: () => Promise<T>;
};

export type CreateAndSendParams<T extends CreateDocumentResult = CreateDocumentResult> = {
  type: DocumentFlowType;
  createFn: () => Promise<T>;
  /** Adresse attendue du destinataire (garde locale). */
  recipientEmail?: string | null;
  memberId?: string | null;
  clubId?: string | null;
  /**
   * Si le document a déjà été créé (échec d'envoi précédent), on saute la
   * création et on rejoue uniquement l'envoi.
   */
  existingDocumentId?: string | null;
  onPhase?: (phase: DocumentFlowPhase) => void;
};

export type DocumentFlowPhase = "creating" | "sending";

export type CreateOnlyOutcome<T extends CreateDocumentResult = CreateDocumentResult> = {
  mode: "create-only";
  document: T;
  emailSent: false;
};

export type CreateAndSendSuccess<T extends CreateDocumentResult = CreateDocumentResult> = {
  mode: "create-and-send";
  document: T;
  emailSent: true;
  email: SendDocumentEmailResult;
};

export type CreateAndSendEmailFailure<T extends CreateDocumentResult = CreateDocumentResult> = {
  mode: "create-and-send";
  document: T;
  emailSent: false;
  emailError: unknown;
};

export type CreateAndSendOutcome<T extends CreateDocumentResult = CreateDocumentResult> =
  | CreateAndSendSuccess<T>
  | CreateAndSendEmailFailure<T>;

/** Exécute uniquement la création — aucun e-mail. */
export async function createDocument<T extends CreateDocumentResult>(
  params: CreateDocumentParams<T>
): Promise<T> {
  return params.createFn();
}

/** Crée le document sans envoi. */
export async function createOnly<T extends CreateDocumentResult>(
  params: CreateDocumentParams<T>
): Promise<CreateOnlyOutcome<T>> {
  const document = await createDocument(params);
  return { mode: "create-only", document, emailSent: false };
}

async function sendForType(params: {
  type: DocumentFlowType;
  documentId: string;
  recipientEmail?: string | null;
  memberId?: string | null;
  clubId?: string | null;
}): Promise<SendDocumentEmailResult> {
  if (params.type === "cotisation") {
    return sendCotisationEmail({
      cotisationId: params.documentId,
      recipientEmail: params.recipientEmail,
      memberId: params.memberId,
      clubId: params.clubId,
    });
  }

  return sendInvoiceEmail({
    invoiceId: params.documentId,
    recipientEmail: params.recipientEmail,
    clubId: params.clubId,
  });
}

/**
 * Passe le document à « envoyé » après un envoi réussi.
 * L'échec de ce PATCH n'annule pas l'envoi déjà effectué.
 */
export async function markDocumentAsSent(params: {
  type: DocumentFlowType;
  documentId: string;
}): Promise<void> {
  const docType = params.type === "cotisation" ? "quote" : "invoice";
  try {
    const response = await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: params.documentId,
        type: docType,
        statut: "envoye",
      }),
    });
    if (!response.ok) {
      console.warn("[Document][Email] Statut « envoyé » non mis à jour", {
        documentId: params.documentId,
        type: params.type,
        status: response.status,
      });
    }
  } catch (error) {
    console.warn("[Document][Email] Statut « envoyé » non mis à jour", {
      documentId: params.documentId,
      type: params.type,
      error,
    });
  }
}

/**
 * Crée le document puis envoie l'e-mail via la fonction centrale.
 *
 * En cas d'échec d'envoi, le document reste créé : l'appelant peut proposer
 * « Réessayer l'envoi » en repassant `existingDocumentId`.
 */
export async function createAndSend<T extends CreateDocumentResult>(
  params: CreateAndSendParams<T>
): Promise<CreateAndSendOutcome<T>> {
  const {
    type,
    createFn,
    recipientEmail,
    memberId,
    clubId,
    existingDocumentId,
    onPhase,
  } = params;

  let document: T;

  if (existingDocumentId && existingDocumentId.trim() !== "") {
    document = { documentId: existingDocumentId } as T;
  } else {
    onPhase?.("creating");
    document = await createDocument({ type, createFn });
  }

  onPhase?.("sending");

  try {
    const email = await sendForType({
      type,
      documentId: document.documentId,
      recipientEmail,
      memberId,
      clubId,
    });
    await markDocumentAsSent({ type, documentId: document.documentId });
    return { mode: "create-and-send", document, emailSent: true, email };
  } catch (emailError) {
    return {
      mode: "create-and-send",
      document,
      emailSent: false,
      emailError,
    };
  }
}

/**
 * Relance uniquement l'envoi pour un document déjà créé.
 * Ne recrée jamais le document.
 */
export async function retryDocumentEmail(params: {
  type: DocumentFlowType;
  documentId: string;
  recipientEmail?: string | null;
  memberId?: string | null;
  clubId?: string | null;
}): Promise<SendDocumentEmailResult> {
  const result = await sendForType(params);
  await markDocumentAsSent({
    type: params.type,
    documentId: params.documentId,
  });
  return result;
}
