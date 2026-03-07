import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

export const runtime = "nodejs";

const FROM_EMAIL = "noreply@obillz.com";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name")
      .eq("user_id", user.id)
      .maybeSingle();

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

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY non configurée sur le serveur" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const filename = `facture-buvette-${reqData.reservation_date}.pdf`;
    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [reqData.email],
      subject: `Facture - Réservation buvette du ${reqData.reservation_date}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Bonjour ${reqData.first_name},</p>
          <p>
            Suite à la validation de ta réservation de la buvette
            pour le ${formattedDate}, tu trouveras en pièce jointe ta facture
            d'un montant de ${formattedAmount} CHF.
          </p>
          <p>N'hésite pas à nous contacter si tu as des questions.</p>
          <p>À bientôt !</p>
        </div>
      `,
      text: `Bonjour ${reqData.first_name},

Suite à la validation de ta réservation de la buvette pour le ${formattedDate},
tu trouveras en pièce jointe ta facture d'un montant de ${formattedAmount} CHF.

N'hésite pas à nous contacter si tu as des questions.
À bientôt !`,
      attachments: [
        {
          filename,
          content: Buffer.from(invoicePdf).toString("base64"),
        },
      ],
    });

    if (sendError) {
      console.error("[API][buvette][send-invoice] Erreur Resend:", {
        requestId: id,
        email: reqData.email,
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

