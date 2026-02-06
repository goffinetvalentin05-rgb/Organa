import { createClient } from "@/lib/supabase/server";
import { calculerTotalHT, calculerTVA, calculerTotalTTC } from "@/lib/utils/calculations";
import { getCompanySettings } from "@/lib/utils/company-settings";
import { getCurrencySymbol } from "@/lib/utils/currency";

type DocumentType = "quote" | "invoice";

export async function getDocumentPdfData(id: string, type: DocumentType) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.id) {
    throw new Error("Non authentifié");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "company_name, company_email, company_phone, company_address, logo_url, logo_path, primary_color, currency, currency_symbol, iban, bank_name, payment_terms"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  // Récupérer l'URL du logo - doit être une URL absolue pour @react-pdf/renderer
  let logoUrl: string | undefined;
  if (profile?.logo_url) {
    // Utiliser l'URL stockée directement (déjà absolue depuis l'upload)
    logoUrl = profile.logo_url;
  } else if (profile?.logo_path) {
    // Générer l'URL publique depuis le path (fallback)
    const { data: urlData } = supabase.storage
      .from("Logos")
      .getPublicUrl(profile.logo_path);
    logoUrl = urlData.publicUrl;
  }
  
  // Vérifier que l'URL est absolue (commence par http:// ou https://)
  // Si ce n'est pas le cas, ne pas utiliser le logo pour éviter les erreurs PDF
  if (logoUrl && !logoUrl.startsWith("http://") && !logoUrl.startsWith("https://")) {
    console.warn("[pdf-data] Logo URL n'est pas absolue, ignorée:", logoUrl);
    logoUrl = undefined;
  }

  const currency = profile?.currency || "CHF";
  const currencySymbol =
    profile?.currency_symbol || getCurrencySymbol(currency);

  const companySettings = getCompanySettings({
    primary_color: profile?.primary_color,
    currency,
    currency_symbol: currencySymbol,
  });

  const { data: document, error: docError } = await supabase
    .from("documents")
    .select(
      "id, numero, type, date_creation, date_echeance, items, notes, total_ht, total_tva, total_ttc, client:clients(id, nom, email, adresse)"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (docError || !document || document.type !== type) {
    throw new Error("Document introuvable");
  }

  const items = Array.isArray(document.items) ? document.items : [];
  const client = Array.isArray(document.client)
    ? document.client[0]
    : document.client;
  const lines = items.map((ligne: any) => {
    const qty = Number(ligne.quantite || 0);
    const unitPrice = Number(ligne.prixUnitaire || 0);
    const total = qty * unitPrice;
    return {
      label: ligne.designation || "",
      description: ligne.description || undefined,
      qty,
      unitPrice,
      total,
      vat: ligne.tva || 0,
    };
  });

  const totals = {
    subtotal:
      typeof document.total_ht === "number"
        ? document.total_ht
        : calculerTotalHT(items),
    vat:
      typeof document.total_tva === "number"
        ? document.total_tva
        : calculerTVA(items),
    total:
      typeof document.total_ttc === "number"
        ? document.total_ttc
        : calculerTotalTTC(items),
  };

  const vatRate = lines.length > 0 ? lines[0]?.vat || 0 : 0;

  // Labels dynamiques selon le type de document
  // Pour les quotes (cotisations), afficher "COTISATION" et "Concerne"
  // Pour les autres cas (devis classiques), afficher "DEVIS" et "Client"
  const documentLabel = type === "quote" 
    ? { title: "COTISATION", clientLabel: "Concerne" }
    : { title: "DEVIS", clientLabel: "Client" };

  return {
    company: {
      name: profile?.company_name || "",
      address: profile?.company_address || "",
      email: profile?.company_email || "",
      phone: profile?.company_phone || "",
      logoUrl,
      iban: profile?.iban || "",
      bankName: profile?.bank_name || "",
      conditionsPaiement: profile?.payment_terms || "",
    },
    client: {
      name: client?.nom || "",
      address: client?.adresse || "",
      email: client?.email || "",
    },
    document: {
      number: document.numero || "",
      date: document.date_creation,
      dueDate: document.date_echeance,
      currency,
      currencySymbol,
      vatRate,
      notes: document.notes || "",
      type,
    },
    lines,
    totals,
    primaryColor: companySettings.primary_color,
    documentLabel,
  };
}

