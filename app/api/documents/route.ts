import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculerTotalHT, calculerTVA, calculerTotalTTC } from "@/lib/utils/calculations";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

// Forcer le runtime Node.js (pas Edge)
export const runtime = "nodejs";

// GET /api/documents - Lister ou récupérer un document
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      console.error("[API][documents][GET] Erreur auth:", authError);
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    let query = supabase
      .from("documents")
      .select(
        "id, numero, type, status, date_creation, date_echeance, date_paiement, items, total_ht, total_tva, total_ttc, notes, client_id, client:clients(id, nom, email, telephone, adresse)"
      )
      .eq("user_id", user.id);

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

      return NextResponse.json(
        { document: formatDocument(data) },
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
      { documents: (data || []).map(formatDocument) },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API][documents][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des documents", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/documents - Créer un nouveau document
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      console.error("[API][documents][POST] Erreur auth:", authError);
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    console.log("[API][documents][POST] User authentifié:", user.id);

    // Vérifier l'accès en écriture (trial actif ou abonnement)
    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) {
      return accessCheck.response;
    }

    const body = await request.json();
    const { type, clientId, lignes, statut, dateCreation, dateEcheance, datePaiement, notes, eventId } = body;

    // Log du payload reçu pour debugging
    console.log("[API][documents][POST] Payload reçu:", {
      type,
      clientId: clientId ? "présent" : "absent",
      lignes_count: lignes?.length || 0,
      statut,
      dateCreation,
      dateEcheance: dateEcheance || "non fourni",
      datePaiement: datePaiement || "non fourni",
      notes: notes ? "présentes" : "absentes",
    });

    if (!type || (type !== "invoice" && type !== "quote")) {
      return NextResponse.json(
        { error: "Paramètre 'type' requis et doit être 'invoice' ou 'quote'" },
        { status: 400 }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId requis" },
        { status: 400 }
      );
    }

    if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
      return NextResponse.json(
        { error: "Au moins une ligne est requise" },
        { status: 400 }
      );
    }

    // Vérifier que le client appartient à l'utilisateur
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      console.error("[API][documents][POST] Client introuvable ou non autorisé:", clientError);
      return NextResponse.json(
        { error: "Client introuvable ou non autorisé" },
        { status: 404 }
      );
    }

    // Calculer les totaux
    const totalHT = calculerTotalHT(lignes);
    const totalTVA = calculerTVA(lignes);
    const totalTTC = calculerTotalTTC(lignes);

    // Générer le numéro du document
    const year = new Date().getFullYear();
    const { count: docCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", type)
      .gte("created_at", `${year}-01-01`)
      .lte("created_at", `${year}-12-31`);
    
    const numero = type === "quote" 
      ? `DEV-${year}-${String((docCount ?? 0) + 1).padStart(3, "0")}`
      : `FAC-${year}-${String((docCount ?? 0) + 1).padStart(3, "0")}`;

    // Préparer les données d'insertion avec les noms de colonnes exacts
    // Ne jamais envoyer date_echeance si elle est vide/undefined (laisser le default de la DB)
    const documentData: any = {
      user_id: user.id,
      client_id: clientId,
      type: type, // 'quote' ou 'invoice'
      items: lignes, // jsonb
      status: statut || "brouillon",
      date_creation: dateCreation || new Date().toISOString().split("T")[0],
      total_ht: totalHT,
      total_tva: totalTVA,
      total_ttc: totalTTC,
      numero: numero,
    };

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
      client_id: clientId,
      type: type,
      date_creation: documentData.date_creation,
      date_echeance: documentData.date_echeance,
      items_count: lignes.length,
    });

    // Créer le document dans Supabase (table public.documents)
    const { data: newDocument, error: insertError } = await supabase
      .from("documents")
      .insert(documentData)
      .select("id, numero, type, created_at")
      .single();

    if (insertError) {
      console.error("[API][documents][POST] Erreur Supabase insert:", {
        status: "ERROR",
        code: insertError.code || "UNKNOWN",
        message: insertError.message || "Erreur inconnue",
        details: insertError.details || null,
        hint: insertError.hint || null,
        data_attempted: {
          user_id: user.id,
          client_id: clientId,
          type: type,
        },
      });
      return NextResponse.json(
        { 
          error: "Erreur lors de la création du document",
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
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

    return NextResponse.json({
      id: newDocument.id.toString(),
      numero: newDocument.numero,
      type: newDocument.type,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[API][documents][POST] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du document", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/documents - Supprimer un document
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      console.error("[API][documents][DELETE] Erreur auth:", authError);
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

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

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[API][documents][DELETE] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression du document" },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/devis");
    revalidatePath("/tableau-de-bord/factures");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API][documents][DELETE] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: error.message },
      { status: 500 }
    );
  }
}

function formatDocument(doc: any) {
  const toNumber = (value: any) =>
    typeof value === "number" ? value : Number(value) || 0;

  const client = Array.isArray(doc.client) ? doc.client[0] : doc.client;

  return {
    id: doc.id,
    numero: doc.numero || "",
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
    client: client
      ? {
          id: client.id,
          nom: client.nom,
          email: client.email,
          telephone: client.telephone,
          adresse: client.adresse,
        }
      : null,
  };
}
// PATCH /api/documents - Mettre à jour un document existant
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      console.error("[API][documents][PATCH] Erreur auth:", authError);
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier l'accès en écriture (trial actif ou abonnement)
    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) {
      return accessCheck.response;
    }

    const body = await request.json();
    const { id, type, clientId, lignes, statut, dateEcheance, datePaiement, notes, eventId } = body;

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

    // Vérifier que le document appartient à l'utilisateur
    const { data: existingDoc, error: fetchError } = await supabase
      .from("documents")
      .select("id, numero")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingDoc) {
      console.error("[API][documents][PATCH] Document introuvable ou non autorisé:", fetchError);
      return NextResponse.json(
        { error: "Document introuvable ou non autorisé" },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    // Ne jamais envoyer de champs undefined/null si non fournis
    const updateData: any = {
      status: statut,
    };

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

    // Ajouter event_id si fourni
    if (eventId !== undefined) {
      updateData.event_id = eventId || null;
    }

    if (clientId) {
      // Vérifier que le client appartient à l'utilisateur
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("id", clientId)
        .eq("user_id", user.id)
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

    // Mettre à jour le document
    const { data: updatedDoc, error: updateError } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, numero, type")
      .single();

    if (updateError) {
      console.error("[API][documents][PATCH] Erreur Supabase update:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
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

    return NextResponse.json({
      id: updatedDoc.id.toString(),
      numero: updatedDoc.numero,
      type: updatedDoc.type,
    });
  } catch (error: any) {
    console.error("[API][documents][PATCH] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du document", details: error.message },
      { status: 500 }
    );
  }
}
