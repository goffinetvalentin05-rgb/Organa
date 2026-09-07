import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClubPaymentsAccess } from "@/lib/payments/connect/guard";
import { getClubStripeAccount } from "@/lib/payments/connect/accounts";
import { createClubAccountSession } from "@/lib/payments/connect/account-session";

export const runtime = "nodejs";

/**
 * Crée une AccountSession Stripe pour le club courant uniquement.
 * Le corps de requête est ignoré : aucun `stripe_account_id` client n’est accepté.
 */
export async function POST() {
  try {
    const guard = await requireClubPaymentsAccess("manage");
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const account = await getClubStripeAccount(supabase, guard.clubId);
    if (!account?.providerAccountId) {
      return NextResponse.json(
        { error: "Aucun compte Stripe connecté pour ce club." },
        { status: 400 }
      );
    }

    const session = await createClubAccountSession(account.providerAccountId);
    return NextResponse.json({
      clientSecret: session.clientSecret,
      expiresAt: session.expiresAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[PAYMENTS][connect] account-session", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
