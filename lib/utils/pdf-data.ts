import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  calculerTotalHT,
  calculerTVA,
  calculerTotalTTC,
  type LigneDocument,
} from "@/lib/utils/calculations";
import { getErrorMessage } from "@/lib/utils/error-message";
import { getCompanySettings } from "@/lib/utils/company-settings";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { deriveContractStatus, sponsorContractStatusLabel } from "@/lib/sponsor-contracts";
import { formatPdfCurrency } from "@/lib/pdf/clubPdfLayout";
import {
  formatRecipientAddress,
  resolveDocumentRecipient,
} from "@/lib/documents/recipient";

type DocumentType = "quote" | "invoice";

export type GetDocumentPdfDataOptions = {
  /** `profiles.user_id` / `documents.user_id` du club (propriétaire). Défaut : compte connecté. */
  dataUserId?: string;
};

export type SponsorContractPdfLocale = "fr" | "en" | "de";

export type ClubCompanyPdfPayload = {
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
    logoUrl?: string;
    iban: string;
    bankName: string;
    conditionsPaiement: string;
  };
  primaryColor: string;
  currency: string;
  currencySymbol: string;
};

/**
 * Profil club + logo pour tous les PDF documents (facture, cotisation, contrat sponsor).
 */
export async function getClubCompanyPdfData(
  supabase: SupabaseClient,
  scopeUserId: string
): Promise<ClubCompanyPdfPayload> {
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "company_name, company_email, company_phone, company_address, logo_url, logo_path, primary_color, currency, currency_symbol, iban, bank_name, payment_terms"
    )
    .eq("user_id", scopeUserId)
    .maybeSingle();

  let logoSourceUrl: string | undefined;
  if (profile?.logo_url) {
    logoSourceUrl = profile.logo_url;
  } else if (profile?.logo_path) {
    const { data: urlData } = supabase.storage.from("Logos").getPublicUrl(profile.logo_path);
    logoSourceUrl = urlData.publicUrl;
  }

  if (logoSourceUrl && !logoSourceUrl.startsWith("https://")) {
    console.warn("[pdf-data] Logo URL n'est pas HTTPS, ignorée:", logoSourceUrl);
    logoSourceUrl = undefined;
  }

  let logoUrl: string | undefined;
  if (logoSourceUrl) {
    logoUrl = await fetchImageAsDataUrl(logoSourceUrl);
    if (!logoUrl) {
      console.warn("[pdf-data] Impossible de charger le logo, PDF généré sans logo");
    }
  }

  const currency = profile?.currency || "CHF";
  const currencySymbol =
    profile?.currency_symbol || getCurrencySymbol(currency);

  const companySettings = getCompanySettings({
    primary_color: profile?.primary_color,
    currency,
    currency_symbol: currencySymbol,
  });

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
    primaryColor: companySettings.primary_color,
    currency,
    currencySymbol,
  };
}

/**
 * Convertit une URL d'image en Data URL (base64) pour @react-pdf/renderer.
 */
async function fetchImageAsDataUrl(url: string): Promise<string | undefined> {
  try {
    // Vérifier que l'URL est bien HTTPS (sécurité)
    if (!url.startsWith("https://")) {
      console.warn("[pdf-data] Logo URL n'est pas HTTPS, ignorée pour sécurité:", url);
      return undefined;
    }
    
    console.log("[pdf-data] Chargement du logo depuis:", url);
    
    // Timeout de 10 secondes pour éviter les blocages
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "image/*",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("[pdf-data] Erreur HTTP lors du chargement du logo:", response.status, response.statusText);
      return undefined;
    }

    const contentType = response.headers.get("content-type") || "image/png";
    
    // Vérifier que c'est bien une image
    if (!contentType.startsWith("image/")) {
      console.warn("[pdf-data] Le fichier n'est pas une image valide:", contentType);
      return undefined;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Vérifier que l'image n'est pas vide
    if (arrayBuffer.byteLength === 0) {
      console.warn("[pdf-data] L'image est vide");
      return undefined;
    }
    
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;
    
    console.log("[pdf-data] Logo converti en base64 avec succès, taille:", Math.round(base64.length / 1024), "KB");
    return dataUrl;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[pdf-data] Timeout lors du chargement du logo (10s)");
    } else {
      console.error(
        "[pdf-data] Erreur lors de la conversion du logo en base64:",
        getErrorMessage(error)
      );
    }
    return undefined;
  }
}

export async function getDocumentPdfData(
  id: string,
  type: DocumentType,
  options?: GetDocumentPdfDataOptions
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.id) {
    throw new Error("Non authentifié");
  }

  const scopeUserId = options?.dataUserId ?? user.id;

  const { company, primaryColor, currency, currencySymbol } = await getClubCompanyPdfData(
    supabase,
    scopeUserId
  );

  const { data: document, error: docError } = await supabase
    .from("documents")
    .select(
      "id, numero, title, type, date_creation, date_echeance, items, notes, total_ht, total_tva, total_ttc, client_id, recipient_type, sponsor_contract_id, recipient_data, client:clients(*), sponsor:sponsor_contracts(id, sponsor_name, title)"
    )
    .eq("id", id)
    .eq("user_id", scopeUserId)
    .single();

  if (docError || !document || document.type !== type) {
    throw new Error("Document introuvable");
  }

  const items = Array.isArray(document.items) ? document.items : [];
  const client = Array.isArray(document.client)
    ? document.client[0]
    : document.client;
  const sponsor = Array.isArray(document.sponsor)
    ? document.sponsor[0]
    : document.sponsor;

  const resolvedRecipient = resolveDocumentRecipient({
    recipient_type: (document as { recipient_type?: string | null }).recipient_type,
    client_id: (document as { client_id?: string | null }).client_id,
    sponsor_contract_id: (document as { sponsor_contract_id?: string | null })
      .sponsor_contract_id,
    recipient_data: (document as { recipient_data?: unknown }).recipient_data,
    client: client as Record<string, unknown> | null,
    sponsor: sponsor as Record<string, unknown> | null,
  });

  const clientDisplayName = resolvedRecipient.contactName
    ? `${resolvedRecipient.name}\n${resolvedRecipient.contactName}`
    : resolvedRecipient.name;
  const clientAddress = formatRecipientAddress(resolvedRecipient);

  console.log("[pdf-data] Logo URL finale:", company.logoUrl || "aucun logo défini");
  const lines = (items as LigneDocument[]).map((ligne) => {
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
  // Pour les quotes (cotisations), afficher "COTISATION", "Concerne" et "Référence"
  // Pour les autres cas (devis classiques), afficher "DEVIS", "Client" et "Numéro"
  const documentLabel = type === "quote" 
    ? { title: "COTISATION", clientLabel: "Concerne", numberLabel: "Référence" }
    : { title: "DEVIS", clientLabel: "Client", numberLabel: "Numéro" };

  return {
    company,
    client: {
      name: clientDisplayName,
      email: resolvedRecipient.email || "",
      phone: resolvedRecipient.phone || "",
      address: clientAddress,
      postalCode: resolvedRecipient.postalCode || "",
      city: resolvedRecipient.city || "",
    },
    document: {
      number: document.numero || "",
      subject: String((document as { title?: string }).title || "").trim(),
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
    primaryColor,
    documentLabel,
  };
}

export async function getSponsorContractPdfData(
  contractId: string,
  options?: GetDocumentPdfDataOptions & { locale?: SponsorContractPdfLocale }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.id) {
    throw new Error("Non authentifié");
  }

  const scopeUserId = options?.dataUserId ?? user.id;
  const locale: SponsorContractPdfLocale = options?.locale ?? "fr";

  const { company, primaryColor, currencySymbol } = await getClubCompanyPdfData(
    supabase,
    scopeUserId
  );

  const { data: row, error } = await supabase
    .from("sponsor_contracts")
    .select(
      "id, sponsor_name, title, content, amount, start_date, end_date, sponsor_type, created_at"
    )
    .eq("id", contractId)
    .eq("club_id", scopeUserId)
    .maybeSingle();

  if (error || !row) {
    throw new Error("Contrat introuvable");
  }

  const startDate = String(row.start_date ?? "");
  const endDate = String(row.end_date ?? "");
  const status = deriveContractStatus(startDate, endDate);
  const statusLabel = sponsorContractStatusLabel(status, locale);

  let amountFormatted: string | null = null;
  if (row.amount != null && row.amount !== "") {
    const n = Number(row.amount);
    if (Number.isFinite(n)) {
      amountFormatted = formatPdfCurrency(n, currencySymbol);
    }
  }

  const emissionDate = row.created_at
    ? new Date(row.created_at as string).toISOString().slice(0, 10)
    : startDate;

  const sponsorType = (row.sponsor_type as string | null) || null;

  return {
    company,
    primaryColor,
    currencySymbol,
    contract: {
      id: row.id as string,
      sponsorName: String(row.sponsor_name ?? ""),
      title: String(row.title ?? ""),
      content: String(row.content ?? ""),
      startDate,
      endDate,
      status,
      statusLabel,
      amountFormatted,
      sponsorType,
      emissionDate,
    },
  };
}

