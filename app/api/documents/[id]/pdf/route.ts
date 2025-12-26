import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { createClient } from "@/lib/supabase/server";
import { calculerTotalHT, calculerTVA, calculerTotalTTC, LigneDocument } from "@/lib/utils/calculations";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_COMPANY_SETTINGS, getCompanySettings } from "@/lib/utils/company-settings";

// Forcer le runtime Node.js (pas Edge)
export const runtime = "nodejs";

// Fonction pour charger les settings depuis Supabase
async function getSettingsFromSupabase() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[PDF][Settings] Erreur auth:", authError);
    return null;
  }

  // Récupérer les paramètres depuis profiles
  let { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select(
      "user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  // En cas d'erreur ou profil inexistant, utiliser des valeurs par défaut plutôt que de planter
  if (fetchError) {
    console.warn("[PDF][Settings] Erreur récupération profil, utilisation des valeurs par défaut:", {
      user_id: user.id,
      code: fetchError?.code || "UNKNOWN",
      message: fetchError?.message || "Profil introuvable",
    });
  }

  // Utiliser logo_url depuis la DB si disponible, sinon construire depuis logo_path
  let logoUrl: string | null = null;
  if (profile?.logo_url) {
    logoUrl = profile.logo_url;
  } else if (profile?.logo_path) {
    const { data: urlData } = supabase.storage
      .from("Logos")
      .getPublicUrl(profile.logo_path);
    logoUrl = urlData.publicUrl;
  }

  // Utiliser getCompanySettings pour garantir des valeurs par défaut robustes
  const rawSettings = {
    primary_color: profile?.primary_color,
    currency: profile?.currency,
    currency_symbol: profile?.currency_symbol,
  };
  
  const companySettings = getCompanySettings(rawSettings);

  return {
    company_name: profile?.company_name || "",
    company_email: profile?.company_email || "",
    company_phone: profile?.company_phone || "",
    company_address: profile?.company_address || "",
    logo_url: logoUrl,
    primary_color: companySettings.primary_color,
    currency: companySettings.currency,
    currency_symbol: companySettings.currency_symbol,
  };
}

// Fonction pour charger un document depuis Supabase
async function getDocumentFromSupabase(id: string, userId: string) {
  const supabase = await createClient();

  // Récupérer le document
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select(`
      id,
      type,
      numero,
      status,
      date_creation,
      date_echeance,
      date_paiement,
      notes,
      items,
      total_ht,
      total_tva,
      total_ttc,
      client_id
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (docError || !document) {
    console.error("[PDF][Document] Erreur récupération depuis public.documents:", {
      status: "ERROR",
      id,
      user_id: userId,
      code: docError?.code || "UNKNOWN",
      message: docError?.message || "Document introuvable",
      details: docError?.details || null,
      hint: docError?.hint || null,
    });
    return null;
  }

  // Récupérer le client séparément
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, nom, email, adresse")
    .eq("id", document.client_id)
    .eq("user_id", userId)
    .single();

  if (clientError || !client) {
    console.error("[PDF][Document] Erreur récupération client depuis public.clients:", {
      status: "ERROR",
      document_id: id,
      client_id: document.client_id,
      user_id: userId,
      code: clientError?.code || "UNKNOWN",
      message: clientError?.message || "Client introuvable",
      details: clientError?.details || null,
      hint: clientError?.hint || null,
    });
    return null;
  }

  // Formater les lignes
  const lignes = (document.items || []) as LigneDocument[];
  const subtotal = document.total_ht ?? calculerTotalHT(lignes);
  const vat = document.total_tva ?? calculerTVA(lignes);
  const total = document.total_ttc ?? calculerTotalTTC(lignes);

  // Déterminer le taux de TVA (prendre le premier taux trouvé, ou 0)
  const vatRate = lignes.length > 0 && lignes[0]?.tva ? lignes[0].tva : 0;

  return {
    company: {
      name: "", // Sera rempli depuis settings
      address: "",
      email: "",
      phone: "",
      iban: null,
      bankName: null,
      logoUrl: null as string | null,
      conditionsPaiement: null,
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
      currency: "", // Sera rempli depuis settings
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
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Dans Next.js 16, params peut être une Promise
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    console.log("[PDF] Requête PDF - ID:", id);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const download = searchParams.get("download") === "true";

    if (!type || (type !== "invoice" && type !== "quote")) {
      return NextResponse.json(
        { error: "Paramètre 'type' requis et doit être 'invoice' ou 'quote'" },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "ID du document requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      console.error("[PDF] Erreur auth:", authError);
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Charger les settings depuis Supabase
    console.log("[PDF] Chargement des settings depuis Supabase...");
    const settings = await getSettingsFromSupabase();
    if (!settings) {
      console.error("[PDF] Erreur lors du chargement des settings");
      return NextResponse.json(
        { error: "Erreur lors du chargement des paramètres de l'entreprise" },
        { status: 500 }
      );
    }
    console.log("[PDF] Settings source: Supabase, logo_url=", settings.logo_url || "null");

    // Charger le document depuis Supabase (table public.documents)
    console.log("[PDF] Chargement du document depuis public.documents, ID:", id, "Type:", type, "User:", user.id);
    const documentData = await getDocumentFromSupabase(id, user.id);
    if (!documentData) {
      console.error("[PDF] Document introuvable - ID:", id, "Type:", type, "User:", user.id);
      return NextResponse.json(
        { 
          error: "Document introuvable",
          details: `Le document avec l'ID ${id} n'a pas été trouvé ou vous n'avez pas l'autorisation de le consulter.`,
        },
        { status: 404 }
      );
    }

    // Vérifier que le type correspond
    if (documentData.document.type !== type) {
      console.error("[PDF] Type de document incompatible:", {
        expected: type,
        actual: documentData.document.type,
        document_id: id,
      });
      return NextResponse.json(
        { 
          error: "Type de document incorrect",
          details: `Le document est de type '${documentData.document.type}' mais le paramètre 'type' attendu est '${type}'.`,
        },
        { status: 400 }
      );
    }

    console.log("[PDF] Document trouvé:", documentData.document.number);

    // Remplacer les données de l'entreprise par celles de Supabase
    documentData.company.name = settings.company_name;
    documentData.company.address = settings.company_address;
    documentData.company.email = settings.company_email;
    documentData.company.phone = settings.company_phone;
    documentData.company.logoUrl = settings.logo_url ? settings.logo_url : null;
    
    // Utiliser les paramètres depuis les settings (garantis avec valeurs par défaut)
    const companySettings = getCompanySettings(settings);
    documentData.document.currency = companySettings.currency;
    
    // Couleur principale pour le PDF (toujours disponible grâce à getCompanySettings)
    const primaryColor = companySettings.primary_color;
    const currencySymbol = companySettings.currency_symbol;

    // Lancer le navigateur Chromium
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Formater les montants (utiliser la devise depuis companySettings)
    const formatCurrency = (amount: number) => {
      const currencyToUse = companySettings.currency;
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currencyToUse,
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

    // Construire l'URL du logo (base64 ou URL)
    let logoHtml = "";
    if (documentData.company.logoUrl) {
      // Construire l'URL absolue pour Playwright
      const host = request.headers.get("host") || "localhost:3000";
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      let logoUrl = documentData.company.logoUrl;

      if (!logoUrl.startsWith("http")) {
        // Si c'est une URL relative, la convertir en URL absolue
        logoUrl = logoUrl.startsWith("/")
          ? `${protocol}://${host}${logoUrl}`
          : `${protocol}://${host}/${logoUrl}`;
      }

      logoHtml = `<img src="${logoUrl}" alt="Logo" style="max-height: 180px; max-width: 500px; object-fit: contain; display: block;" />`;
    }

    // Type de document en français
    const documentTypeLabel = type === "invoice" ? "FACTURE" : "DEVIS";

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
            
            .line-main-row td:first-child {
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
            
            .lines-table tbody tr:hover {
              background: #f8f9fa;
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
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              font-size: 9pt;
              color: #666;
            }
            
            .footer-section {
              margin-bottom: 10px;
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
          
          <!-- Footer -->
          <div class="footer">
          </div>
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

    // Nom du fichier
    const filename = `organa-${type}-${documentData.document.number}.pdf`;

    // Retourner le PDF avec les en-têtes appropriés
    const disposition = download ? "attachment" : "inline";
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[PDF] Erreur lors de la génération du PDF:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
