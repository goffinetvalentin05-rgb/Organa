/** Slugs stables en base — libellés via i18n `dashboard.clients.roles.*` / `categories.*` */

export const MEMBER_ROLE_SLUGS = [
  "player",
  "coach",
  "president",
  "vice_president",
  "treasurer",
  "secretary",
  "bar_manager",
  "sponsoring_manager",
  "equipment_manager",
  "events_manager",
  "committee",
  "volunteer",
  "parent",
  "supporter",
  "sponsor",
  "other",
  /** Rétrocompat affichage / filtre */
  "staff",
] as const;

export type MemberRoleSlug = (typeof MEMBER_ROLE_SLUGS)[number];

export const MEMBER_CATEGORY_SLUGS = [
  "first_team",
  "second_team",
  "seniors",
  "veterans",
  "feminines",
  "juniors_a",
  "juniors_b",
  "juniors_c",
  "juniors_d",
  "juniors_e",
  "juniors_f",
  "football_school",
  "leisure",
  "actifs",
  "passifs",
  "committee",
  "staff",
  "parents",
  "supporters",
  "sponsors",
  "volunteers",
  "other",
  /** Rétrocompat affichage / filtre */
  "junior",
] as const;

export type MemberCategorySlug = (typeof MEMBER_CATEGORY_SLUGS)[number];

export const MEMBER_CATEGORY_OTHER = "other" as const;

/** Anciennes valeurs « catégorie » qui sont en réalité des rôles — exclues des filtres / cotisations par équipe */
export const MISPLACED_ROLE_IN_CATEGORY = new Set([
  "president",
  "treasurer",
  "secretary",
]);

const ROLE_SET = new Set<string>(MEMBER_ROLE_SLUGS);
const CATEGORY_SET = new Set<string>(MEMBER_CATEGORY_SLUGS);

/** Rôles sans équivalent catégorie (ex. joueur, trésorier en tant que rôle uniquement) */
export const ROLE_ONLY_SLUGS = new Set<string>(
  MEMBER_ROLE_SLUGS.filter((slug) => !CATEGORY_SET.has(slug))
);

export function isKnownRoleSlug(value: string): boolean {
  return ROLE_SET.has(value);
}

export function isKnownCategorySlug(value: string): boolean {
  return CATEGORY_SET.has(value);
}

/** Valeur utilisable comme filtre ou cible de cotisation par équipe */
export function isValidTeamCategoryValue(value: string | null | undefined): boolean {
  const slug = (value || "").trim();
  if (!slug) return false;
  if (MISPLACED_ROLE_IN_CATEGORY.has(slug)) return false;
  if (ROLE_ONLY_SLUGS.has(slug)) return false;
  return true;
}

export function shouldShowInCategoryFilter(value: string): boolean {
  const slug = value.trim();
  if (!slug) return false;
  if (MISPLACED_ROLE_IN_CATEGORY.has(slug)) return false;
  if (ROLE_ONLY_SLUGS.has(slug)) return false;
  return true;
}

export function parseCategoryFromDb(
  stored: string | null | undefined
): { select: string; custom: string } {
  const value = (stored || "").trim();
  if (!value) return { select: "", custom: "" };
  if (value === MEMBER_CATEGORY_OTHER) return { select: MEMBER_CATEGORY_OTHER, custom: "" };
  if (CATEGORY_SET.has(value)) return { select: value, custom: "" };
  return { select: MEMBER_CATEGORY_OTHER, custom: value };
}

export function serializeCategory(select: string, custom: string): string | null {
  const chosen = select.trim();
  if (!chosen) return null;
  if (chosen === MEMBER_CATEGORY_OTHER) {
    const text = custom.trim();
    return text || null;
  }
  return chosen;
}

export function formatRoleLabel(
  slug: string | null | undefined,
  translate: (key: string) => string
): string {
  const value = (slug || "").trim();
  if (!value) return "";
  const key = `dashboard.clients.roles.${value}`;
  const label = translate(key);
  return label !== key ? label : value;
}

export function formatCategoryLabel(
  slug: string | null | undefined,
  translate: (key: string) => string
): string {
  const value = (slug || "").trim();
  if (!value) return "";
  const catKey = `dashboard.clients.categories.${value}`;
  const catLabel = translate(catKey);
  if (catLabel !== catKey) return catLabel;
  const roleKey = `dashboard.clients.roles.${value}`;
  const roleLabel = translate(roleKey);
  if (roleLabel !== roleKey) return roleLabel;
  return value;
}

export function collectCustomCategoryValues(
  members: { category: string | null }[]
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const member of members) {
    const raw = (member.category || "").trim();
    if (!raw || seen.has(raw)) continue;
    if (CATEGORY_SET.has(raw)) continue;
    if (!shouldShowInCategoryFilter(raw)) continue;
    seen.add(raw);
    out.push(raw);
  }
  return out.sort((a, b) => a.localeCompare(b, "fr"));
}

export function buildCategoryFilterOptions(
  members: { category: string | null }[],
  translate: (key: string) => string
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = MEMBER_CATEGORY_SLUGS.filter(
    (slug) => slug !== MEMBER_CATEGORY_OTHER
  ).map((slug) => ({
    value: slug,
    label: formatCategoryLabel(slug, translate),
  }));

  for (const custom of collectCustomCategoryValues(members)) {
    options.push({ value: custom, label: custom });
  }

  return options;
}
