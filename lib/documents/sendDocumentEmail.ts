/**
 * Point d'entrée unique pour l'envoi d'un document par email.
 *
 * Toutes les actions d'envoi passent par ici : le bouton « Envoyer par mail »
 * d'une cotisation, celui d'une facture, la création groupée de cotisations et
 * la reprise des erreurs. Il n'existe volontairement aucune autre construction
 * de requête vers `/api/email` dans l'application.
 *
 * L'unification porte sur les trois éléments qui divergeaient entre les flux :
 *
 * 1. Le corps de la requête, réduit à `{ type, documentId }`. Le destinataire,
 *    le club, le sujet, le contenu HTML et la pièce jointe sont résolus côté
 *    serveur depuis le document lui-même : c'est la seule source de vérité, et
 *    cela interdit qu'un appelant envoie un document à une adresse arbitraire.
 *
 * 2. La clé d'idempotence, désormais tirée au sort à chaque tentative. Une clé
 *    dérivée du document et du destinataire semblait plus rigoureuse, mais elle
 *    rendait l'envoi définitivement irrécupérable : `withIdempotency` réserve la
 *    clé avec `response_status = 0` avant d'exécuter l'opération, et si celle-ci
 *    n'aboutit pas à une écriture finale (fonction interrompue, timeout, onglet
 *    fermé), la ligne reste bloquée à 0. Toute tentative suivante réutilisant la
 *    même clé attend puis reçoit 409 « Requête déjà en cours », indéfiniment.
 *    Le bouton manuel n'a jamais connu ce blocage parce qu'il génère un UUID à
 *    chaque clic ; le flux groupé, lui, restait coincé sur sa clé déterministe.
 *
 * 3. La lecture de la réponse d'erreur, qui remonte maintenant l'étape et le
 *    détail renvoyés par le serveur au lieu d'un message généraliste.
 *
 * La protection contre les doubles envois ne repose donc pas sur la clé mais sur
 * l'appelant : un envoi réussi n'est jamais rejoué (`emailSent` dans l'état de
 * la création groupée, bouton désactivé pendant l'envoi manuel).
 */

export type DocumentEmailType = "cotisation" | "facture";

export type SendDocumentEmailParams = {
  /** `documents.id` du document à envoyer. */
  documentId: string;
  type: DocumentEmailType;
  /**
   * Adresse attendue du destinataire. Sert de garde locale et de contexte de
   * trace ; le serveur reste seul décideur de l'adresse réellement utilisée.
   */
  recipientEmail?: string | null;
  /** Contexte de traçabilité, non transmis au serveur. */
  memberId?: string | null;
  clubId?: string | null;
};

export type SendDocumentEmailResult = {
  documentId: string;
  /** Identifiant de l'envoi retourné par le fournisseur d'email. */
  emailId: string | null;
  idempotencyKey: string;
};

/** Échec d'envoi enrichi de l'étape serveur, pour un diagnostic exploitable. */
export class DocumentEmailError extends Error {
  readonly documentId: string;
  readonly status: number | null;
  readonly step: string | null;
  readonly details: string | null;

  constructor(params: {
    message: string;
    documentId: string;
    status?: number | null;
    step?: string | null;
    details?: string | null;
  }) {
    super(params.message);
    this.name = "DocumentEmailError";
    this.documentId = params.documentId;
    this.status = params.status ?? null;
    this.step = params.step ?? null;
    this.details = params.details ?? null;
  }
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idemp_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

/**
 * Envoie un document par email via `POST /api/email`.
 *
 * Lève une `DocumentEmailError` si l'envoi échoue, afin que l'appelant puisse
 * afficher la cause exacte et décider de rejouer cette seule étape.
 */
export async function sendDocumentEmail(
  params: SendDocumentEmailParams
): Promise<SendDocumentEmailResult> {
  const { documentId, type, recipientEmail, memberId, clubId } = params;

  if (!documentId || documentId.trim() === "") {
    throw new DocumentEmailError({
      message: "Identifiant du document manquant",
      documentId: documentId ?? "",
      step: "documentId",
    });
  }

  if (recipientEmail !== undefined && (recipientEmail ?? "").trim() === "") {
    throw new DocumentEmailError({
      message: "Adresse email du destinataire manquante",
      documentId,
      step: "recipient",
    });
  }

  const idempotencyKey = newIdempotencyKey();

  let response: Response;
  try {
    response = await fetch("/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ type, documentId }),
    });
  } catch (error: unknown) {
    throw new DocumentEmailError({
      message:
        error instanceof Error && error.message.trim() !== ""
          ? error.message
          : "Le service d'envoi est injoignable",
      documentId,
      step: "network",
    });
  }

  const raw = await response.text();
  let payload: {
    error?: string;
    details?: string;
    step?: string;
    emailId?: string;
  } = {};
  try {
    payload = raw.trim() === "" ? {} : JSON.parse(raw);
  } catch {
    // Réponse non JSON : `raw` reste la meilleure information disponible.
  }

  if (!response.ok) {
    const message =
      payload.error && payload.error.trim() !== ""
        ? payload.error
        : raw.trim() !== ""
          ? raw
          : `HTTP ${response.status}`;

    console.error("[Document][Email] Envoi refusé", {
      documentId,
      type,
      memberId: memberId ?? null,
      clubId: clubId ?? null,
      recipientEmail: recipientEmail ?? null,
      idempotencyKey,
      status: response.status,
      step: payload.step ?? null,
      error: payload.error ?? null,
      details: payload.details ?? null,
    });

    throw new DocumentEmailError({
      message: payload.details ? `${message} (${payload.details})` : message,
      documentId,
      status: response.status,
      step: payload.step ?? null,
      details: payload.details ?? null,
    });
  }

  return {
    documentId,
    emailId: payload.emailId ?? null,
    idempotencyKey,
  };
}

/**
 * Envoi d'une cotisation. Utilisé par le bouton « Envoyer par mail », la
 * création groupée et la reprise des erreurs.
 */
export function sendCotisationEmail(params: {
  cotisationId: string;
  recipientEmail?: string | null;
  memberId?: string | null;
  clubId?: string | null;
}): Promise<SendDocumentEmailResult> {
  return sendDocumentEmail({
    documentId: params.cotisationId,
    type: "cotisation",
    recipientEmail: params.recipientEmail,
    memberId: params.memberId,
    clubId: params.clubId,
  });
}

/** Envoi d'une facture. */
export function sendInvoiceEmail(params: {
  invoiceId: string;
  recipientEmail?: string | null;
  clubId?: string | null;
}): Promise<SendDocumentEmailResult> {
  return sendDocumentEmail({
    documentId: params.invoiceId,
    type: "facture",
    recipientEmail: params.recipientEmail,
    clubId: params.clubId,
  });
}
