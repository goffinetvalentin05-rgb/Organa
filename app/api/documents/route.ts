import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculerTotalHT, calculerTVA, calculerTotalTTC } from "@/lib/utils/calculations";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { AuditAction, extractRequestMetadata, logAudit } from "@/lib/auth/audit";
import { normalizeClientsDbRow } from "@/lib/clients/normalizeDbRow";
import {
  DOCUMENT_NUMERO_MAX_LENGTH,
  DOCUMENT_TITLE_MAX_LENGTH,
} from "@/lib/documents/identityLimits";
import type { LigneDocument } from "@/lib/utils/calculations";
import { getErrorMessage } from "@/lib/utils/error-message";
import {
  buildInvoiceRecipientDbFields,
  parseExternalRecipientData,
  parseExternalRecipientFromDocument,
  recipientToApi,
  resolveDocumentRecipient,
  validateInvoiceRecipientInput,
  type ExternalRecipientData,
  type RecipientType,
} from "@/lib/documents/recipient";

// Forcer le runtime Node.js (pas Edge)
export const runtime = "nodejs";

async function requireManageDocumentsOrInvoices() {
  // Backward/forward compatible: certains clubs peuvent avoir manage_invoices sans manage_documents (ou l’inverse).
  const gDocs = await requirePermission(PERMISSIONS.MANAGE_DOCUMENTS);
  if (!("error" in gDocs)) return gDocs;

  const gInv = await requirePermission(PERMISSIONS.MANAGE_INVOICES);
  if (!("error" in gInv)) return gInv;

  return {
    error: NextResponse.json(
      {
        error: "Accès refusé",
        requiredAny: [PERMISSIONS.MANAGE_DOCUMENTS, PERMISSIONS.MANAGE_INVOICES],
      },
      { status: 403 }
    ),
  } as const;
}

async function requireViewDocumentsOrInvoices() {
  const gDocs = await requirePermission(PERMISSIONS.VIEW_DOCUMENTS);
  if (!("error" in gDocs)) return gDocs;

  const gInv = await requirePermission(PERMISSIONS.VIEW_INVOICES);
  if (!("error" in gInv)) return gInv;

  return {
    error: NextResponse.json(
      {
        error: "Accès refusé",
        requiredAny: [PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.VIEW_INVOICES],
      },
      { status: 403 }
    ),
  } as const;
}

type DocumentDbRow = {
  id: string;
  numero?: string | null;
  title?: string | null;
  type?: string;
  status?: string | null;
  date_creation?: string | null;
  date_echeance?: string | null;
  date_paiement?: string | null;
  items?: unknown;
  total_ht?: number | string | null;
  total_tva?: number | string | null;
  total_ttc?: number | string | null;
  notes?: string | null;
  client_id?: string | null;
  recipient_type?: string | null;
  sponsor_contract_id?: string | null;
  recipient_data?: unknown;
  external_recipient_name?: string | null;
  external_recipient_contact_name?: string | null;
  external_recipient_address?: string | null;
  external_recipient_zip?: string | null;
  external_recipient_city?: string | null;
  external_recipient_country?: string | null;
  external_recipient_email?: string | null;
  external_recipient_phone?: string | null;
  event_id?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  client?: unknown;
  sponsor?: unknown;
};

const DOCUMENT_SELECT =
  "id, numero, title, type, status, date_creation, date_echeance, date_paiement, items, total_ht, total_tva, total_ttc, notes, client_id, recipient_type, sponsor_contract_id, recipient_data, external_recipient_name, external_recipient_contact_name, external_recipient_address, external_recipient_zip, external_recipient_city, external_recipient_country, external_recipient_email, external_recipient_phone, event_id, created_by, updated_by, created_at, updated_at, client:clients(*), sponsor:sponsor_contracts(id, sponsor_name, title)";

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

type DocumentUpdatePayload = Record<string, unknown> & {
  numero?: string;
  title?: string;
  status?: string;
  date_echeance?: string | null;
  date_paiement?: string | null;
  notes?: string | null;
  items?: LigneDocument[];
  total_ht?: number;
  total_tva?: number;
  total_ttc?: number;
  event_id?: string | null;
  client_id?: string | null;
  updated_by?: string;
};

// GET /api/documents - Lister ou récupérer un document
export async function GET(request: NextRequest) {
  try {
    const guard = await requireViewDocumentsOrInvoices();
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    let query = supabase
      .from("documents")
      .select(DOCUMENT_SELECT)
      .eq("user_id", guard.clubId);

    if (type) {
      query = query.eq("type", type);
    }

    if (id) {
      const { data, error } = await query.eq("id", id).single();
      if (error || !data) {
        console.error("[API][documents][GET] Document introuvable:", error);
        return NextResponse.json(
          { error: "Document introuvable" },
          { status: 404 }
        );
      }

      let linkedEvent: { id: string; name: string } | null = null;
      if (data.event_id) {
        const { data: ev } = await supabase
          .from("events")
          .select("id, name")
          .eq("id", data.event_id)
          .eq("user_id", guard.clubId)
          .maybeSingle();
        if (ev) {
          linkedEvent = { id: ev.id, name: ev.name };
        }
      }

      return NextResponse.json(
        { document: formatDocument(data, linkedEvent) },
        { status: 200 }
      );
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("[API][documents][GET] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement des documents" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { documents: (data || []).map((doc) => formatDocument(doc)) },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[API][documents][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des documents", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/documents - Créer un nouveau document
export async function POST(request: NextRequest) {
  try {
    const guard = await requireManageDocumentsOrInvoices();
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const user = guard.ctx.user;

    console.log("[API][documents][POST] User authentifié:", user.id);

    // Vérifier l'accès en écriture (trial actif ou abonnement)
    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) {
      return accessCheck.response;
    }

    const body = await request.json();
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
    } = body;

    // Log du payload reçu pour debugging
    console.log("[API][documents][POST] Payload reçu:", {
      type,
      recipientType: recipientType || (clientId ? "member" : "non fourni"),
      clientId: clientId || null,
      sponsorContractId: sponsorContractId || null,
      recipientData:
        recipientType === "external" && recipientData
          ? {
              name: (recipientData as { name?: string })?.name,
              hasAddress: Boolean((recipientData as { address?: string })?.address),
              postalCode: (recipientData as { postalCode?: string })?.postalCode,
              city: (recipientData as { city?: string })?.city,
              email: (recipientData as { email?: string })?.email || null,
            }
          : null,
      lignes_count: lignes?.length || 0,
      statut,
      dateCreation,
    });

    if (!type || (type !== "invoice" && type !== "quote")) {
      return NextResponse.json(
        { error: "Paramètre 'type' requis et doit être 'invoice' ou 'quote'" },
        { status: 400 }
      );
    }

    if (type === "quote") {
      if (!clientId) {
        return NextResponse.json(
          { error: "clientId requis" },
          { status: 400 }
        );
      }
    }

    if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
      return NextResponse.json(
        { error: "Au moins une ligne est requise" },
        { status: 400 }
      );
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
        return NextResponse.json({ error: recipientCheck.error }, { status: 400 });
      }
      resolvedRecipientType = recipientCheck.type;
    }

    let resolvedClientId: string | null = null;
    let resolvedSponsorId: string | null = null;
    let resolvedRecipientData: ExternalRecipientData | null = null;

    if (type === "quote" || resolvedRecipientType === "member") {
      const memberId = clientId as string;
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("id", memberId)
        .eq("user_id", guard.clubId)
        .single();

      if (clientError || !client) {
        console.error("[API][documents][POST] Client introuvable ou non autorisé:", clientError);
        return NextResponse.json(
          { error: "Client introuvable ou non autorisé" },
          { status: 404 }
        );
      }
      resolvedClientId = memberId;
    } else if (resolvedRecipientType === "sponsor") {
      const sponsorId = sponsorContractId as string;
      const { data: sponsor, error: sponsorError } = await supabase
        .from("sponsor_contracts")
        .select("id")
        .eq("id", sponsorId)
        .eq("club_id", guard.clubId)
        .single();

      if (sponsorError || !sponsor) {
        console.error("[API][documents][POST] Sponsor introuvable ou non autorisé:", sponsorError);
        return NextResponse.json(
          { error: "Contrat sponsor introuvable ou non autorisé" },
          { status: 404 }
        );
      }
      resolvedSponsorId = sponsorId;
    } else {
      resolvedRecipientData = parseExternalRecipientData(recipientData);
      if (!resolvedRecipientData) {
        return NextResponse.json(
          { error: "Informations du destinataire externe invalides" },
          { status: 400 }
        );
      }
    }

    // Calculer les totaux
    const totalHT = calculerTotalHT(lignes);
    const totalTVA = calculerTVA(lignes);
    const totalTTC = calculerTotalTTC(lignes);

    // Générer le numéro du document (unicité: user_id + type + btrim(numero) avec deleted_at IS NULL)
    const year = new Date().getFullYear();
    // On compte les documents "actifs" (deleted_at IS NULL) pour coller à l’index unique partiel.
    const { count: docCount, error: countError } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", guard.clubId)
      .eq("type", type)
      .is("deleted_at", null)
      .gte("created_at", `${year}-01-01`)
      .lte("created_at", `${year}-12-31`);

    if (countError) {
      console.error("ERREUR DOCUMENT COTISATION", {
        step: "documents.post.count",
        error: countError,
        message: (countError as any)?.message,
        stack: (countError as any)?.stack,
        data: { docCount },
        clubId: guard.clubId,
        memberId: clientId,
        documentPayload: { type, year },
        pdfPayload: null,
        storagePath: null,
      });
    }

    // Préfixe COT pour les cotisations (quote), FAC pour les factures (invoice)
    const prefix = type === "quote" ? "COT" : "FAC";
    const baseSeq = (docCount ?? 0) + 1;
    const buildNumero = (seq: number) =>
      `${prefix}-${year}-${String(seq).padStart(3, "0")}`;

    const firstDesignation = lignes
      .map((l: { designation?: string }) => String(l?.designation || "").trim())
      .find((d: string) => d.length > 0);
    const defaultTitle =
      firstDesignation ||
      (type === "quote" ? "Cotisation" : "Facture");
    const title =
      defaultTitle.length > DOCUMENT_TITLE_MAX_LENGTH
        ? defaultTitle.slice(0, DOCUMENT_TITLE_MAX_LENGTH)
        : defaultTitle;

    // Préparer les données d'insertion avec les noms de colonnes exacts
    const recipientDbFields =
      type === "invoice"
        ? buildInvoiceRecipientDbFields({
            type: resolvedRecipientType,
            clientId: resolvedClientId,
            sponsorContractId: resolvedSponsorId,
            external: resolvedRecipientData,
          })
        : { client_id: resolvedClientId };

    console.log("[API][documents][POST][recipient-resolved]", {
      step: "before-insert",
      documentType: type,
      recipientType: type === "invoice" ? resolvedRecipientType : "member",
      clientId: recipientDbFields.client_id ?? null,
      sponsorContractId: recipientDbFields.sponsor_contract_id ?? null,
      externalName:
        (recipientDbFields.external_recipient_name as string | null | undefined) ??
        null,
    });

    const documentData: DocumentInsertPayload = {
      user_id: guard.clubId,
      type: type,
      items: lignes,
      status: statut || "brouillon",
      date_creation: dateCreation || new Date().toISOString().split("T")[0],
      total_ht: totalHT,
      total_tva: totalTVA,
      total_ttc: totalTTC,
      numero: buildNumero(baseSeq),
      ...recipientDbFields,
      client_id: (recipientDbFields.client_id as string | null) ?? null,
    };

    // Champs “évolutifs” (peuvent ne pas exister si une migration n’a pas été appliquée).
    // On les envoie par défaut, mais on saura les retirer si Supabase renvoie "column does not exist".
    documentData.title = title;
    documentData.created_by = user.id;
    documentData.updated_by = user.id;

    // Ajouter date_echeance uniquement si fourni et non vide
    if (dateEcheance && dateEcheance.trim() !== "") {
      documentData.date_echeance = dateEcheance;
    }

    // Ajouter date_paiement uniquement si fourni et non vide (pour les factures)
    if (datePaiement && datePaiement.trim() !== "") {
      documentData.date_paiement = datePaiement;
    }

    // Ajouter notes uniquement si fourni
    if (notes && notes.trim() !== "") {
      documentData.notes = notes;
    }

    // Ajouter event_id uniquement si fourni
    if (eventId) {
      documentData.event_id = eventId;
    }

    console.log("[API][documents][POST] Tentative d'insertion dans public.documents:", {
      user_id: user.id,
      type: type,
      recipient_type: documentData.recipient_type ?? null,
      client_id: documentData.client_id ?? null,
      sponsor_contract_id: documentData.sponsor_contract_id ?? null,
      external_recipient_name: documentData.external_recipient_name ?? null,
      numero: documentData.numero,
      items_count: lignes.length,
    });

    const extractMissingColumn = (message: string): string | null => {
      const m1 = message.match(/Could not find the '([^']+)' column/i);
      if (m1?.[1]) return m1[1];
      const m2 = message.match(/column "([^"]+)" of relation "[^"]+" does not exist/i);
      if (m2?.[1]) return m2[1];
      const m3 = message.match(/column ([a-zA-Z0-9_]+) does not exist/i);
      if (m3?.[1]) return m3[1];
      return null;
    };

    type InsertRow = { id: string; numero?: string | null; type?: string | null };
    type InsertError = {
      code?: string;
      message?: string;
      details?: string | null;
      hint?: string | null;
    };

    const tryInsertWithFallback = async (
      payload: DocumentInsertPayload
    ): Promise<{ data: InsertRow | null; error: InsertError | null }> => {
      // Clone pour pouvoir retirer des champs sans muter l’original.
      const working: Record<string, unknown> = { ...payload };
      const removedColumns: string[] = [];

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const { data, error } = await supabase
          .from("documents")
          .insert(working)
          .select("id, numero, type, created_at")
          .single();

        if (!error) {
          if (removedColumns.length > 0) {
            console.warn("[API][documents][POST] Insert réussi après retrait de colonnes:", removedColumns);
          }
          return { data: data as InsertRow, error: null };
        }

        const msg = String((error as InsertError | null | undefined)?.message || "");
        console.error("[API][documents][POST][insert-attempt-failed]", {
          attempt: attempt + 1,
          code: (error as InsertError)?.code,
          message: msg,
          details: (error as InsertError)?.details,
          hint: (error as InsertError)?.hint,
          removedColumns,
          recipientType: working.recipient_type,
          clientId: working.client_id,
        });
        const missingCol = extractMissingColumn(msg);
        if (missingCol && missingCol in working) {
          removedColumns.push(missingCol);
          delete working[missingCol];
          console.warn("[API][documents][POST] Colonne absente détectée, retry sans:", missingCol);
          continue;
        }

        // Aucune colonne manquante détectée ou impossible de progresser.
        return { data: null, error: error as InsertError };
      }

      return { data: null, error: { message: "Insert failed after retries" } };
    };

    // Créer le document dans Supabase (table public.documents) avec fallback colonnes manquantes
    // + retry automatique sur 23505 (numero déjà pris pour ce club+type)
    let newDocument: { id: string; numero?: string | null; type?: string | null } | null = null;
    let insertError: InsertError | null = null;

    for (let retry = 0; retry < 3; retry += 1) {
      // Recalculer un numéro différent à chaque retry pour éviter duplicate key.
      documentData.numero = buildNumero(baseSeq + retry);

      const result = await tryInsertWithFallback(documentData);
      newDocument = result.data;
      insertError = result.error as InsertError | null;

      if (!insertError) break;

      const code = String((insertError as any)?.code || "");
      if (code === "23505") {
        console.error("ERREUR DOCUMENT COTISATION", {
          step: "documents.post.insert.duplicate-23505",
          error: insertError,
          message: (insertError as any)?.message,
          stack: undefined,
          data: null,
          clubId: guard.clubId,
          memberId: clientId,
          documentPayload: {
            ...documentData,
            number: (documentData as any)?.numero,
            document_number: (documentData as any)?.document_number,
            type: documentData.type,
          },
          pdfPayload: null,
          storagePath: null,
        });
        // Réessayer avec le prochain numéro
        continue;
      }

      // Autre erreur -> stop
      break;
    }

    if (insertError) {
      console.error("ERREUR DOCUMENT COTISATION", {
        step: "documents.post.insert",
        error: insertError,
        message: insertError?.message,
        stack: undefined,
        data: newDocument,
        clubId: guard.clubId,
        memberId: clientId,
        documentPayload: {
          ...documentData,
          number: (documentData as any)?.numero,
          document_number: (documentData as any)?.document_number,
          type: documentData.type,
        },
        pdfPayload: null,
        storagePath: null,
      });
      console.error("[API][documents][POST] Erreur Supabase insert:", {
        status: "ERROR",
        code: (insertError as any).code || "UNKNOWN",
        message: insertError.message || "Erreur inconnue",
        details: (insertError as any).details || null,
        hint: (insertError as any).hint || null,
        data_attempted: {
          club_id: guard.clubId,
          auth_user_id: user.id,
          client_id: clientId,
          type: type,
          numero: documentData.numero,
        },
      });
      return NextResponse.json(
        { 
          error: "Erreur lors de la création du document",
          details: `Erreur document: ${(insertError as any).message || "duplicate"}`,
          code: (insertError as any).code,
          hint: (insertError as any).hint,
          numero: documentData.numero,
        },
        { status: 500 }
      );
    }

    if (!newDocument || !newDocument.id) {
      console.error("[API][documents][POST] Document créé mais ID manquant");
      return NextResponse.json(
        { error: "Erreur lors de la création du document" },
        { status: 500 }
      );
    }

    console.log("[API][documents][POST] Document créé avec succès:", {
      id: newDocument.id,
      numero: newDocument.numero,
      type: newDocument.type,
    });

    const meta = extractRequestMetadata(request);
    await logAudit({
      clubId: guard.clubId,
      action: AuditAction.CREATE,
      resourceType: type === "invoice" ? "invoice" : "quote",
      resourceId: String(newDocument.id),
      metadata: { numero: newDocument.numero, total_ttc: totalTTC },
      ...meta,
    });

    return NextResponse.json({
      id: newDocument.id.toString(),
      numero: newDocument.numero,
      type: newDocument.type,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("ERREUR DOCUMENT COTISATION", {
      step: "documents.post.catch",
      error,
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      data: null,
      clubId: undefined,
      memberId: undefined,
      documentPayload: null,
      pdfPayload: null,
      storagePath: null,
    });
    console.error("[API][documents][POST] Erreur inattendue:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la création du document",
        details: `Erreur document: ${getErrorMessage(error)}`,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/documents - Supprimer un document
export async function DELETE(request: NextRequest) {
  try {
    // Supprimer un document est plus sensible: exiger delete_documents OU delete_invoices.
    const gDocs = await requirePermission(PERMISSIONS.DELETE_DOCUMENTS);
    const guard =
      "error" in gDocs ? await requirePermission(PERMISSIONS.DELETE_INVOICES) : gDocs;
    if ("error" in guard) {
      return NextResponse.json(
        {
          error: "Accès refusé",
          requiredAny: [PERMISSIONS.DELETE_DOCUMENTS, PERMISSIONS.DELETE_INVOICES],
        },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Vérifier l'accès en écriture (trial actif ou abonnement)
    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) {
      return accessCheck.response;
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID du document requis" },
        { status: 400 }
      );
    }

    // Récupérer le doc avant delete pour audit
    const { data: docInfo } = await supabase
      .from("documents")
      .select("numero, type, total_ttc")
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .maybeSingle();

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("user_id", guard.clubId);

    if (error) {
      console.error("[API][documents][DELETE] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression du document" },
        { status: 500 }
      );
    }

    const meta = extractRequestMetadata(request);
    await logAudit({
      clubId: guard.clubId,
      action: AuditAction.HARD_DELETE,
      resourceType: docInfo?.type === "invoice" ? "invoice" : "quote",
      resourceId: id,
      metadata: { numero: docInfo?.numero, total_ttc: docInfo?.total_ttc },
      ...meta,
    });

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/devis");
    revalidatePath("/tableau-de-bord/factures");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("[API][documents][DELETE] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

function formatDocument(
  doc: DocumentDbRow,
  linkedEvent?: { id: string; name: string } | null
) {

  const client = Array.isArray(doc.client) ? doc.client[0] : doc.client;
  const sponsor = Array.isArray(doc.sponsor) ? doc.sponsor[0] : doc.sponsor;
  const recipient = resolveDocumentRecipient({
    recipient_type: doc.recipient_type,
    client_id: doc.client_id,
    sponsor_contract_id: doc.sponsor_contract_id,
    recipient_data: doc.recipient_data,
    external_recipient_name: doc.external_recipient_name,
    external_recipient_contact_name: doc.external_recipient_contact_name,
    external_recipient_address: doc.external_recipient_address,
    external_recipient_zip: doc.external_recipient_zip,
    external_recipient_city: doc.external_recipient_city,
    external_recipient_country: doc.external_recipient_country,
    external_recipient_email: doc.external_recipient_email,
    external_recipient_phone: doc.external_recipient_phone,
    client: client as Record<string, unknown> | null,
    sponsor: sponsor as Record<string, unknown> | null,
  });

  return {
    id: doc.id,
    numero: doc.numero || "",
    title: doc.title || "",
    type: doc.type,
    statut: doc.status || "brouillon",
    dateCreation: doc.date_creation || "",
    dateEcheance: doc.date_echeance || null,
    datePaiement: doc.date_paiement || null,
    lignes: Array.isArray(doc.items) ? doc.items : [],
    totalHT: toNumber(doc.total_ht),
    totalTVA: toNumber(doc.total_tva),
    totalTTC: toNumber(doc.total_ttc),
    notes: doc.notes || "",
    clientId: doc.client_id || null,
    recipientType: recipient.type,
    sponsorContractId: doc.sponsor_contract_id ?? null,
    recipientData: parseExternalRecipientFromDocument(doc),
    recipient: recipientToApi(recipient),
    eventId: doc.event_id ?? null,
    linkedEvent:
      linkedEvent !== undefined ? linkedEvent : null,
    createdBy: doc.created_by ?? null,
    updatedBy: doc.updated_by ?? null,
    createdAt: doc.created_at ?? null,
    updatedAt: doc.updated_at ?? null,
    client: (() => {
      if (!client) return null;
      const n = normalizeClientsDbRow(client as Record<string, unknown>);
      if (!n) return null;
      return {
        id: n.id,
        nom: n.nom,
        email: n.email,
        telephone: n.telephone,
        adresse: n.adresse,
        postal_code: n.postal_code,
        city: n.city,
      };
    })(),
  };
}
// PATCH /api/documents - Mettre à jour un document existant
export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireManageDocumentsOrInvoices();
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const user = guard.ctx.user;

    // Vérifier l'accès en écriture (trial actif ou abonnement)
    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) {
      return accessCheck.response;
    }

    const body = await request.json();
    const {
      id,
      type,
      clientId,
      recipientType,
      sponsorContractId,
      recipientData,
      lignes,
      statut,
      dateEcheance,
      datePaiement,
      notes,
      eventId,
      numero,
      title,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID du document requis" },
        { status: 400 }
      );
    }

    if (!type || (type !== "invoice" && type !== "quote")) {
      return NextResponse.json(
        { error: "Paramètre 'type' requis et doit être 'invoice' ou 'quote'" },
        { status: 400 }
      );
    }

    // Vérifier que le document appartient au club
    const { data: existingDoc, error: fetchError } = await supabase
      .from("documents")
      .select("id, numero, title, event_id, type")
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .single();

    if (fetchError || !existingDoc) {
      console.error("[API][documents][PATCH] Document introuvable ou non autorisé:", fetchError);
      return NextResponse.json(
        { error: "Document introuvable ou non autorisé" },
        { status: 404 }
      );
    }

    if (existingDoc.type !== type) {
      return NextResponse.json(
        { error: "Le type de document ne correspond pas" },
        { status: 400 }
      );
    }

    const previousEventId = existingDoc.event_id as string | null;

    // Préparer les données de mise à jour (ne pas écraser le statut si non fourni)
    const updateData: DocumentUpdatePayload = {};

    const identityKeysProvided = numero !== undefined || title !== undefined;
    if (identityKeysProvided) {
      const currentNum = String(existingDoc.numero ?? "").trim();
      const currentTitle = String((existingDoc as { title?: string | null }).title ?? "").trim();

      if (type === "quote") {
        if (title === undefined) {
          return NextResponse.json(
            { error: "Le titre est obligatoire" },
            { status: 400 }
          );
        }

        const nextTitle = String(title).trim();

        if (!nextTitle) {
          return NextResponse.json(
            { error: "Le titre est obligatoire" },
            { status: 400 }
          );
        }
        if (nextTitle.length > DOCUMENT_TITLE_MAX_LENGTH) {
          return NextResponse.json(
            { error: "Le titre dépasse la longueur maximale autorisée" },
            { status: 400 }
          );
        }
        if (!currentNum) {
          return NextResponse.json(
            { error: "Référence de cotisation introuvable" },
            { status: 400 }
          );
        }

        updateData.title = nextTitle;
      } else {
        const nextNumero = numero !== undefined ? String(numero).trim() : currentNum;
        const nextTitle = title !== undefined ? String(title).trim() : currentTitle;

        if (!nextNumero || !nextTitle) {
          return NextResponse.json(
            { error: "Le numéro et le titre sont obligatoires" },
            { status: 400 }
          );
        }
        if (
          nextNumero.length > DOCUMENT_NUMERO_MAX_LENGTH ||
          nextTitle.length > DOCUMENT_TITLE_MAX_LENGTH
        ) {
          return NextResponse.json(
            { error: "Le numéro ou le titre dépasse la longueur maximale autorisée" },
            { status: 400 }
          );
        }

        if (nextNumero !== currentNum) {
          const { data: dupRow } = await supabase
            .from("documents")
            .select("id")
            .eq("user_id", guard.clubId)
            .eq("type", existingDoc.type)
            .neq("id", id)
            .is("deleted_at", null)
            .eq("numero", nextNumero)
            .maybeSingle();

          if (dupRow?.id) {
            return NextResponse.json(
              {
                error:
                  "Ce numéro est déjà utilisé pour un autre document du même type dans votre club",
              },
              { status: 409 }
            );
          }
        }

        updateData.numero = nextNumero;
        updateData.title = nextTitle;
      }
    }

    if (statut !== undefined) {
      updateData.status = statut;
    }

    // Ajouter date_echeance uniquement si fourni et non vide
    if (dateEcheance && dateEcheance.trim() !== "") {
      updateData.date_echeance = dateEcheance;
    } else if (dateEcheance === null || dateEcheance === "") {
      // Permettre de supprimer la date d'échéance en envoyant null explicitement
      updateData.date_echeance = null;
    }

    // Ajouter date_paiement uniquement si fourni (pour les factures)
    if (type === "invoice" && datePaiement !== undefined) {
      if (datePaiement && datePaiement.trim() !== "") {
        updateData.date_paiement = datePaiement;
      } else {
        updateData.date_paiement = null;
      }
    }

    // Ajouter notes uniquement si fourni
    if (notes !== undefined) {
      if (notes && notes.trim() !== "") {
        updateData.notes = notes;
      } else {
        updateData.notes = null;
      }
    }

    // Si les lignes sont fournies, recalculer les totaux
    if (lignes && Array.isArray(lignes)) {
      updateData.items = lignes;
      updateData.total_ht = calculerTotalHT(lignes);
      updateData.total_tva = calculerTVA(lignes);
      updateData.total_ttc = calculerTotalTTC(lignes);
    }

    // Ajouter event_id si fourni — vérifier que l'événement appartient au club
    if (eventId !== undefined) {
      const nextEventId = eventId ? String(eventId).trim() : null;
      if (nextEventId) {
        const { data: ev, error: evErr } = await supabase
          .from("events")
          .select("id")
          .eq("id", nextEventId)
          .eq("user_id", guard.clubId)
          .maybeSingle();
        if (evErr || !ev) {
          return NextResponse.json(
            { error: "Événement introuvable ou non autorisé" },
            { status: 400 }
          );
        }
        updateData.event_id = nextEventId;
      } else {
        updateData.event_id = null;
      }
    }

    const recipientFieldsProvided =
      recipientType !== undefined ||
      sponsorContractId !== undefined ||
      recipientData !== undefined ||
      clientId !== undefined;

    if (type === "invoice" && recipientFieldsProvided) {
      const nextRecipientType = (recipientType ||
        (clientId ? "member" : sponsorContractId ? "sponsor" : "external")) as RecipientType;
      const recipientCheck = validateInvoiceRecipientInput({
        recipientType: nextRecipientType,
        clientId,
        sponsorContractId,
        recipientData,
      });
      if (!recipientCheck.ok) {
        return NextResponse.json({ error: recipientCheck.error }, { status: 400 });
      }

      let resolvedClientId: string | null = null;
      let resolvedSponsorId: string | null = null;
      let resolvedExternal: ExternalRecipientData | null = null;

      if (recipientCheck.type === "member") {
        const memberId = clientId as string;
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .select("id")
          .eq("id", memberId)
          .eq("user_id", guard.clubId)
          .single();

        if (clientError || !client) {
          return NextResponse.json(
            { error: "Client introuvable ou non autorisé" },
            { status: 404 }
          );
        }
        resolvedClientId = memberId;
      } else if (recipientCheck.type === "sponsor") {
        const sponsorId = sponsorContractId as string;
        const { data: sponsor, error: sponsorError } = await supabase
          .from("sponsor_contracts")
          .select("id")
          .eq("id", sponsorId)
          .eq("club_id", guard.clubId)
          .single();

        if (sponsorError || !sponsor) {
          return NextResponse.json(
            { error: "Contrat sponsor introuvable ou non autorisé" },
            { status: 404 }
          );
        }
        resolvedSponsorId = sponsorId;
      } else {
        resolvedExternal = parseExternalRecipientData(recipientData);
        if (!resolvedExternal) {
          return NextResponse.json(
            { error: "Informations du destinataire externe invalides" },
            { status: 400 }
          );
        }
      }

      Object.assign(
        updateData,
        buildInvoiceRecipientDbFields({
          type: recipientCheck.type,
          clientId: resolvedClientId,
          sponsorContractId: resolvedSponsorId,
          external: resolvedExternal,
        })
      );
    } else if (clientId) {
      // Vérifier que le client appartient au club
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("id", clientId)
        .eq("user_id", guard.clubId)
        .single();

      if (clientError || !client) {
        console.error("[API][documents][PATCH] Client introuvable ou non autorisé:", clientError);
        return NextResponse.json(
          { error: "Client introuvable ou non autorisé" },
          { status: 404 }
        );
      }

      updateData.client_id = clientId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ à mettre à jour" },
        { status: 400 }
      );
    }

    updateData.updated_by = user.id;

    // Garde-fou : toujours filtrer par user_id (club) — ne jamais faire d’UPDATE documents global.
    const { data: updatedDoc, error: updateError } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .select("id, numero, title, type, event_id")
      .single();

    if (updateError) {
      console.error("[API][documents][PATCH] Erreur Supabase update:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
      if (updateError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Ce numéro est déjà utilisé pour un autre document du même type dans votre club",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { 
          error: "Erreur lors de la mise à jour du document",
          details: updateError.message 
        },
        { status: 500 }
      );
    }

    console.log("[API][documents][PATCH] Document mis à jour avec succès:", {
      id: updatedDoc.id,
      numero: updatedDoc.numero,
      type: updatedDoc.type,
    });

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/devis");
    revalidatePath(`/tableau-de-bord/devis/${id}`);
    revalidatePath("/tableau-de-bord/factures");
    revalidatePath(`/tableau-de-bord/factures/${id}`);
    revalidatePath("/tableau-de-bord/evenements");
    if (previousEventId) {
      revalidatePath(`/tableau-de-bord/evenements/${previousEventId}`);
    }
    if (updatedDoc.event_id && updatedDoc.event_id !== previousEventId) {
      revalidatePath(`/tableau-de-bord/evenements/${updatedDoc.event_id}`);
    }

    return NextResponse.json({
      id: updatedDoc.id.toString(),
      numero: updatedDoc.numero,
      title: (updatedDoc as { title?: string }).title ?? "",
      type: updatedDoc.type,
      eventId: updatedDoc.event_id ?? null,
    });
  } catch (error: unknown) {
    console.error("[API][documents][PATCH] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du document", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
