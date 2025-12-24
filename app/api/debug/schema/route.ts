import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Forcer le runtime Node.js (pas Edge)
export const runtime = "nodejs";

// GET /api/debug/schema - Debug endpoint pour vérifier le schéma de la base de données
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authentification (optionnel pour debug, mais mieux sécurisé)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié", authenticated: false },
        { status: 401 }
      );
    }

    // Récupérer les tables publiques
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          table_name,
          table_schema
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    }).catch(() => ({ data: null, error: { message: "RPC exec_sql not available" } }));

    // Méthode alternative : utiliser une requête SQL directe via le client Supabase
    // Mais Supabase JS client ne supporte pas les requêtes SQL arbitraires
    // On va plutôt vérifier la table documents directement

    const schemaInfo: any = {
      authenticated: true,
      user_id: user.id,
      timestamp: new Date().toISOString(),
      tables_check: {} as any,
      documents_columns: [] as any[],
    };

    // Vérifier si la table documents existe en essayant de la lire
    const { data: docCheck, error: docCheckError } = await supabase
      .from("documents")
      .select("id")
      .limit(1);

    schemaInfo.tables_check.documents = {
      exists: !docCheckError,
      error: docCheckError?.message || null,
      code: docCheckError?.code || null,
      hint: docCheckError?.hint || null,
    };

    // Si la table existe, récupérer ses colonnes
    if (!docCheckError) {
      // On va utiliser une requête pour récupérer les colonnes
      // Mais comme on ne peut pas faire de requête SQL directe, on va plutôt
      // essayer de sélectionner toutes les colonnes pour voir lesquelles existent
      const { data: sampleDoc, error: sampleError } = await supabase
        .from("documents")
        .select(`
          id,
          user_id,
          type,
          client_id,
          date_creation,
          date_echeance,
          date_paiement,
          items,
          total_ht,
          total_tva,
          total_ttc,
          status,
          notes,
          numero,
          created_at,
          updated_at
        `)
        .limit(1);

      if (!sampleError) {
        // Les colonnes existent, on les liste
        schemaInfo.documents_columns = [
          "id",
          "user_id",
          "type",
          "client_id",
          "date_creation",
          "date_echeance",
          "date_paiement",
          "items",
          "total_ht",
          "total_tva",
          "total_ttc",
          "status",
          "notes",
          "numero",
          "created_at",
          "updated_at",
        ];
      } else {
        // Erreur lors de la sélection, on retourne l'erreur
        schemaInfo.documents_columns_error = {
          message: sampleError.message,
          code: sampleError.code,
          hint: sampleError.hint,
          details: sampleError.details,
        };
      }
    }

    // Vérifier les autres tables importantes
    const { data: clientsCheck, error: clientsError } = await supabase
      .from("clients")
      .select("id")
      .limit(1);

    schemaInfo.tables_check.clients = {
      exists: !clientsError,
      error: clientsError?.message || null,
    };

    const { data: profilesCheck, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id")
      .limit(1);

    schemaInfo.tables_check.profiles = {
      exists: !profilesError,
      error: profilesError?.message || null,
    };

    return NextResponse.json(schemaInfo, { status: 200 });
  } catch (error: any) {
    console.error("[DEBUG][schema] Erreur:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération du schéma",
        details: error.message,
        authenticated: false,
      },
      { status: 500 }
    );
  }
}






