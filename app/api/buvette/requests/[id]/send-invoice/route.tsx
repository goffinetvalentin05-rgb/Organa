import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { FacturePdf } from "@/lib/pdf/FacturePdf";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { resolveResendFromProfile } from "@/lib/email/resend-delivery";

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

async function fetchImageAsDataUrl(url: string): Promise<string | undefined> {
  try {
    if (!url.startsWith("https://")) return undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "image/*" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return undefined;
    const contentType = response.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) return undefined;

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength) return undefined;

    return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body?.amount);
    const customMessage = typeof body?.message === "string" ? body.message.trim() : "";
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const { data: reqData, error: reqError } = await supabase
      .from("buvette_requests")
      .select("id, status, first_name, last_name, email, reservation_date, event_type")
      .eq("id", id)
      .eq("user_id", user.id)
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
      .select(
        "company_name, company_email, company_phone, company_address, logo_url, logo_path, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, resend_api_key, email_custom_enabled, email_sender_name, email_sender_email"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[API][buvette][send-invoice] Erreur profil:", profileError);
      return NextResponse.json(
        { error: "Erreur lors du chargement des paramètres" },
        { status: 500 }
      );
    }

    const delivery = resolveResendFromProfile({
      company_name: profile?.company_name,
      company_email: profile?.company_email,
      email_sender_name: profile?.email_sender_name,
      email_sender_email: profile?.email_sender_email,
      resend_api_key: profile?.resend_api_key,
      email_custom_enabled: profile?.email_custom_enabled,
    });
    if (!delivery) {
      console.error("[API][buvette][send-invoice] Aucune configuration Resend utilisable");
      return NextResponse.json(
        {
          error:
            "L'envoi d'emails n'est pas disponible. Vérifiez la clé Resend côté serveur ou le mode expéditeur avancé.",
        },
        { status: 503 }
      );
    }
    const resendInstance = delivery.resend;
    const fromEmail = delivery.from;

    let logoSourceUrl: string | undefined;
    if (profile?.logo_url) {
      logoSourceUrl = profile.logo_url;
    } else if (profile?.logo_path) {
      const { data: urlData } = supabase.storage
        .from("Logos")
        .getPublicUrl(profile.logo_path);
      logoSourceUrl = urlData.publicUrl;
    }
    const logoUrl = logoSourceUrl ? await fetchImageAsDataUrl(logoSourceUrl) : undefined;

    const currency = profile?.currency || "CHF";
    const currencySymbol = profile?.currency_symbol || getCurrencySymbol(currency);
    const formattedDate = new Date(reqData.reservation_date).toLocaleDateString("fr-CH");
    const todayIso = new Date().toISOString().split("T")[0];
    const formattedAmount = amount.toFixed(2);

    // Générer un numéro de facture au même format que le module Factures: FAC-YYYY-XXX
    const year = new Date().getFullYear();
    const { count: invoiceCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "invoice")
      .gte("created_at", `${year}-01-01`)
      .lte("created_at", `${year}-12-31`);
    const invoiceNumber = `FAC-${year}-${String((invoiceCount ?? 0) + 1).padStart(3, "0")}`;

    // Créer/récupérer un client pour rattacher la facture dans le module Factures
    const fullName = `${reqData.first_name} ${reqData.last_name}`.trim();
    let clientId: string | null = null;

    const { data: existingClientByEmail } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .eq("email", reqData.email)
      .limit(1)
      .maybeSingle();

    if (existingClientByEmail?.id) {
      clientId = existingClientByEmail.id;
    } else {
      const { data: createdClient, error: createClientError } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
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

    const pdfBuffer = await renderToBuffer(
      <FacturePdf
        company={{
          name: profile?.company_name || "Club",
          address: profile?.company_address || "",
          email: profile?.company_email || "",
          phone: profile?.company_phone || "",
          logoUrl,
          iban: profile?.iban || "",
          bankName: profile?.bank_name || "",
          conditionsPaiement: profile?.payment_terms || "",
        }}
        client={{
          name: `${reqData.first_name} ${reqData.last_name}`.trim(),
          email: reqData.email,
          address: "",
        }}
        document={{
          number: invoiceNumber,
          date: todayIso,
          dueDate: reqData.reservation_date,
          currency,
          currencySymbol,
          vatRate: 0,
          notes: `Date de réservation: ${formattedDate}`,
        }}
        lines={[
          {
            label: `Location buvette - ${reqData.event_type}`,
            qty: 1,
            unitPrice: amount,
            total: amount,
            vat: 0,
          },
        ]}
        totals={{
          subtotal: amount,
          vat: 0,
          total: amount,
        }}
        primaryColor={profile?.primary_color || "#1D4ED8"}
      />
    );

    const defaultMessage = `Bonjour ${reqData.first_name},

Suite à la validation de ta réservation de la buvette
pour le ${formattedDate}, tu trouveras en pièce jointe ta facture.

N'hésite pas à nous contacter si tu as des questions.
À bientôt !`;
    const finalTextMessage = customMessage || defaultMessage;
    const finalHtmlMessage = finalTextMessage.replace(/\n/g, "<br/>");
    const filename = `facture-buvette-${invoiceNumber}.pdf`;
    const lineDescription = `Location buvette - ${reqData.event_type} - ${formattedDate}`;

    const { data, error } = await resendInstance.emails.send({
      from: fromEmail,
      to: [reqData.email],
      subject: `Facture - Réservation buvette du ${reqData.reservation_date}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <div>${finalHtmlMessage}</div>
          <p style="margin-top: 12px;"><strong>Montant :</strong> ${formattedAmount} ${currencySymbol}</p>
        </div>
      `,
      text: `${finalTextMessage}\n\nMontant : ${formattedAmount} ${currencySymbol}`,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBuffer).toString("base64"),
        },
      ],
    });

    if (error) {
      const resendMessage = getErrorMessage(error);
      const resendName =
        error && typeof error === "object" && "name" in error
          ? String((error as { name?: unknown }).name || "")
          : "";
      console.error("[API][buvette][send-invoice] Erreur Resend:", {
        message: resendMessage,
        name: resendName,
        mode: delivery.mode,
        to: reqData.email,
        requestId: id,
      });
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de la facture", details: resendMessage },
        { status: 500 }
      );
    }

    // Enregistrer la facture dans la table documents (module Factures)
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
        user_id: user.id,
        client_id: clientId,
        type: "invoice",
        status: "envoye",
        date_creation: todayIso,
        date_echeance: reqData.reservation_date,
        items: [buvetteLine],
        total_ht: amount,
        total_tva: 0,
        total_ttc: amount,
        numero: invoiceNumber,
        notes: `Facture générée depuis Buvette (request_id=${id})`,
      })
      .select("id")
      .single();

    if (insertInvoiceError || !insertedInvoice?.id) {
      console.error("[API][buvette][send-invoice] Erreur insertion facture:", insertInvoiceError);
      return NextResponse.json(
        {
          error: "Email envoyé mais impossible d'enregistrer la facture en base",
          details: insertInvoiceError?.message || "Insertion échouée",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email envoyé avec succès",
        emailId: data?.id,
        invoiceId: insertedInvoice.id,
        invoiceNumber,
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

