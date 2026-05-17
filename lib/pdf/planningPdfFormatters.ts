/**
 * Formatage des dates / heures pour le PDF planning (@react-pdf).
 * Extrait pour tests unitaires (non-régression affichage slot_date vs date générale).
 */

/** En-tête PDF : midi local pour éviter les décalages fuseau sur YYYY-MM-DD */
export function formatPlanningPdfLongFr(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatPlanningPdfTime(time: string): string {
  return time?.slice(0, 5) || time;
}

/** Colonne « Date » du tableau : une ligne par planning_slots.slot_date */
export function formatPlanningPdfSlotDateShort(dateString: string | undefined): string {
  if (!dateString) return "—";
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
