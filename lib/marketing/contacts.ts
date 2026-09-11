import { createAdminClient } from "@/lib/supabase/admin";
import {
  MARKETING_CONSENT_TEXT_VERSION,
  type MarketingConsentSource,
} from "@/lib/marketing/consent";

export type UpsertMarketingContactInput = {
  clubId: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  source: string;
  sourceId?: string | null;
  consentSource: MarketingConsentSource;
  consentTextVersion?: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Crée ou met à jour un contact marketing uniquement lorsqu’un opt-in
 * (ou une déclaration staff) est fourni. Sans consentement : no-op.
 */
export async function upsertMarketingContact(
  input: UpsertMarketingContactInput
): Promise<{ upserted: boolean }> {
  const email = normalizeEmail(input.email);
  if (!email) return { upserted: false };
  if (!input.consentSource) return { upserted: false };

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const consentTextVersion =
    input.consentTextVersion?.trim() || MARKETING_CONSENT_TEXT_VERSION;

  const { error } = await supabase.from("marketing_contacts").upsert(
    {
      club_id: input.clubId,
      first_name: input.firstName?.trim() || null,
      last_name: input.lastName?.trim() || null,
      email,
      phone: input.phone?.trim() || null,
      source: input.source || "unknown",
      source_id: input.sourceId || null,
      consented_at: now,
      consent_source: input.consentSource,
      consent_text_version: consentTextVersion,
      unsubscribed: false,
      updated_at: now,
    },
    {
      onConflict: "club_id,email_normalized",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    console.error("[MARKETING][contacts] upsert error:", error);
    return { upserted: false };
  }
  return { upserted: true };
}
