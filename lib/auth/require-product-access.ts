import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OBILLZ_ACTIVE_CLUB_COOKIE } from "@/lib/auth/active-club";
import {
  homeForProduct,
  loginForProduct,
  resolveOrgForProduct,
  type ObillzProduct,
} from "@/lib/auth/product-access";

/**
 * Garde serveur (RSC / layout) — ne pas importer depuis le middleware Edge.
 */
export async function requireProductAccess(product: ObillzProduct): Promise<{
  userId: string;
  clubId: string;
  role: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginForProduct(product));
  }

  let preferred: string | undefined;
  try {
    const jar = await cookies();
    preferred = jar.get(OBILLZ_ACTIVE_CLUB_COOKIE)?.value;
  } catch {
    preferred = undefined;
  }

  const org = await resolveOrgForProduct(supabase, user.id, product, preferred);
  if (org) {
    return { userId: user.id, clubId: org.clubId, role: org.role };
  }

  const other: ObillzProduct = product === "sport" ? "association" : "sport";
  const otherOrg = await resolveOrgForProduct(supabase, user.id, other, preferred);
  if (otherOrg) {
    redirect(homeForProduct(other));
  }

  redirect(`${loginForProduct(product)}?reason=no-org`);
}
