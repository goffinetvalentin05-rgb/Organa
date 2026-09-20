import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculerTotalHT,
  calculerTVA,
  calculerTotalTTC,
  type LigneDocument,
} from "@/lib/utils/calculations";
import { DOCUMENT_TITLE_MAX_LENGTH } from "@/lib/documents/identityLimits";
import {
  buildInvoiceRecipientDbFields,
  parseExternalRecipientData,
  validateInvoiceRecipientInput,
  type ExternalRecipientData,
  type RecipientType,
} from "@/lib/documents/recipient";
import {
  createMembershipPaymentToken,
  resolveQuotePaymentMethodForInsert,
} from "@/lib/quotes/membership-settings";
import { AuditAction, logAudit } from "@/lib/auth/audit";
import { getErrorMessage } from "@/lib/utils/error-message";
import { ToolError } from "@/lib/obillz-tools/core/errors";

export type CreateDocumentRecordInput = {
  type: "invoice" | "quote";
  clientId?: string | null;
  recipientType?: RecipientType | string;
  sponsorContractId?: string | null;
  recipientData?: unknown;
  lignes: LigneDocument[];
  statut?: string;
  dateCreation?: string | null;
  dateEcheance?: string | null;
  datePaiement?: string | null;
  notes?: string | null;
  eventId?: string | null;
  paymentMethod?: unknown;
};

export type CreateDocumentRecordResult = {
  status: number;
  body: Record<string, unknown>;
  resourceId: string | null;
};

type DocumentInsertPayload = Record<string, unknown> & {
  user_id: string;
  client_id: string | null;
  type: string;
  items: LigneDocument[];
  status: string;
  date_creation: string;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  numero: string;
};

function extractMissingColumn(message: string): string | null {
  const m1 = message.match(/Could not find the '([^']+)' column/i);
  if (m1?.[1]) return m1[1];
  const m2 = message.match(/column "([^"]+)" of relation "[^"]+" does not exist/i);
  if (m2?.[1]) return m2[1];
  const m3 = message.match(/column ([a-zA-Z0-9_]+) does not exist/i);
  if (m3?.[1]) return m3[1];
  return null;
}

type InsertRow = { id: string; numero?: string | null; type?: string | null };
type InsertError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

async function tryInsertWithFallback(
  admin: SupabaseClient,
  payload: DocumentInsertPayload
): Promise<{ data: InsertRow | null; error: InsertError | null }> {
  const working: Record<string, unknown> = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await admin
      .from("documents")
      .insert(working)
      .select("id, numero, type, created_at")
      .single();

    if (!error) {
      return { data: data as InsertRow, error: null };
    }

    const msg = String((error as InsertError | null | undefined)?.message || "");
    const missingCol = extractMissingColumn(msg);
    if (missingCol && missingCol in working) {
      removedColumns.push(missingCol);
      delete working[missingCol];
      continue;
    }

    return { data: null, error: error as InsertError };
  }

  return { data: null, error: { message: "Insert failed after retries" } };
}

/**
 * Création d’un document (facture ou cotisation).
 * Appelée par la route `/api/documents` et par les Obillz Tools.
 * Le clubId doit déjà avoir été autorisé par l’appelant.
 */
export async function createDocumentRecord(params: {
  admin: SupabaseClient;
  clubClient: SupabaseClient;
  clubId: string;
  actorUserId: string;
  input: CreateDocumentRecordInput;
  requestMeta?: {
    ipAddress?: string | null;
    userAgent?: string | null;
    requestPath?: string | null;
    requestMethod?: string | null;
  };
}): Promise<CreateDocumentRecordResult> {
  const { admin, clubClient, clubId, actorUserId, input } = params;
  const {
    type,
    clientId,
    recipientType,
    sponsorContractId,
    recipientData,
    lignes,
    statut,
    dateCreation,
    dateEcheance,
    datePaiement,
    notes,
    eventId,
    paymentMethod,
  } = input;

  if (!type || (type !== "invoice" && type !== "quote")) {
    return {
      status: 400,
      body: { error: "Paramètre 'type' requis et doit être 'invoice' ou 'quote'" },
      resourceId: null,
    };
  }

  if (type === "quote" && !clientId) {
    return { status: 400, body: { error: "clientId requis" }, resourceId: null };
  }

  if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
    return {
      status: 400,
      body: { error: "Au moins une ligne est requise" },
      resourceId: null,
    };
  }

  let resolvedRecipientType: RecipientType = "member";
  if (type === "invoice") {
    const recipientCheck = validateInvoiceRecipientInput({
      recipientType: recipientType || (clientId ? "member" : undefined),
      clientId,
      sponsorContractId,
      recipientData,
    });
    if (!recipientCheck.ok) {
      return { status: 400, body: { error: recipientCheck.error }, resourceId: null };
    }
    resolvedRecipientType = recipientCheck.type;
  }

  let resolvedClientId: string | null = null;
  let resolvedSponsorId: string | null = null;
  let resolvedRecipientData: ExternalRecipientData | null = null;

  if (type === "quote" || resolvedRecipientType === "member") {
    const memberId = clientId as string;
    const { data: client, error: clientError } = await admin
      .from("clients")
      .select("id")
      .eq("id", memberId)
      .eq("user_id", clubId)
      .is("deleted_at", null)
      .single();

    if (clientError || !client) {
      return {
        status: 404,
        body: { error: "Client introuvable ou non autorisé" },
        resourceId: null,
      };
    }
    resolvedClientId = memberId;
  } else if (resolvedRecipientType === "sponsor") {
    const sponsorId = sponsorContractId as string;
    const { data: sponsor, error: sponsorError } = await clubClient
      .from("sponsor_contracts")
      .select("id")
      .eq("id", sponsorId)
      .eq("club_id", clubId)
      .single();

    if (sponsorError || !sponsor) {
      return {
        status: 404,
        body: { error: "Contrat sponsor introuvable ou non autorisé" },
        resourceId: null,
      };
    }
    resolvedSponsorId = sponsorId;
  } else {
    resolvedRecipientData = parseExternalRecipientData(recipientData);
    if (!resolvedRecipientData) {
      return {
        status: 400,
        body: { error: "Informations du destinataire externe invalides" },
        resourceId: null,
      };
    }
  }

  const totalHT = calculerTotalHT(lignes);
  const totalTVA = calculerTVA(lignes);
  const totalTTC = calculerTotalTTC(lignes);

  const normalizedDateCreation =
    dateCreation || new Date().toISOString().split("T")[0];
  const normalizedDateEcheance =
    dateEcheance && String(dateEcheance).trim() !== ""
      ? String(dateEcheance).trim()
      : null;

  if (type === "quote" && resolvedClientId) {
    let duplicateQuery = admin
      .from("documents")
      .select("id, numero, type")
      .eq("user_id", clubId)
      .eq("type", "quote")
      .eq("client_id", resolvedClientId)
      .eq("date_creation", normalizedDateCreation)
      .eq("total_ttc", totalTTC)
      .is("deleted_at", null);

    duplicateQuery =
      normalizedDateEcheance === null
        ? duplicateQuery.is("date_echeance", null)
        : duplicateQuery.eq("date_echeance", normalizedDateEcheance);

    const { data: duplicate, error: duplicateError } = await duplicateQuery
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!duplicateError && duplicate?.id) {
      return {
        status: 200,
        body: {
          id: String(duplicate.id),
          numero: duplicate.numero,
          type: duplicate.type,
          alreadyExisted: true,
        },
        resourceId: String(duplicate.id),
      };
    }
  }

  const year = new Date().getFullYear();
  const { count: docCount } = await admin
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", clubId)
    .eq("type", type)
    .is("deleted_at", null)
    .gte("created_at", `${year}-01-01`)
    .lte("created_at", `${year}-12-31`);

  const prefix = type === "quote" ? "COT" : "FAC";
  const baseSeq = (docCount ?? 0) + 1;
  const buildNumero = (seq: number) =>
    `${prefix}-${year}-${String(seq).padStart(3, "0")}`;

  const firstDesignation = lignes
    .map((l) => String(l?.designation || "").trim())
    .find((d) => d.length > 0);
  const defaultTitle =
    firstDesignation || (type === "quote" ? "Cotisation" : "Facture");
  const title =
    defaultTitle.length > DOCUMENT_TITLE_MAX_LENGTH
      ? defaultTitle.slice(0, DOCUMENT_TITLE_MAX_LENGTH)
      : defaultTitle;

  const recipientDbFields =
    type === "invoice"
      ? buildInvoiceRecipientDbFields({
          type: resolvedRecipientType,
          clientId: resolvedClientId,
          sponsorContractId: resolvedSponsorId,
          external: resolvedRecipientData,
        })
      : { client_id: resolvedClientId };

  const documentData: DocumentInsertPayload = {
    user_id: clubId,
    type,
    items: lignes,
    status: statut || "brouillon",
    date_creation: normalizedDateCreation,
    total_ht: totalHT,
    total_tva: totalTVA,
    total_ttc: totalTTC,
    numero: buildNumero(baseSeq),
    ...recipientDbFields,
    client_id: (recipientDbFields.client_id as string | null) ?? null,
  };

  documentData.title = title;
  documentData.created_by = actorUserId;
  documentData.updated_by = actorUserId;

  if (normalizedDateEcheance !== null) {
    documentData.date_echeance = normalizedDateEcheance;
  }
  if (datePaiement && String(datePaiement).trim() !== "") {
    documentData.date_paiement = datePaiement;
  }
  if (notes && String(notes).trim() !== "") {
    documentData.notes = notes;
  }
  if (eventId) {
    documentData.event_id = eventId;
  }

  if (type === "quote") {
    const resolvedMethod = await resolveQuotePaymentMethodForInsert({
      supabase: admin,
      clubId,
      requested: paymentMethod,
    });
    if (resolvedMethod.error) {
      return {
        status: 400,
        body: { error: resolvedMethod.error },
        resourceId: null,
      };
    }
    documentData.payment_method = resolvedMethod.method;
    if (resolvedMethod.method === "stripe") {
      documentData.payment_token = createMembershipPaymentToken();
    }
  }

  let newDocument: InsertRow | null = null;
  let insertError: InsertError | null = null;

  for (let retry = 0; retry < 3; retry += 1) {
    documentData.numero = buildNumero(baseSeq + retry);
    const result = await tryInsertWithFallback(admin, documentData);
    newDocument = result.data;
    insertError = result.error;
    if (!insertError) break;
    if (String(insertError?.code || "") === "23505") continue;
    break;
  }

  if (insertError) {
    return {
      status: 500,
      body: {
        error: "Erreur lors de la création du document",
        details: `Erreur document: ${insertError?.message || "duplicate"}`,
        code: insertError?.code,
        hint: insertError?.hint,
        numero: documentData.numero,
      },
      resourceId: null,
    };
  }

  if (!newDocument?.id) {
    return {
      status: 500,
      body: { error: "Erreur lors de la création du document" },
      resourceId: null,
    };
  }

  await logAudit({
    clubId,
    action: AuditAction.CREATE,
    resourceType: type === "invoice" ? "invoice" : "quote",
    resourceId: String(newDocument.id),
    metadata: { numero: newDocument.numero, total_ttc: totalTTC },
    ...params.requestMeta,
  });

  return {
    status: 201,
    body: {
      id: newDocument.id.toString(),
      numero: newDocument.numero,
      type: newDocument.type,
      alreadyExisted: false,
    },
    resourceId: newDocument.id.toString(),
  };
}

export async function createDocumentRecordOrThrow(
  params: Parameters<typeof createDocumentRecord>[0]
) {
  const result = await createDocumentRecord(params);
  if (result.status >= 400) {
    throw new ToolError(
      String(result.body.error || getErrorMessage(result.body)),
      String(result.body.code || "DOCUMENT_CREATE_FAILED"),
      result.status
    );
  }
  return result.body;
}

export function singleLineItems(
  description: string,
  amount: number,
  tva = 0
): LigneDocument[] {
  return [
    {
      id: "1",
      designation: description.trim() || "Prestation",
      quantite: 1,
      prixUnitaire: amount,
      tva,
    },
  ];
}
