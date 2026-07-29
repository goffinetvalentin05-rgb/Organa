import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { DOCUMENT_TITLE_MAX_LENGTH } from "@/lib/documents/identityLimits";

export const runtime = "nodejs";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Erreur inconnue";
}

/**
 * Crée une facture à partir d'une réservation buvette acceptée.
 *
 * L'envoi e-mail n'est plus effectué ici : le client appelle ensuite
 * `sendInvoiceEmail` (fonction centrale) si l'utilisateur a choisi
 * « Créer et envoyer ».
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guard = await requirePermission(PERMISSIONS.MANAGE_INVOICES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const body = await request.json();
    const amount = Number(body?.amount);
    const customMessage = typeof body?.message === "string" ? body.message.trim() : "";
    const existingInvoiceId =
      typeof body?.invoiceId === "string" && body.invoiceId.trim() !== ""
        ? body.invoiceId.trim()
        : null;

    // Reprise après échec d'envoi : ne jamais recréer la facture.
    if (existingInvoiceId) {
      const { data: existing } = await supabase
        .from("documents")
        .select("id, numero")
        .eq("id", existingInvoiceId)
        .eq("user_id", guard.clubId)
        .eq("type", "invoice")
        .maybeSingle();

      if (existing?.id) {
        return NextResponse.json(
          {
            success: true,
            invoiceId: existing.id,
            invoiceNumber: existing.numero,
            alreadyExisted: true,
          },
          { status: 200 }
        );
      }
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const { data: reqData, error: reqError } = await supabase
      .from("buvette_requests")
      .select("id, status, first_name, last_name, email, reservation_date, event_type")
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .single();

    if (reqError || !reqData) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }
    if (reqData.status !== "accepted") {
      return NextResponse.json(
        { error: "Action disponible uniquement pour les réservations acceptées" },
        { status: 400 }
      );
    }
    if (!reqData.email) {
      return NextResponse.json(
        { error: "Email destinataire introuvable sur la réservation" },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("currency, currency_symbol")
      .eq("user_id", guard.clubId)
      .maybeSingle();

    if (profileError) {
      console.error("[API][buvette][send-invoice] Erreur profil:", profileError);
      return NextResponse.json(
        { error: "Erreur lors du chargement des paramètres" },
        { status: 500 }
      );
    }

    const currency = profile?.currency || "CHF";
    const currencySymbol = profile?.currency_symbol || getCurrencySymbol(currency);
    const formattedDate = new Date(reqData.reservation_date).toLocaleDateString("fr-CH");
    const todayIso = new Date().toISOString().split("T")[0];

    const year = new Date().getFullYear();
    const { count: invoiceCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", guard.clubId)
      .eq("type", "invoice")
      .gte("created_at", `${year}-01-01`)
      .lte("created_at", `${year}-12-31`);
    const invoiceNumber = `FAC-${year}-${String((invoiceCount ?? 0) + 1).padStart(3, "0")}`;

    const fullName = `${reqData.first_name} ${reqData.last_name}`.trim();
    let clientId: string | null = null;

    const { data: existingClientByEmail } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", guard.clubId)
      .eq("email", reqData.email)
      .limit(1)
      .maybeSingle();

    if (existingClientByEmail?.id) {
      clientId = existingClientByEmail.id;
    } else {
      const { data: createdClient, error: createClientError } = await supabase
        .from("clients")
        .insert({
          user_id: guard.clubId,
          name: fullName || reqData.email,
          email: reqData.email,
          role: "player",
        })
        .select("id")
        .single();

      if (createClientError || !createdClient?.id) {
        console.error("[API][buvette][send-invoice] Erreur création client:", createClientError);
        return NextResponse.json(
          { error: "Impossible de créer le client pour la facture" },
          { status: 500 }
        );
      }

      clientId = createdClient.id;
    }

    const lineDescription = `Location buvette - ${reqData.event_type} - ${formattedDate}`;
    const buvetteDocumentTitle = lineDescription.slice(0, DOCUMENT_TITLE_MAX_LENGTH);

    const notesParts = [
      `Facture générée depuis Buvette (request_id=${id})`,
      `Date de réservation: ${formattedDate}`,
      `Montant: ${amount.toFixed(2)} ${currencySymbol}`,
    ];
    if (customMessage) {
      notesParts.push(`Message: ${customMessage}`);
    }

    const buvetteLine = {
      id: `buvette-${id}`,
      designation: lineDescription,
      description: `Réservation buvette du ${formattedDate}`,
      quantite: 1,
      prixUnitaire: amount,
      tva: 0,
    };

    const { data: insertedInvoice, error: insertInvoiceError } = await supabase
      .from("documents")
      .insert({
        user_id: guard.clubId,
        client_id: clientId,
        type: "invoice",
        status: "brouillon",
        date_creation: todayIso,
        date_echeance: reqData.reservation_date,
        items: [buvetteLine],
        total_ht: amount,
        total_tva: 0,
        total_ttc: amount,
        numero: invoiceNumber,
        title: buvetteDocumentTitle,
        notes: notesParts.join("\n"),
      })
      .select("id")
      .single();

    if (insertInvoiceError || !insertedInvoice?.id) {
      console.error("[API][buvette][send-invoice] Erreur insertion facture:", insertInvoiceError);
      return NextResponse.json(
        {
          error: "Impossible d'enregistrer la facture en base",
          details: insertInvoiceError?.message || "Insertion échouée",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        invoiceId: insertedInvoice.id,
        invoiceNumber,
        alreadyExisted: false,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[API][buvette][send-invoice] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
