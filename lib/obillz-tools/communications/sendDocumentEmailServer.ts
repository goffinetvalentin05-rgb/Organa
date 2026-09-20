import { createAdminClient } from "@/lib/supabase/admin";
import { calculerTotalTTC } from "@/lib/utils/calculations";
import { resolveResendFromProfile } from "@/lib/email/resend-delivery";
import { resolveDocumentRecipient } from "@/lib/documents/recipient";
import { getDocumentPdfData } from "@/lib/utils/pdf-data";
import {
  renderInvoicePdfBuffer,
  renderQuotePdfBuffer,
} from "@/lib/pdf/renderDocumentPdf";
import { appBaseUrl } from "@/lib/payments/connect/stripe-client";
import { createMembershipPaymentToken } from "@/lib/quotes/membership-settings";
import { getErrorMessage } from "@/lib/utils/error-message";
import { ToolError } from "@/lib/obillz-tools/core/errors";

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "membre";
  const trimmed = fullName.trim();
  if (!trimmed) return "membre";
  return trimmed.split(/\s+/)[0] || "membre";
}

export type SendClubDocumentEmailResult = {
  success: true;
  emailId: string | null;
  to: string;
};

/**
 * Envoi serveur d’une cotisation ou facture. Le clubId doit déjà être autorisé.
 */
export async function sendClubDocumentEmail(params: {
  clubId: string;
  documentId: string;
  type: "cotisation" | "facture" | "devis";
}): Promise<SendClubDocumentEmailResult> {
  const admin = createAdminClient();
  const expectedType =
    params.type === "facture" ? "invoice" : "quote";
  const typeDoc = expectedType === "quote" ? "cotisation" : "facture";

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select(
      "company_name, company_email, company_phone, company_address, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled"
    )
    .eq("user_id", params.clubId)
    .maybeSingle();

  if (profileError) {
    throw new ToolError(
      "Erreur lors du chargement des paramètres",
      "EMAIL_PROFILE_FAILED",
      500
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
    throw new ToolError(
      "L'envoi d'emails n'est pas disponible. Vérifiez RESEND_API_KEY.",
      "EMAIL_NOT_CONFIGURED",
      503
    );
  }

  const { data: documentData, error: documentError } = await admin
    .from("documents")
    .select(
      "id, numero, title, type, items, notes, total_ttc, date_echeance, client_id, recipient_type, sponsor_contract_id, recipient_data, payment_method, payment_token, client:clients(id, nom, email, adresse), sponsor:sponsor_contracts(id, sponsor_name, title)"
    )
    .eq("id", params.documentId)
    .eq("user_id", params.clubId)
    .single();

  if (documentError || !documentData || documentData.type !== expectedType) {
    throw new ToolError(
      "Document ou client introuvable",
      "DOCUMENT_NOT_FOUND",
      404
    );
  }

  const parametres = {
    nomEntreprise: profile?.company_name || "",
    email: profile?.company_email || "",
    telephone: profile?.company_phone || "",
    adresse: profile?.company_address || "",
  };

  const clientRow = Array.isArray(documentData.client)
    ? documentData.client[0]
    : documentData.client;
  const sponsorRow = Array.isArray(documentData.sponsor)
    ? documentData.sponsor[0]
    : documentData.sponsor;
  const recipient = resolveDocumentRecipient({
    recipient_type: documentData.recipient_type,
    client_id: documentData.client_id,
    sponsor_contract_id: documentData.sponsor_contract_id,
    recipient_data: documentData.recipient_data,
    client: clientRow as Record<string, unknown> | null,
    sponsor: sponsorRow as Record<string, unknown> | null,
  });

  if (!recipient.email) {
    throw new ToolError(
      "Email du destinataire introuvable",
      "RECIPIENT_EMAIL_MISSING",
      404
    );
  }

  const docTitle = String(documentData.title || "").trim();
  const sujet =
    expectedType === "quote"
      ? `Ta cotisation n°${documentData.numero || ""}${docTitle ? ` — ${docTitle}` : ""} - ${parametres.nomEntreprise || "Obillz"}`
      : `Votre facture n°${documentData.numero || ""}${docTitle ? ` — ${docTitle}` : ""} - ${parametres.nomEntreprise || "Obillz"}`;

  const montant =
    typeof documentData.total_ttc === "number"
      ? documentData.total_ttc
      : Number(documentData.total_ttc) || calculerTotalTTC(documentData.items);
  const dateEcheance = documentData.date_echeance
    ? new Date(documentData.date_echeance).toLocaleDateString("fr-CH")
    : "Non définie";
  const clubName = parametres.nomEntreprise || "votre club";
  const montantFormate = `${montant.toFixed(2)} CHF`;
  const firstName = getFirstName(recipient.name);
  const numero = documentData.numero || "";
  const dueDateLine =
    dateEcheance !== "Non définie"
      ? `<p><strong>Date d'échéance :</strong> ${dateEcheance}</p>`
      : "";

  const isStripeQuote =
    expectedType === "quote" && documentData.payment_method === "stripe";
  let stripePayUrl: string | null = null;
  if (isStripeQuote) {
    let token =
      typeof documentData.payment_token === "string"
        ? documentData.payment_token
        : null;
    if (!token) {
      token = createMembershipPaymentToken();
      await admin
        .from("documents")
        .update({ payment_token: token })
        .eq("id", params.documentId)
        .eq("user_id", params.clubId);
    }
    stripePayUrl = `${appBaseUrl()}/cotisation/${token}`;
  }

  let pdfContentBase64: string;
  try {
    const pdfData = await getDocumentPdfData(params.documentId, expectedType, {
      dataUserId: params.clubId,
    });
    const pdfBuffer =
      expectedType === "quote"
        ? await renderQuotePdfBuffer(pdfData)
        : await renderInvoicePdfBuffer(pdfData);
    pdfContentBase64 = pdfBuffer.toString("base64");
  } catch (pdfError: unknown) {
    throw new ToolError(
      "Impossible de générer le PDF",
      "PDF_RENDER_FAILED",
      500
    );
  }

  const emailHtml = `<!DOCTYPE html><html><body>
    <p>Bonjour ${firstName},</p>
    <p>Tu trouveras en piece jointe ta ${typeDoc} n°<strong>${numero}</strong> pour <strong>${clubName}</strong>.</p>
    ${docTitle ? `<p><strong>Objet :</strong> ${docTitle}</p>` : ""}
    <p><strong>Montant total :</strong> ${montantFormate}</p>
    ${dueDateLine}
    ${
      stripePayUrl
        ? `<p><a href="${stripePayUrl}">Payer ma cotisation</a></p>`
        : ""
    }
    <p>A bientot !</p>
  </body></html>`;

  const { data, error } = await delivery.resend.emails.send({
    from: delivery.from,
    to: [recipient.email],
    subject: sujet,
    html: emailHtml,
    attachments: [
      {
        filename: `${typeDoc}-${numero || params.documentId}.pdf`,
        content: pdfContentBase64,
      },
    ],
  });

  if (error) {
    throw new ToolError(
      getErrorMessage(error) || "Erreur lors de l'envoi de l'email",
      "EMAIL_SEND_FAILED",
      500
    );
  }

  return { success: true, emailId: data?.id ?? null, to: recipient.email };
}
