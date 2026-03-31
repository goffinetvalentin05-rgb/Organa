import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Libellé événement pour les réponses API (évite le select imbriqué qui peut échouer avec PostgREST). */
export async function fetchEventLabelForRevenue(
  supabase: Supabase,
  eventId: string | null | undefined
): Promise<{ id: string; name: string } | null> {
  if (!eventId) return null;
  const { data, error } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, name: data.name };
}
