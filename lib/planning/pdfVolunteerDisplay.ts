/**
 * Données clients renvoyées par Supabase (colonnes françaises et/ou anglaises selon migrations).
 */
export type PlanningClientRow = {
  id?: string;
  nom?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

/**
 * PostgREST peut renvoyer la relation comme objet ou tableau selon le cas.
 */
export function unwrapPlanningClient(
  clients: PlanningClientRow | PlanningClientRow[] | null | undefined
): PlanningClientRow | null {
  if (!clients) return null;
  if (Array.isArray(clients)) return clients[0] ?? null;
  return clients;
}

/**
 * Libellé lisible pour le PDF : prénom + nom si disponibles, sinon nom complet stocké.
 */
export function formatVolunteerDisplayNameForPdf(input: {
  source?: string | null;
  public_name?: string | null;
  clients?: PlanningClientRow | PlanningClientRow[] | null;
}): string {
  if (input.source === "public_signup") {
    const n = (input.public_name || "").trim();
    return n || "Bénévole";
  }

  const c = unwrapPlanningClient(input.clients);
  if (!c) {
    return "Membre inconnu";
  }

  const first = (c.first_name || "").trim();
  const last = (c.last_name || "").trim();
  const fromParts = `${first} ${last}`.trim();
  if (fromParts) {
    return fromParts;
  }

  const single = (c.nom ?? c.name ?? "").trim();
  if (single) {
    return single;
  }

  return "Membre inconnu";
}

/** TIME / string → clé de tri HH:MM:SS */
export function normalizeTimeKeyForSort(t: string | undefined | null): string {
  if (!t) return "00:00:00";
  const s = String(t).trim();
  if (s.length >= 8) return s.slice(0, 8);
  if (s.length === 5) return `${s}:00`;
  return s.padStart(8, "0");
}

/**
 * Tri PDF : date du créneau croissante, puis heure de début croissante (pas l’ordre de création).
 */
export function sortPlanningSlotsForPdf<
  T extends {
    id: string;
    slotDate: string;
    startTime: string;
  },
>(slots: T[]): T[] {
  return [...slots].sort((a, b) => {
    const da = a.slotDate || "";
    const db = b.slotDate || "";
    if (da !== db) return da.localeCompare(db);
    const ta = normalizeTimeKeyForSort(a.startTime);
    const tb = normalizeTimeKeyForSort(b.startTime);
    if (ta !== tb) return ta.localeCompare(tb);
    return a.id.localeCompare(b.id);
  });
}
