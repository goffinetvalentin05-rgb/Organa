import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  calculerTotalHT,
  calculerTVA,
  calculerTotalTTC,
  type LigneDocument,
} from "@/lib/utils/calculations";
import { getCompanySettings } from "@/lib/utils/company-settings";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { deriveContractStatus, sponsorContractStatusLabel } from "@/lib/sponsor-contracts";
import { mapMeetingMinutesRow } from "@/lib/meeting-minutes";
import { formatPdfCurrency } from "@/lib/pdf/clubPdfLayout";
import {
  formatRecipientAddress,
  resolveDocumentRecipient,
} from "@/lib/documents/recipient";
import { getClubLogoDataUrlForPdf } from "@/lib/club/resolveClubLogoUrl";

type DocumentType = "quote" | "invoice";

export type GetDocumentPdfDataOptions = {
  /** `profiles.user_id` / `documents.user_id` du club (propriétaire). Défaut : compte connecté. */
  dataUserId?: string;
};

export type SponsorContractPdfLocale = "fr" | "en" | "de";

export type MeetingMinutesPdfLocale = "fr" | "en" | "de";

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

  const logoUrl = await getClubLogoDataUrlForPdf(supabase, profile, scopeUserId);

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
      "id, numero, title, type, date_creation, date_echeance, items, notes, total_ht, total_tva, total_ttc, client_id, recipient_type, sponsor_contract_id, recipient_data, external_recipient_name, external_recipient_contact_name, external_recipient_address, external_recipient_zip, external_recipient_city, external_recipient_country, external_recipient_email, external_recipient_phone, client:clients(*), sponsor:sponsor_contracts(id, sponsor_name, title)"
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
    external_recipient_name: (document as { external_recipient_name?: string | null })
      .external_recipient_name,
    external_recipient_contact_name: (
      document as { external_recipient_contact_name?: string | null }
    ).external_recipient_contact_name,
    external_recipient_address: (document as { external_recipient_address?: string | null })
      .external_recipient_address,
    external_recipient_zip: (document as { external_recipient_zip?: string | null })
      .external_recipient_zip,
    external_recipient_city: (document as { external_recipient_city?: string | null })
      .external_recipient_city,
    external_recipient_country: (document as { external_recipient_country?: string | null })
      .external_recipient_country,
    external_recipient_email: (document as { external_recipient_email?: string | null })
      .external_recipient_email,
    external_recipient_phone: (document as { external_recipient_phone?: string | null })
      .external_recipient_phone,
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

export async function getMeetingMinutesPdfData(
  minuteId: string,
  options?: GetDocumentPdfDataOptions & { locale?: MeetingMinutesPdfLocale }
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
  const locale: MeetingMinutesPdfLocale = options?.locale ?? "fr";

  const { company, primaryColor } = await getClubCompanyPdfData(supabase, scopeUserId);

  const { data: row, error } = await supabase
    .from("meeting_minutes")
    .select(
      "id, club_id, title, meeting_date, start_time, end_time, location, meeting_type, status, chairman, secretary, attendees, excused, absent, agenda_items, discussion_points, decisions, tasks, miscellaneous, next_meeting, created_at, updated_at"
    )
    .eq("id", minuteId)
    .eq("club_id", scopeUserId)
    .maybeSingle();

  if (error || !row) {
    throw new Error("PV introuvable");
  }

  const minute = mapMeetingMinutesRow(row as Record<string, unknown>);
  if (!minute) {
    throw new Error("PV introuvable");
  }

  const generatedAt = new Date().toISOString().slice(0, 10);

  return {
    company,
    primaryColor,
    minute: {
      title: minute.title,
      meetingDate: minute.meetingDate,
      startTime: minute.startTime,
      endTime: minute.endTime,
      location: minute.location,
      meetingType: minute.meetingType,
      status: minute.status,
      chairman: minute.chairman,
      secretary: minute.secretary,
      attendees: minute.attendees,
      excused: minute.excused,
      absent: minute.absent,
      agendaItems: minute.agendaItems,
      discussionPoints: minute.discussionPoints,
      decisions: minute.decisions,
      tasks: minute.tasks,
      miscellaneous: minute.miscellaneous,
      nextMeeting: minute.nextMeeting,
      generatedAt,
    },
    locale,
  };
}

