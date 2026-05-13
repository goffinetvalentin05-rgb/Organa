import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingSlotDateColumnError } from "@/lib/planning/slotDateFallback";
import { isValidIsoDateOnly, shiftIsoDateByCalendarDays } from "@/lib/planning/isoCalendarDate";

/**
 * Décale chaque slot_date du même nombre de jours (préserve l’écart entre créneaux).
 * Les heures de début/fin ne sont pas modifiées ici.
 */
export async function shiftAllPlanningSlotDatesByDelta(
  supabase: SupabaseClient,
  planningId: string,
  deltaDays: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (deltaDays === 0) return { ok: true };

  const { data: rows, error } = await supabase
    .from("planning_slots")
    .select("id, slot_date")
    .eq("planning_id", planningId);

  if (error) {
    if (isMissingSlotDateColumnError(error)) return { ok: true };
    return { ok: false, message: error.message };
  }

  const applied: { id: string; previous: string }[] = [];

  for (const row of rows || []) {
    const raw = row.slot_date as string | null | undefined;
    const base =
      raw != null && String(raw).trim() !== "" ? String(raw).trim() : null;

    if (!base || !isValidIsoDateOnly(base)) {
      for (const r of [...applied].reverse()) {
        await supabase
          .from("planning_slots")
          .update({ slot_date: r.previous })
          .eq("id", r.id)
          .eq("planning_id", planningId);
      }
      return { ok: false, message: "Date de créneau invalide en base" };
    }

    const next = shiftIsoDateByCalendarDays(base, deltaDays);

    const { error: upErr } = await supabase
      .from("planning_slots")
      .update({ slot_date: next })
      .eq("id", row.id)
      .eq("planning_id", planningId);

    if (upErr) {
      if (isMissingSlotDateColumnError(upErr)) return { ok: true };
      for (const r of [...applied].reverse()) {
        await supabase
          .from("planning_slots")
          .update({ slot_date: r.previous })
          .eq("id", r.id)
          .eq("planning_id", planningId);
      }
      return { ok: false, message: upErr.message };
    }

    applied.push({ id: row.id as string, previous: base });
  }

  return { ok: true };
}
