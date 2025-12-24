import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

    const supabase = await createClient();

    // Authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      console.error("[API][documents][GET] Erreur auth:", authError);
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer le document
    const { data: document, error: docError } = await supabase
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
      .eq("user_id", user.id)
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

    // Récupérer le client séparément
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, nom, email, telephone, adresse")
      .eq("id", document.client_id)
      .eq("user_id", user.id)
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

    // Formater la réponse
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

    console.log("[API][documents][GET] Document récupéré avec succès:", {
      id: response.id,
      numero: response.numero,
      type: response.type,
    });

    return NextResponse.json({ document: response });
  } catch (error: any) {
    console.error("[API][documents][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du document", details: error.message },
      { status: 500 }
    );
  }
}

