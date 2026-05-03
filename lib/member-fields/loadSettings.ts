import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeMemberFieldSettings, type MemberFieldsMerged } from "./types";

export async function fetchMergedMemberFieldSettings(
  supabase: SupabaseClient,
  clubId: string
): Promise<MemberFieldsMerged> {
  const { data, error } = await supabase
    .from("club_member_field_settings")
    .select("field_key, enabled, required")
    .eq("club_id", clubId);

  if (error) {
    console.error("[member-fields] load", {
      code: error.code,
      hint: error.message?.slice(0, 160) ?? null,
    });
    return mergeMemberFieldSettings(null);
  }
  return mergeMemberFieldSettings(data ?? []);
}
