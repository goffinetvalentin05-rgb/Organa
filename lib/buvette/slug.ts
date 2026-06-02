import {
  PUBLIC_PAGE_SLUG_MAX_LENGTH,
  PUBLIC_PAGE_SLUG_PATTERN,
} from "@/lib/public-page/constants";

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

export function normalizeBuvetteSlug(input: string): string {
  return slugifyClubName(input).slice(0, PUBLIC_PAGE_SLUG_MAX_LENGTH);
}

export function isValidBuvetteSlug(slug: string): boolean {
  if (!slug || slug.length < 2 || slug.length > PUBLIC_PAGE_SLUG_MAX_LENGTH) return false;
  return PUBLIC_PAGE_SLUG_PATTERN.test(slug);
}

/** Slug lisible proposé à partir du nom du club (ex. fc-obillz-buvette). */
export function suggestBuvetteSlug(companyName: string, userId: string): string {
  const base = slugifyClubName(companyName) || "club";
  const candidate =
    base.length >= 3
      ? `${base}-buvette`
      : `${base}-buvette-${userId.replace(/-/g, "").slice(0, 4)}`;
  return candidate.slice(0, PUBLIC_PAGE_SLUG_MAX_LENGTH);
}

export function getBuvettePublicUrlPath(slug: string): string {
  return `/club/${slug}/buvette`;
}
