import { slugifyClubName, buildUniqueSlug } from "@/lib/buvette/slug";
import { PUBLIC_PAGE_SLUG_MAX_LENGTH, PUBLIC_PAGE_SLUG_PATTERN } from "./constants";

export function normalizePublicPageSlug(input: string): string {
  return slugifyClubName(input).slice(0, PUBLIC_PAGE_SLUG_MAX_LENGTH);
}

export function isValidPublicPageSlug(slug: string): boolean {
  if (!slug || slug.length < 2 || slug.length > PUBLIC_PAGE_SLUG_MAX_LENGTH) return false;
  return PUBLIC_PAGE_SLUG_PATTERN.test(slug);
}

export function suggestPublicPageSlug(companyName: string, userId: string): string {
  const base = slugifyClubName(companyName) || "club";
  if (base.length >= 3) {
    return base.slice(0, PUBLIC_PAGE_SLUG_MAX_LENGTH);
  }
  return buildUniqueSlug(companyName || "club", userId).slice(0, PUBLIC_PAGE_SLUG_MAX_LENGTH);
}
