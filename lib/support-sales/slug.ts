import { createAdminClient } from "@/lib/supabase/admin";
import {
  PUBLIC_PAGE_SLUG_MAX_LENGTH,
  PUBLIC_PAGE_SLUG_PATTERN,
} from "@/lib/public-page/constants";

export function slugifySupportSaleName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function normalizeSupportSaleSlug(input: string): string {
  return slugifySupportSaleName(input).slice(0, PUBLIC_PAGE_SLUG_MAX_LENGTH);
}

export function isValidSupportSaleSlug(slug: string): boolean {
  if (!slug || slug.length < 2 || slug.length > PUBLIC_PAGE_SLUG_MAX_LENGTH) {
    return false;
  }
  return PUBLIC_PAGE_SLUG_PATTERN.test(slug);
}

export function getSupportSalePublicPath(slug: string, memberId?: string | null): string {
  const base = `/vente/${slug}`;
  if (!memberId) return base;
  return `${base}?member=${encodeURIComponent(memberId)}`;
}

export async function allocateSupportSaleSlug(
  name: string,
  excludeId?: string
): Promise<string> {
  const admin = createAdminClient();
  const base = normalizeSupportSaleSlug(name) || "vente";
  for (let i = 0; i < 30; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`.slice(0, PUBLIC_PAGE_SLUG_MAX_LENGTH);
    if (!isValidSupportSaleSlug(candidate)) continue;
    let query = admin
      .from("support_sales")
      .select("id")
      .eq("slug", candidate)
      .is("deleted_at", null);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, PUBLIC_PAGE_SLUG_MAX_LENGTH);
}
