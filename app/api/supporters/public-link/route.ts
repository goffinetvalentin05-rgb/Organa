import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { resolveClubPublicSlug } from "@/lib/supporters/slug";
import { isPaymentReady } from "@/lib/shop/payment-provider";
import { getClubStripeAccount } from "@/lib/payments/connect/accounts";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORTERS);
    if ("error" in guard) return guard.error;
    const supabase = await createClient();
    const slug = await resolveClubPublicSlug(guard.clubId);
    const account = await getClubStripeAccount(supabase, guard.clubId);
    const ready = isPaymentReady(account);
    return NextResponse.json({
      slug,
      publicPath: slug ? `/club/${slug}/supporters` : null,
      paymentsReady: ready,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
