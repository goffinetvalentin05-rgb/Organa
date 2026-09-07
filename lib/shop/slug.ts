import {
  PUBLIC_PAGE_SLUG_MAX_LENGTH,
  PUBLIC_PAGE_SLUG_PATTERN,
} from "@/lib/public-page/constants";

export function slugifyShopName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function normalizeShopSlug(input: string): string {
  return slugifyShopName(input).slice(0, PUBLIC_PAGE_SLUG_MAX_LENGTH);
}

export function isValidShopSlug(slug: string): boolean {
  if (!slug || slug.length < 2 || slug.length > PUBLIC_PAGE_SLUG_MAX_LENGTH) {
    return false;
  }
  return PUBLIC_PAGE_SLUG_PATTERN.test(slug);
}

export function suggestShopSlug(companyName: string, clubId: string): string {
  const base = slugifyShopName(companyName) || "club";
  const candidate =
    base.length >= 3
      ? `${base}-boutique`
      : `${base}-boutique-${clubId.replace(/-/g, "").slice(0, 4)}`;
  return candidate.slice(0, PUBLIC_PAGE_SLUG_MAX_LENGTH);
}

export function getShopPublicUrlPath(slug: string): string {
  return `/club/${slug}/boutique`;
}

export function getShopPublicOriginPath(slug: string): string {
  return `/boutique/${slug}`;
}
