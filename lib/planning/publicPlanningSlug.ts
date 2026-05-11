export const PUBLIC_PLANNING_SLUG_MAX_LENGTH = 48;

function stripDiacritics(input: string): string {
  // NFD sépare les caractères des diacritiques, puis on supprime ceux-ci.
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function slugifyPublicPlanningName(input: string): string {
  const base =
    stripDiacritics(input || "")
      .toLowerCase()
      .trim()
      // Toute suite de caractères “pas alphanumérique” devient un tiret.
      .replace(/[^a-z0-9]+/g, "-")
      // Pas de tirets en début/fin.
      .replace(/^-+|-+$/g, "");

  const trimmed = base
    .slice(0, PUBLIC_PLANNING_SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");
  return trimmed || "planning";
}

export function isPublicPlanningSlug(value: string): boolean {
  // Slug attendu : minuscules + chiffres + tirets, sans tirets consécutifs,
  // et pas de tirets au début/à la fin.
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 120;
}

