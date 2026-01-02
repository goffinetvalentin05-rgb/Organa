import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculerTotalHT, calculerTVA, calculerTotalTTC, LigneDocument } from "@/lib/utils/calculations";
import { getCompanySettings } from "@/lib/utils/company-settings";

// Forcer le runtime Node.js (pas Edge)
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    console.log("[DEBUG PDF] ===== DÉBUT REQUÊTE PDF =====");
    
    // Dans Next.js 16, params peut être une Promise
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    console.log("[DEBUG PDF] ID du document:", id);

    if (!id) {
      console.log("[DEBUG PDF] ERREUR: ID manquant");
      return NextResponse.json(
        { error: "DEBUG: ID du document requis" },
        { status: 400 }
      );
    }

    // MODE DEBUG: Utiliser UNIQUEMENT le client admin (bypass RLS)
    console.log("[DEBUG PDF] Création du client Supabase admin...");
    const supabaseAdmin = createAdminClient();
    console.log("[DEBUG PDF] Client admin créé");

    // MODE DEBUG: Récupérer le document de la manière la plus simple possible
    console.log("[DEBUG PDF] Récupération du document avec select(*)...");
    const { data: document, error: docError } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (docError || !document) {
      console.error("[DEBUG PDF] ERREUR: Document introuvable", {
        id,
        error: docError?.message,
        code: docError?.code,
      });
      return NextResponse.json(
        { error: "DEBUG: document introuvable", details: docError?.message },
        { status: 404 }
      );
    }

    console.log("[DEBUG PDF] Document trouvé:", {
      id: document.id,
      numero: document.numero,
      type: document.type,
      client_id: document.client_id,
    });

    // Récupérer le client
    console.log("[DEBUG PDF] Récupération du client...");
    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("id", document.client_id)
      .single();

    if (clientError || !client) {
      console.error("[DEBUG PDF] ERREUR: Client introuvable", {
        client_id: document.client_id,
        error: clientError?.message,
      });
      return NextResponse.json(
        { error: "DEBUG: client introuvable", details: clientError?.message },
        { status: 404 }
      );
    }

    console.log("[DEBUG PDF] Client trouvé:", client.nom);

    // Récupérer le profil pour les settings (utiliser le user_id du document)
    console.log("[DEBUG PDF] Récupération du profil...");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", document.user_id)
      .maybeSingle();

    console.log("[DEBUG PDF] Profil récupéré:", profile ? "Oui" : "Non (valeurs par défaut)");

    // Formater les données pour le PDF
    const lignes = (document.items || []) as LigneDocument[];
    const subtotal = document.total_ht ?? calculerTotalHT(lignes);
    const vat = document.total_tva ?? calculerTVA(lignes);
    const total = document.total_ttc ?? calculerTotalTTC(lignes);
    const vatRate = lignes.length > 0 && lignes[0]?.tva ? lignes[0].tva : 0;

    // Settings de l'entreprise
    const rawSettings = {
      primary_color: profile?.primary_color,
      currency: profile?.currency,
      currency_symbol: profile?.currency_symbol,
    };
    const companySettings = getCompanySettings(rawSettings);

    // Logo URL
    let logoUrl: string | null = null;
    if (profile?.logo_url) {
      logoUrl = profile.logo_url;
    } else if (profile?.logo_path) {
      const { data: urlData } = supabaseAdmin.storage
        .from("Logos")
        .getPublicUrl(profile.logo_path);
      logoUrl = urlData.publicUrl;
    }

    // Préparer les données du document
    const documentData = {
      company: {
        name: profile?.company_name || "Entreprise",
        address: profile?.company_address || "",
        email: profile?.company_email || "",
        phone: profile?.company_phone || "",
        logoUrl: logoUrl,
      },
      client: {
        name: client.nom,
        address: client.adresse || "",
        email: client.email || "",
      },
      document: {
        number: document.numero,
        date: document.date_creation,
        dueDate: document.date_echeance || undefined,
        currency: companySettings.currency,
        vatRate: vatRate,
        notes: document.notes || undefined,
        type: document.type as "invoice" | "quote",
      },
      lines: lignes.map((ligne) => ({
        label: ligne.designation,
        description: ligne.description || undefined,
        qty: ligne.quantite,
        unitPrice: ligne.prixUnitaire,
        total: ligne.quantite * ligne.prixUnitaire,
        vat: ligne.tva || 0,
      })),
      totals: {
        subtotal: subtotal,
        vat: vat,
        total: total,
      },
    };

    console.log("[DEBUG PDF] Données préparées, lancement de la génération PDF...");

    // Lancer le navigateur Chromium
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Formater les montants
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: companySettings.currency,
      }).format(amount);
    };

    // Formater les dates
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    // Construire l'URL du logo
    let logoHtml = "";
    if (documentData.company.logoUrl) {
      const host = request.headers.get("host") || "localhost:3000";
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      let logoUrl = documentData.company.logoUrl;

      if (!logoUrl.startsWith("http")) {
        logoUrl = logoUrl.startsWith("/")
          ? `${protocol}://${host}${logoUrl}`
          : `${protocol}://${host}/${logoUrl}`;
      }

      logoHtml = `<img src="${logoUrl}" alt="Logo" style="max-height: 180px; max-width: 500px; object-fit: contain; display: block;" />`;
    }

    // Type de document en français
    const documentTypeLabel = documentData.document.type === "invoice" ? "FACTURE" : "DEVIS";
    const primaryColor = companySettings.primary_color;
    const currencySymbol = companySettings.currency_symbol;

    // Construire le HTML du PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              size: A4;
              margin: 12mm;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #333;
              background: white;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 25px;
              padding-bottom: 20px;
              border-bottom: 2px solid ${primaryColor};
              gap: 25px;
            }
            
            .logo-section {
              flex: 0 0 auto;
              min-width: 0;
              max-width: 50%;
              display: flex;
              align-items: flex-start;
            }
            
            .company-info {
              flex: 1;
              text-align: right;
              min-width: 0;
            }
            
            .company-name {
              font-size: 20pt;
              font-weight: bold;
              color: ${primaryColor};
              margin-bottom: 8px;
            }
            
            .company-details {
              font-size: 9pt;
              color: #666;
              line-height: 1.6;
            }
            
            .document-type {
              font-size: 24pt;
              font-weight: bold;
              color: ${primaryColor};
              margin-top: 15px;
              margin-bottom: 10px;
              clear: both;
            }
            
            .document-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            
            .info-block {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 4px;
            }
            
            .info-block h3 {
              font-size: 10pt;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 8px;
              font-weight: 600;
            }
            
            .info-block p {
              font-size: 10pt;
              color: #333;
              margin: 4px 0;
            }
            
            .lines-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              table-layout: fixed;
            }
            
            .lines-table thead {
              background: ${primaryColor};
              color: white;
            }
            
            .lines-table th {
              padding: 12px 8px;
              text-align: left;
              font-size: 9pt;
              font-weight: 600;
              text-transform: uppercase;
            }
            
            .lines-table th.text-right {
              text-align: right;
            }
            
            .lines-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #e0e0e0;
              font-size: 10pt;
              word-wrap: break-word;
              overflow-wrap: break-word;
              vertical-align: top;
            }
            
            .line-main-row td {
              padding-bottom: 0;
            }
            
            .line-title {
              font-weight: bold;
              margin-bottom: 0;
              padding-bottom: 0;
              line-height: 1.2;
              display: inline-block;
            }
            
            .line-description-row {
              background: #f8f9fa;
              border-bottom: 1px solid #e0e0e0;
              margin-top: 0;
              margin-bottom: 0;
              padding-top: 0;
            }
            
            .line-description-cell {
              padding: 0 8px 4px 8px;
              font-size: 9pt;
              color: #666;
              line-height: 1.3;
              word-wrap: break-word;
              overflow-wrap: break-word;
              word-break: break-word;
              white-space: pre-wrap;
              max-width: 100%;
              box-sizing: border-box;
              margin-top: 0;
              margin-bottom: 0;
              padding-top: 0;
            }
            
            .lines-table td.text-right {
              text-align: right;
            }
            
            .totals {
              margin-top: 20px;
              margin-left: auto;
              width: 300px;
            }
            
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 10pt;
            }
            
            .totals-row.subtotal,
            .totals-row.vat {
              color: #666;
            }
            
            .totals-row.total {
              font-size: 14pt;
              font-weight: bold;
              color: ${primaryColor};
              border-top: 2px solid ${primaryColor};
              padding-top: 12px;
              margin-top: 8px;
            }
            
            .notes {
              margin-top: 30px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 4px;
              font-size: 10pt;
              color: #333;
            }
            
            .notes h3 {
              font-size: 10pt;
              color: #666;
              margin-bottom: 8px;
              font-weight: 600;
            }
            
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              
              .lines-table thead {
                background: ${primaryColor} !important;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <div class="logo-section">
              ${logoHtml}
            </div>
            <div class="company-info">
              <div class="company-name">${documentData.company.name}</div>
              <div class="company-details">
                ${(documentData.company.address || "").replace(/\n/g, "<br>")}<br>
                ${documentData.company.email}<br>
                ${documentData.company.phone}
              </div>
            </div>
          </div>
          
          <!-- Document Type and Number -->
          <div class="document-type">${documentTypeLabel}</div>
          <div style="font-size: 12pt; color: #666; margin-bottom: 30px;">
            N° ${documentData.document.number}
          </div>
          
          <!-- Client and Document Info -->
          <div class="document-info">
            <div class="info-block">
              <h3>Facturer à</h3>
              <p style="font-weight: 600; margin-bottom: 4px;">${documentData.client.name}</p>
              <p>${(documentData.client.address || "").replace(/\n/g, "<br>")}</p>
              <p style="margin-top: 8px;">${documentData.client.email}</p>
            </div>
            <div class="info-block">
              <h3>Informations</h3>
              <p><strong>Date:</strong> ${formatDate(documentData.document.date)}</p>
              ${documentData.document.dueDate ? `<p><strong>Date d'échéance:</strong> ${formatDate(documentData.document.dueDate)}</p>` : ""}
              <p><strong>Devise:</strong> ${currencySymbol}</p>
            </div>
          </div>
          
          <!-- Lines Table -->
          <table class="lines-table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th class="text-right">Qté</th>
                <th class="text-right">Prix unitaire</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${documentData.lines
                .map(
                  (line) => {
                    const mainRow = `
                <tr class="${line.description ? 'line-main-row' : ''}">
                  <td>
                    <div class="line-title">${line.label}</div>
                  </td>
                  <td class="text-right">${line.qty}</td>
                  <td class="text-right">${formatCurrency(line.unitPrice)}</td>
                  <td class="text-right">${formatCurrency(line.total)}</td>
                </tr>`;
                    const descriptionRow = line.description ? `
                <tr class="line-description-row">
                  <td colspan="4" class="line-description-cell">
                    ${line.description.replace(/\n/g, "<br>")}
                  </td>
                </tr>` : "";
                    return mainRow + descriptionRow;
                  }
                )
                .join("")}
            </tbody>
          </table>
          
          <!-- Totals -->
          <div class="totals">
            <div class="totals-row subtotal">
              <span>Sous-total HT:</span>
              <span>${formatCurrency(documentData.totals.subtotal)}</span>
            </div>
            <div class="totals-row vat">
              <span>TVA (${documentData.document.vatRate}%):</span>
              <span>${formatCurrency(documentData.totals.vat)}</span>
            </div>
            <div class="totals-row total">
              <span>Total TTC:</span>
              <span>${formatCurrency(documentData.totals.total)}</span>
            </div>
          </div>
          
          <!-- Notes -->
          ${documentData.document.notes ? `
            <div class="notes">
              <h3>Notes</h3>
              <p>${documentData.document.notes.replace(/\n/g, "<br>")}</p>
            </div>
          ` : ""}
        </body>
      </html>
    `;

    console.log("[DEBUG PDF] HTML généré, chargement dans Playwright...");
    
    // Charger le contenu HTML dans la page
    await page.setContent(htmlContent, { waitUntil: "networkidle" });

    console.log("[DEBUG PDF] Génération du PDF avec Playwright...");
    
    // Générer le PDF
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

    console.log("[DEBUG PDF] PDF généré avec succès, taille:", pdfBuffer.length, "bytes");

    // Nom du fichier
    const filename = `organa-${documentData.document.type}-${documentData.document.number}.pdf`;

    console.log("[DEBUG PDF] Retour du PDF avec headers corrects");
    console.log("[DEBUG PDF] ===== FIN REQUÊTE PDF (SUCCÈS) =====");

    // Retourner le PDF
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[DEBUG PDF] ===== ERREUR =====");
    console.error("[DEBUG PDF] Erreur:", error.message);
    console.error("[DEBUG PDF] Stack:", error.stack);
    return NextResponse.json(
      {
        error: "DEBUG: Erreur lors de la génération du PDF",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
