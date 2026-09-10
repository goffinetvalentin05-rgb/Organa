import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";

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

// GET /api/documents/[id] - Récupérer un document avec son client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { error: "ID du document requis" },
        { status: 400 }
      );
    }

    const guard = await requireViewDocumentsOrInvoices();
    if ("error" in guard) return guard.error;

    const admin = createAdminClient();

    const { data: document, error: docError } = await admin
      .from("documents")
      .select(`
        id,
        user_id,
        client_id,
        type,
        items,
        status,
        date_creation,
        date_echeance,
        date_paiement,
        notes,
        total_ht,
        total_tva,
        total_ttc,
        numero,
        created_at,
        updated_at
      `)
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .single();

    if (docError || !document) {
      console.error("[API][documents][GET] Document introuvable:", {
        id,
        error: docError?.message,
        code: docError?.code,
      });
      return NextResponse.json(
        { error: "Document introuvable" },
        { status: 404 }
      );
    }

    if (!document.client_id) {
      return NextResponse.json({
        document: {
          id: document.id.toString(),
          numero: document.numero,
          type: document.type,
          clientId: null,
          client: null,
          lignes: document.items || [],
          statut: document.status,
          dateCreation: document.date_creation,
          dateEcheance: document.date_echeance,
          datePaiement: document.date_paiement,
          notes: document.notes,
          totals: {
            totalHT: document.total_ht || 0,
            totalTVA: document.total_tva || 0,
            totalTTC: document.total_ttc || 0,
          },
          created_at: document.created_at,
          updated_at: document.updated_at,
        },
      });
    }

    const { data: client, error: clientError } = await admin
      .from("clients")
      .select("id, nom, email, telephone, adresse")
      .eq("id", document.client_id)
      .eq("user_id", guard.clubId)
      .is("deleted_at", null)
      .single();

    if (clientError || !client) {
      console.error("[API][documents][GET] Client associé introuvable:", {
        client_id: document.client_id,
        error: clientError?.message,
      });
      return NextResponse.json(
        { error: "Client associé introuvable" },
        { status: 404 }
      );
    }

    const response = {
      id: document.id.toString(),
      numero: document.numero,
      type: document.type,
      clientId: document.client_id,
      client: {
        id: client.id,
        nom: client.nom,
        email: client.email,
        telephone: client.telephone,
        adresse: client.adresse,
      },
      lignes: document.items || [],
      statut: document.status,
      dateCreation: document.date_creation,
      dateEcheance: document.date_echeance,
      datePaiement: document.date_paiement,
      notes: document.notes,
      totals: {
        totalHT: document.total_ht || 0,
        totalTVA: document.total_tva || 0,
        totalTTC: document.total_ttc || 0,
      },
      created_at: document.created_at,
      updated_at: document.updated_at,
    };

    return NextResponse.json({ document: response });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur";
    console.error("[API][documents][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du document", details: message },
      { status: 500 }
    );
  }
}
