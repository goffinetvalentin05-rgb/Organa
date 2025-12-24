import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { parametresAPI, devisAPI, facturesAPI, calculerTotalTTC } from "@/lib/mock-data";

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
    const body = await request.json();
    const { type, documentId } = body; // type: 'devis' | 'facture', documentId: string

    // Récupérer les paramètres email
    const parametres = parametresAPI.get();
    
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

    if (type === "devis") {
      document = devisAPI.getById(documentId);
      typeDoc = "devis";
      sujet = `Votre devis Organa n°${document?.numero || ""}`;
    } else if (type === "facture") {
      document = facturesAPI.getById(documentId);
      typeDoc = "facture";
      sujet = `Votre facture Organa n°${document?.numero || ""}`;
    } else {
      return NextResponse.json({ error: "Type de document invalide" }, { status: 400 });
    }

    if (!document || !document.client) {
      return NextResponse.json({ error: "Document ou client introuvable" }, { status: 404 });
    }

    clientEmail = document.client.email;
    numero = document.numero;
    montant = calculerTotalTTC(document.lignes);

    // Construire le corps de l'email
    const lignesHtml = document.lignes
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

