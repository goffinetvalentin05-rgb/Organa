/**
 * Indique si l'erreur Supabase/PostgREST correspond à une colonne `slot_date`
 * absente (migration 018 non appliquée sur la base).
 */
export function isMissingSlotDateColumnError(
  error: { message?: string; code?: string } | null | undefined
): boolean {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  const code = String(error.code ?? "");
  if (msg.includes("slot_date")) return true;
  if (msg.includes("schema cache") && msg.includes("planning_slots")) return true;
  if (msg.includes("column") && msg.includes("does not exist")) return true;
  if (code === "42703") return true;
  if (code === "PGRST204") return true;
  return false;
}
