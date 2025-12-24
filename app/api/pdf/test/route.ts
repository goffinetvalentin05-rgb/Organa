import { NextResponse } from "next/server";
import { chromium } from "playwright";

// Forcer le runtime Node.js (pas Edge)
export const runtime = "nodejs";

export async function GET() {
  try {
    // Lancer le navigateur Chromium
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Obtenir la date du jour au format français
    const dateDuJour = new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Créer le contenu HTML simple
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            h1 {
              color: #333;
              margin: 0;
            }
            p {
              color: #666;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <h1>Organa PDF OK</h1>
          <p>${dateDuJour}</p>
        </body>
      </html>
    `;

    // Charger le contenu HTML dans la page
    await page.setContent(htmlContent, { waitUntil: "networkidle" });

    // Générer le PDF avec les spécifications demandées
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm",
      },
      printBackground: true,
    });

    // Fermer le navigateur
    await browser.close();

    // Retourner le PDF avec les en-têtes appropriés
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la génération du PDF:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF", details: error.message },
      { status: 500 }
    );
  }
}

