import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "@/lib/documents/documentRef";

export { isUuid };

type AccountRef = { id: string; number: string };

export function accountIdFromRef(accounts: AccountRef[], ref: string): string {
  const trimmed = ref.trim();
  if (isUuid(trimmed)) return trimmed;
  const matches = accounts.filter((account) => account.number === trimmed);
  if (matches.length === 1) return matches[0].id;
  if (matches.length > 1) {
    throw new Error(`Plusieurs comptes portent le numéro ${trimmed}.`);
  }
  throw new Error("Compte introuvable dans le plan de ce club.");
}

export async function resolveAccountingEntryId(
  admin: SupabaseClient,
  clubId: string,
  ref: string,
): Promise<string> {
  const trimmed = ref.trim();
  if (!trimmed) throw new Error("Écriture introuvable");
  if (isUuid(trimmed)) return trimmed;
  if (!/^\d+$/.test(trimmed)) throw new Error("Écriture introuvable");

  const number = Number(trimmed);
  const { data, error } = await admin
    .from("accounting_entries")
    .select("id, status")
    .eq("club_id", clubId)
    .eq("entry_number", number);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) throw new Error(`Aucune écriture ne porte le numéro ${number}.`);
  if (rows.length > 1) {
    throw new Error(`Plusieurs exercices contiennent l'écriture ${number}. Ouvrez-la depuis le journal.`);
  }
  return String(rows[0].id);
}

export function assertTechnicalUuid(value: unknown, label: string): void {
  if (value == null || value === "") return;
  if (typeof value === "string" && isUuid(value)) return;
  throw new Error(`${label} doit être un identifiant technique, pas un numéro visible.`);
}
