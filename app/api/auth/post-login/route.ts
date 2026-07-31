import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OBILLZ_ACTIVE_CLUB_COOKIE } from "@/lib/auth/active-club";
import {
  isObillzProduct,
  resolvePostLoginDestination,
  type ObillzProduct,
} from "@/lib/auth/product-access";

export const runtime = "nodejs";

/**
 * POST /api/auth/post-login
 * Body: { intendedProduct: "sport" | "association" }
 *
 * Résout la destination post-connexion selon profiles.product_type
 * des organisations accessibles. Pose le cookie club actif.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const intendedRaw =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { intendedProduct?: unknown }).intendedProduct === "string"
      ? (body as { intendedProduct: string }).intendedProduct
      : "";

  if (!isObillzProduct(intendedRaw)) {
    return NextResponse.json(
      { error: "intendedProduct invalide" },
      { status: 400 }
    );
  }

  const intendedProduct: ObillzProduct = intendedRaw;

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const preferred = request.cookies.get(OBILLZ_ACTIVE_CLUB_COOKIE)?.value;
  const dest = await resolvePostLoginDestination(
    supabase,
    user.id,
    intendedProduct,
    preferred
  );

  const res = NextResponse.json({
    ok: true,
    product: dest.product,
    home: dest.home,
    clubId: dest.clubId,
    switchedProduct: dest.switchedProduct,
  });

  if (dest.clubId) {
    res.cookies.set(OBILLZ_ACTIVE_CLUB_COOKIE, dest.clubId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
      sameSite: "lax",
    });
  }

  return res;
}
