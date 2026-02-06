import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { calculerTotalTTC } from "@/lib/utils/calculations";

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
      resendApiKey: profile?.resend_api_key || "",
    };
    
    if (!parametres.resendApiKey) {
      return NextResponse.json(
        { error: "Clé API Resend non configurée. Veuillez la configurer dans les paramètres." },
        { status: 400 }
      );
    }

    // Initialiser Resend avec la clé API des paramètres
    const resendInstance = new Resend(parametres.resendApiKey);

    let document: any;
    let clientEmail: string;
    let numero: string;
    let montant: number;
    let sujet: string;
    let typeDoc: string;
    let expectedType: "quote" | "invoice";

    if (type === "devis") {
      expectedType = "quote";
      typeDoc = "devis";
    } else if (type === "facture") {
      expectedType = "invoice";
      typeDoc = "facture";
    } else {
      return NextResponse.json({ error: "Type de document invalide" }, { status: 400 });
    }

    const { data: documentData, error: documentError } = await supabase
      .from("documents")
      .select(
        "id, numero, type, items, notes, total_ttc, client:clients(id, nom, email, adresse)"
      )
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (documentError || !documentData || documentData.type !== expectedType) {
      console.error("[API][email] Document introuvable:", documentError);
      return NextResponse.json({ error: "Document ou client introuvable" }, { status: 404 });
    }

    document = documentData;
    sujet = `Votre ${typeDoc} Obillz n°${document.numero || ""}`;

    const client = Array.isArray(document.client)
      ? document.client[0]
      : document.client;

    if (!client?.email) {
      return NextResponse.json({ error: "Email du client introuvable" }, { status: 404 });
    }

    clientEmail = client.email;
    numero = document.numero || "";
    montant =
      typeof document.total_ttc === "number"
        ? document.total_ttc
        : Number(document.total_ttc) || calculerTotalTTC(document.items);

    // Construire le corps de l'email
    const lignesHtml = (Array.isArray(document.items) ? document.items : [])
      .map(
        (ligne: any) => {
          const sousTotal = (ligne.quantite || 0) * (ligne.prixUnitaire || 0);
          return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold;">${ligne.designation || ""}</div>
          ${ligne.description ? `<div style="font-size: 0.9em; color: #666; margin-top: 4px; white-space: pre-line;">${ligne.description}</div>` : ""}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${ligne.quantite || 0}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(ligne.prixUnitaire || 0).toFixed(2)} CHF</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${sousTotal.toFixed(2)} CHF</td>
      </tr>
    `;
        }
      )
      .join("");

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
              <h1>${parametres.nomEntreprise}</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Vous trouverez ci-dessous votre ${typeDoc} n°<strong>${numero}</strong>.</p>
              
              <table>
                <thead>
                  <tr>
                    <th>Désignation</th>
                    <th style="text-align: right;">Quantité</th>
                    <th style="text-align: right;">Prix unitaire</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${lignesHtml}
                </tbody>
              </table>
              
              <div class="total">
                Total TTC: ${montant.toFixed(2)} CHF
              </div>
              
              ${document.notes ? `<p><strong>Notes:</strong> ${document.notes}</p>` : ""}
              
              <p>Cordialement,<br>${parametres.nomEntreprise}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Envoyer l'email via Resend
    const { data, error } = await resendInstance.emails.send({
      from: parametres.nomExpediteur 
        ? `${parametres.nomExpediteur} <${parametres.emailExpediteur || parametres.email}>`
        : parametres.emailExpediteur || parametres.email,
      to: [clientEmail],
      subject: sujet,
      html: emailHtml,
    });

    if (error) {
      console.error("Erreur Resend:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email envoyé avec succès",
      emailId: data?.id 
    });
  } catch (error: any) {
    console.error("Erreur API email:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}

