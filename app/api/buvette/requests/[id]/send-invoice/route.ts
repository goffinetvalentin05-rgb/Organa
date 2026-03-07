import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

export const runtime = "nodejs";

const FROM_EMAIL = "noreply@obillz.com";
const RESEND_TIMEOUT_MS = 20000;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur serveur";
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 12, fontFamily: "Helvetica" },
  title: { fontSize: 20, marginBottom: 16, fontWeight: 700 },
  section: { marginBottom: 10 },
  label: { fontWeight: 700 },
  amount: { fontSize: 16, marginTop: 10, fontWeight: 700 },
  footer: { marginTop: 26, color: "#555" },
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
      .select("company_name, company_email, email_sender_name, email_sender_email, resend_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[API][buvette][send-invoice] Erreur profil:", profileError);
      return NextResponse.json(
        { error: "Erreur lors du chargement des paramètres" },
        { status: 500 }
      );
    }

    const clubName = profile?.company_name || "Club";
    const formattedDate = new Date(reqData.reservation_date).toLocaleDateString("fr-CH");
    const formattedAmount = amount.toFixed(2);

    const invoicePdf = await renderToBuffer(
      React.createElement(
        Document,
        null,
        React.createElement(
          Page,
          { size: "A4", style: styles.page },
          React.createElement(Text, { style: styles.title }, "Facture - Réservation buvette"),
          React.createElement(
            View,
            { style: styles.section },
            React.createElement(
              Text,
              null,
              React.createElement(Text, { style: styles.label }, "Client : "),
              `${reqData.first_name} ${reqData.last_name}`
            )
          ),
          React.createElement(
            View,
            { style: styles.section },
            React.createElement(
              Text,
              null,
              React.createElement(Text, { style: styles.label }, "Date de réservation : "),
              formattedDate
            )
          ),
          React.createElement(
            View,
            { style: styles.section },
            React.createElement(
              Text,
              null,
              React.createElement(Text, { style: styles.label }, "Type de réservation : "),
              reqData.event_type
            )
          ),
          React.createElement(
            View,
            { style: styles.section },
            React.createElement(
              Text,
              null,
              React.createElement(Text, { style: styles.label }, "Club : "),
              clubName
            )
          ),
          React.createElement(Text, { style: styles.amount }, `Montant total : ${formattedAmount} CHF`),
          React.createElement(
            Text,
            { style: styles.footer },
            "Merci pour votre réservation. Pour toute question, contactez le club."
          )
        )
      )
    );

    const parametres = {
      resendApiKey: profile?.resend_api_key || process.env.RESEND_API_KEY || "",
    };

    if (!parametres.resendApiKey) {
      console.error("[API][buvette][send-invoice] Clé Resend absente (profil + env)");
      return NextResponse.json(
        { error: "RESEND_API_KEY non configurée sur le serveur" },
        { status: 500 }
      );
    }

    const resendInstance = new Resend(parametres.resendApiKey);
    const filename = `facture-buvette-${reqData.reservation_date}.pdf`;
    const defaultMessage = `Bonjour ${reqData.first_name},

Suite à la validation de ta réservation de la buvette
pour le ${formattedDate}, tu trouveras en pièce jointe ta facture.

N'hésite pas à nous contacter si tu as des questions.
À bientôt !`;

    const finalTextMessage = customMessage || defaultMessage;
    const finalHtmlMessage = finalTextMessage.replace(/\n/g, "<br/>");

    const sendResult = await Promise.race([
      resendInstance.emails.send({
        from: FROM_EMAIL,
        to: [reqData.email],
        subject: `Facture - Réservation buvette du ${reqData.reservation_date}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <div>${finalHtmlMessage}</div>
            <p style="margin-top:12px;"><strong>Montant :</strong> ${formattedAmount} CHF</p>
          </div>
        `,
        text: `${finalTextMessage}\n\nMontant : ${formattedAmount} CHF`,
        attachments: [
          {
            filename,
            content: Buffer.from(invoicePdf).toString("base64"),
          },
        ],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout envoi email Resend")), RESEND_TIMEOUT_MS)
      ),
    ]);

    const sendError =
      sendResult && typeof sendResult === "object" && "error" in sendResult
        ? (sendResult as { error?: { message?: string } }).error
        : undefined;

    if (sendError) {
      console.error("[API][buvette][send-invoice] Erreur Resend:", {
        requestId: id,
        to: reqData.email,
        from: FROM_EMAIL,
        message: sendError.message,
      });
      return NextResponse.json(
        { error: `Erreur lors de l'envoi de la facture: ${sendError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("[API][buvette][send-invoice] Erreur inattendue:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

