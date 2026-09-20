import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeClientsDbRow,
} from "@/lib/clients/normalizeDbRow";
import type { SupportSaleMemberOption, SupportSaleMemberScope } from "./types";

type ClubMember = {
  id: string;
  name: string;
  category: string | null;
};

export async function loadClubMembersForSale(clubId: string): Promise<ClubMember[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .select("*")
    .eq("user_id", clubId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return (data || [])
    .map((row) => normalizeClientsDbRow(row as Record<string, unknown>))
    .filter((row): row is NonNullable<typeof row> => Boolean(row && row.user_id === clubId))
    .map((row) => ({
      id: row.id,
      name: (row.nom || "").trim() || "Membre",
      category: row.category,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function filterEligibleMembers(
  members: ClubMember[],
  scope: SupportSaleMemberScope,
  categories: string[],
  memberIds: string[]
): SupportSaleMemberOption[] {
  if (scope === "categories") {
    const allowed = new Set(categories);
    return members
      .filter((m) => m.category && allowed.has(m.category))
      .map((m) => ({ id: m.id, name: m.name, category: m.category }));
  }
  if (scope === "members") {
    const allowed = new Set(memberIds);
    return members
      .filter((m) => allowed.has(m.id))
      .map((m) => ({ id: m.id, name: m.name, category: m.category }));
  }
  return members.map((m) => ({ id: m.id, name: m.name, category: m.category }));
}

export async function loadEligibleMembers(input: {
  clubId: string;
  scope: SupportSaleMemberScope;
  categories: string[];
  memberIds: string[];
}): Promise<SupportSaleMemberOption[]> {
  const members = await loadClubMembersForSale(input.clubId);
  return filterEligibleMembers(members, input.scope, input.categories, input.memberIds);
}

export async function assertMembersBelongToClub(
  clubId: string,
  memberIds: string[]
): Promise<boolean> {
  if (memberIds.length === 0) return true;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .select("id")
    .eq("user_id", clubId)
    .is("deleted_at", null)
    .in("id", memberIds);
  if (error) throw new Error(error.message);
  return (data || []).length === memberIds.length;
}
