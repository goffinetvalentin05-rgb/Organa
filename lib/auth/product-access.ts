import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Accès multi-produit Obillz — partie utilisable partout (middleware Edge inclus).
 * Source de vérité : public.profiles.product_type (profiles.user_id = club_id).
 */

export type ObillzProduct = "sport" | "association";

export const PRODUCT_HOME: Record<ObillzProduct, string> = {
  sport: "/tableau-de-bord",
  association: "/associations/espace",
};

export const PRODUCT_LOGIN: Record<ObillzProduct, string> = {
  sport: "/connexion",
  association: "/associations/connexion",
};

export const PRODUCT_SIGNUP: Record<ObillzProduct, string> = {
  sport: "/inscription",
  association: "/associations/inscription",
};

export function isObillzProduct(value: unknown): value is ObillzProduct {
  return value === "sport" || value === "association";
}

export function homeForProduct(product: ObillzProduct): string {
  return PRODUCT_HOME[product];
}

export function loginForProduct(product: ObillzProduct): string {
  return PRODUCT_LOGIN[product];
}

export type ProductOrg = {
  clubId: string;
  role: string;
  acceptedAt: string | null;
  productType: ObillzProduct;
};

export async function fetchProductTypesByClubIds(
  supabase: SupabaseClient,
  clubIds: string[]
): Promise<Map<string, ObillzProduct>> {
  const map = new Map<string, ObillzProduct>();
  if (clubIds.length === 0) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, product_type")
    .in("user_id", clubIds);

  if (error) {
    console.error("[product-access] Lecture profiles.product_type:", error.message);
    return map;
  }

  for (const row of data ?? []) {
    const id = row.user_id as string;
    const raw = row.product_type;
    map.set(id, isObillzProduct(raw) ? raw : "sport");
  }

  for (const id of clubIds) {
    if (!map.has(id)) map.set(id, "sport");
  }

  return map;
}

export async function listOrgsForProduct(
  supabase: SupabaseClient,
  userId: string,
  product: ObillzProduct
): Promise<ProductOrg[]> {
  const { data: rows, error } = await supabase
    .from("club_memberships")
    .select("club_id, role, accepted_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) {
    console.error("[product-access] Lecture memberships:", error.message);
    return [];
  }

  const memberships = (rows ?? []).map((r) => ({
    clubId: r.club_id as string,
    role: r.role as string,
    acceptedAt: (r.accepted_at as string | null) ?? null,
  }));

  if (memberships.length === 0) return [];

  const productMap = await fetchProductTypesByClubIds(
    supabase,
    memberships.map((m) => m.clubId)
  );

  return memberships
    .filter((m) => productMap.get(m.clubId) === product)
    .map((m) => ({
      ...m,
      productType: product,
    }));
}

export function pickActiveOrgForProduct(
  orgs: ProductOrg[],
  userId: string,
  preferredClubId?: string | null
): ProductOrg | null {
  if (orgs.length === 0) return null;

  const external = orgs
    .filter((o) => o.clubId !== userId)
    .sort((a, b) => {
      const ta = a.acceptedAt ? Date.parse(a.acceptedAt) : 0;
      const tb = b.acceptedAt ? Date.parse(b.acceptedAt) : 0;
      return tb - ta;
    });

  if (preferredClubId) {
    const match = orgs.find((o) => o.clubId === preferredClubId);
    // Ne pas rester collé au club « perso » (club_id = user.id) créé à
    // l'inscription si l'utilisateur a rejoint un vrai club : sinon la
    // facturation lit l'essai perso expiré au lieu de l'abonnement du club.
    if (match && (match.clubId !== userId || external.length === 0)) {
      return match;
    }
  }

  if (external.length > 0) return external[0] ?? null;

  const personal = orgs.find((o) => o.clubId === userId);
  return personal ?? orgs[0] ?? null;
}

export async function resolveOrgForProduct(
  supabase: SupabaseClient,
  userId: string,
  product: ObillzProduct,
  preferredClubId?: string | null
): Promise<ProductOrg | null> {
  const orgs = await listOrgsForProduct(supabase, userId, product);
  return pickActiveOrgForProduct(orgs, userId, preferredClubId);
}

export async function userHasProductAccess(
  supabase: SupabaseClient,
  userId: string,
  product: ObillzProduct
): Promise<boolean> {
  const orgs = await listOrgsForProduct(supabase, userId, product);
  return orgs.length > 0;
}

/**
 * Après login : home du produit demandé uniquement.
 * Ne bascule JAMAIS silencieusement vers l'autre produit.
 */
export async function resolvePostLoginDestination(
  supabase: SupabaseClient,
  userId: string,
  intendedProduct: ObillzProduct,
  preferredClubId?: string | null
): Promise<{
  product: ObillzProduct;
  home: string;
  clubId: string | null;
  switchedProduct: boolean;
  hasAccess: boolean;
}> {
  const intendedOrg = await resolveOrgForProduct(
    supabase,
    userId,
    intendedProduct,
    preferredClubId
  );

  if (intendedOrg) {
    return {
      product: intendedProduct,
      home: homeForProduct(intendedProduct),
      clubId: intendedOrg.clubId,
      switchedProduct: false,
      hasAccess: true,
    };
  }

  return {
    product: intendedProduct,
    home: homeForProduct(intendedProduct),
    clubId: null,
    switchedProduct: false,
    hasAccess: false,
  };
}
