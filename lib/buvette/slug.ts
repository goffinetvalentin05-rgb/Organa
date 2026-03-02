export function slugifyClubName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function buildUniqueSlug(base: string, userId: string): string {
  const cleanBase = slugifyClubName(base) || "club";
  const suffix = userId.replace(/-/g, "").slice(0, 6);
  return `${cleanBase}-${suffix}`;
}
