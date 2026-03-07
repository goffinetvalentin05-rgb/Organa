import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { calculerTotalTTC } from "@/lib/utils/calculations";

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

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "membre";
  const trimmed = fullName.trim();
  if (!trimmed) return "membre";
  return trimmed.split(/\s+/)[0] || "membre";
}

/**
 * API Email - Envoi de devis et factures par email
 * 
 * CONFIGURATION REQUISE :
 * 1. Installer les dépendances : npm install resend
 * 2. Créer un compte sur https://resend.com
 * 3. Vérifier votre domaine dans Resend
 * 4. Obtenir votre clé API sur https://resend.com/api-keys
 * 5. Configurer la clé API dans Paramètres → Email → Clé API Resend
 * 
 * La clé API est stockée dans les paramètres de l'application (mock pour l'instant).
 * En production, vous devriez la stocker de manière sécurisée (variables d'environnement, base de données chiffrée).
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { type, documentId } = body; // type: 'devis' | 'facture', documentId: string
    if (!documentId || typeof documentId !== "string") {
      return NextResponse.json({ error: "documentId requis" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "company_name, company_email, company_phone, company_address, email_sender_name, email_sender_email, resend_api_key"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[API][email] Erreur profil:", profileError);
      return NextResponse.json(
        { error: "Erreur lors du chargement des paramètres" },
        { status: 500 }
      );
    }
    
    const parametres = {
      nomEntreprise: profile?.company_name || "",
      email: profile?.company_email || "",
      telephone: profile?.company_phone || "",
      adresse: profile?.company_address || "",
      nomExpediteur: profile?.email_sender_name || "",
      emailExpediteur: profile?.email_sender_email || "",
      resendApiKey: profile?.resend_api_key || process.env.RESEND_API_KEY || "",
    };
    
    if (!parametres.resendApiKey) {
      console.error("[API][email] Clé Resend absente (profil + env)");
      return NextResponse.json(
        { error: "Clé API Resend non configurée. Veuillez la configurer dans les paramètres." },
        { status: 400 }
      );
    }

    // Initialiser Resend avec la clé API des paramètres
    const resendInstance = new Resend(parametres.resendApiKey);

    let typeDoc: string;
    let expectedType: "quote" | "invoice";

    if (type === "devis" || type === "cotisation") {
      expectedType = "quote";
      typeDoc = "cotisation";
    } else if (type === "facture") {
      expectedType = "invoice";
      typeDoc = "facture";
    } else {
      return NextResponse.json({ error: "Type de document invalide" }, { status: 400 });
    }

    const { data: documentData, error: documentError } = await supabase
      .from("documents")
      .select(
        "id, numero, type, items, notes, total_ttc, date_echeance, client:clients(id, nom, email, adresse)"
      )
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (documentError || !documentData || documentData.type !== expectedType) {
      console.error("[API][email] Document introuvable:", documentError);
      return NextResponse.json({ error: "Document ou client introuvable" }, { status: 404 });
    }

    const document = documentData;
    const sujet =
      expectedType === "quote"
        ? `Ta cotisation n°${document.numero || ""} - ${parametres.nomEntreprise || "Obillz"}`
        : `Votre facture n°${document.numero || ""} - ${parametres.nomEntreprise || "Obillz"}`;

    const client = Array.isArray(document.client)
      ? document.client[0]
      : document.client;

    if (!client?.email) {
      return NextResponse.json({ error: "Email du client introuvable" }, { status: 404 });
    }

    const clientEmail = client.email;
    const clientNom = client.nom || "Membre";
    const firstName = getFirstName(clientNom);
    const numero = document.numero || "";
    const montant =
      typeof document.total_ttc === "number"
        ? document.total_ttc
        : Number(document.total_ttc) || calculerTotalTTC(document.items);
    const dateEcheance = document.date_echeance
      ? new Date(document.date_echeance).toLocaleDateString("fr-CH")
      : "Non définie";

    const senderEmail = (
      parametres.emailExpediteur ||
      process.env.RESEND_FROM_EMAIL ||
      "onboarding@resend.dev"
    ).trim();

    if (!senderEmail) {
      console.error("[API][email] Expéditeur manquant");
      return NextResponse.json(
        { error: "Email expéditeur manquant. Configurez un expéditeur dans Paramètres." },
        { status: 400 }
      );
    }

    const from = parametres.nomExpediteur
      ? `${parametres.nomExpediteur} <${senderEmail}>`
      : senderEmail;

    const clubName = parametres.nomEntreprise || "votre club";
    const montantFormate = `${montant.toFixed(2)} CHF`;
    const dueDateLine =
      dateEcheance !== "Non définie"
        ? `<p><strong>Date d'échéance :</strong> ${dateEcheance}</p>`
        : "";

    const baseUrl = new URL(request.url).origin;
    const pdfPath =
      expectedType === "quote"
        ? `/api/pdf/devis/download?id=${documentId}`
        : `/api/pdf/facture/download?id=${documentId}`;
    const pdfUrl = `${baseUrl}${pdfPath}`;

    const pdfResponse = await fetch(pdfUrl, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    });

    if (!pdfResponse.ok) {
      const pdfError = await pdfResponse.text();
      console.error("[API][email] Erreur génération PDF joint:", {
        status: pdfResponse.status,
        statusText: pdfResponse.statusText,
        pdfUrl,
        error: pdfError,
      });
      return NextResponse.json(
        { error: "Impossible de générer le PDF de la cotisation" },
        { status: 500 }
      );
    }

    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfContentBase64 = Buffer.from(pdfArrayBuffer).toString("base64");
    const pdfFilename = `${typeDoc}-${numero || documentId}.pdf`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7C5CFF 0%, #8B5CF6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f0f0f0; padding: 10px; text-align: left; font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
            .button { display: inline-block; padding: 12px 24px; background: #7C5CFF; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${clubName}</h1>
            </div>
            <div class="content">
              ${
                expectedType === "quote"
                  ? `<p>Bonjour ${firstName},</p>
              <p>Tu trouveras en piece jointe ta cotisation n°<strong>${numero}</strong> pour <strong>${clubName}</strong>.</p>
              <p><strong>Montant total :</strong> ${montantFormate}</p>
              <p><strong>Membre :</strong> ${clientNom}</p>
              ${dueDateLine}
              <p>Si tu as la moindre question, n'hesite pas a nous contacter.</p>
              <p>A bientot !</p>`
                  : `<p>Bonjour ${firstName},</p>
              <p>Tu trouveras en piece jointe ta facture n°<strong>${numero}</strong> pour <strong>${clubName}</strong>.</p>
              <p><strong>Montant total :</strong> ${montantFormate}</p>
              <p><strong>Membre :</strong> ${clientNom}</p>
              ${dueDateLine}
              <p>Si tu as la moindre question, n'hesite pas a nous contacter.</p>
              <p>A bientot !</p>`
              }
            </div>
          </div>
        </body>
      </html>
    `;

    // Envoyer l'email via Resend
    const { data, error } = await resendInstance.emails.send({
      from,
      to: [clientEmail],
      subject: sujet,
      html: emailHtml,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfContentBase64,
        },
      ],
    });

    if (error) {
      const resendMessage = getErrorMessage(error);
      const resendName =
        error && typeof error === "object" && "name" in error
          ? String((error as { name?: unknown }).name || "")
          : "";
      console.error("[API][email] Erreur Resend:", {
        message: resendMessage,
        name: resendName,
        from,
        to: clientEmail,
        documentId,
        type,
      });
      return NextResponse.json(
        {
          error: "Erreur lors de l'envoi de l'email",
          details: resendMessage || "Erreur Resend inconnue",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email envoyé avec succès",
      emailId: data?.id 
    });
  } catch (error: unknown) {
    console.error("Erreur API email:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

