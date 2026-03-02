import { createAdminClient } from "@/lib/supabase/admin";

type UpsertMarketingContactInput = {
  clubId: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  source: string;
  sourceId?: string | null;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function upsertMarketingContact(input: UpsertMarketingContactInput) {
  const email = normalizeEmail(input.email);
  if (!email) return;

  const supabase = createAdminClient();

  const { error } = await supabase.from("marketing_contacts").upsert(
    {
      club_id: input.clubId,
      first_name: input.firstName?.trim() || null,
      last_name: input.lastName?.trim() || null,
      email,
      phone: input.phone?.trim() || null,
      source: input.source || "unknown",
      source_id: input.sourceId || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "club_id,email_normalized",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    console.error("[MARKETING][contacts] upsert error:", error);
  }
}

