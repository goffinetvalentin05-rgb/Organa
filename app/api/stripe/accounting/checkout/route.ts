import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuthContext } from "@/lib/auth/rbac";
import { getSubscriptionStatus } from "@/lib/billing/subscription";
import { accountingPriceLabel } from "@/lib/billing/pricing";
import { resolveAccountingPriceId } from "@/lib/billing/stripePrices";
import { getAccountingAccess } from "@/lib/accounting/service";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Abonnement annuel séparé pour l'add-on Comptabilité.
 * Il ne remplace pas l'abonnement Obillz : metadata obillz_addon = accounting.
 */
export async function POST() {
  try {
    const ctx = await getAuthContext();
    if (!ctx?.current) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (ctx.current.role !== "owner" && ctx.current.role !== "admin") {
      return NextResponse.json(
        { error: "Seul un administrateur du club peut activer cette option" },
        { status: 403 }
      );
    }

    const subscription = await getSubscriptionStatus(ctx.current.clubId);
    if (!subscription.canWrite) {
      return NextResponse.json(
        { error: "Un abonnement Obillz actif est nécessaire avant cet add-on" },
        { status: 402 }
      );
    }

    const access = await getAccountingAccess(ctx.current.clubId);
    if (access.entitled) {
      return NextResponse.json({ alreadyEntitled: true });
    }

    const priceId = resolveAccountingPriceId();
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!priceId || !stripeSecretKey || !appUrl) {
      return NextResponse.json(
        {
          error: "STRIPE_PRICE_NOT_CONFIGURED",
          message: `Le prix affiché est ${accountingPriceLabel()}. Le paiement en ligne sera disponible dès que le tarif Stripe est configuré.`,
        },
        { status: 503 }
      );
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", ctx.current.clubId)
      .maybeSingle();

    const stripe = new Stripe(stripeSecretKey);
    const metadata = {
      user_id: ctx.current.clubId,
      obillz_addon: "accounting",
    };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: ctx.current.clubId,
      customer: profile?.stripe_customer_id || undefined,
      customer_email: profile?.stripe_customer_id ? undefined : ctx.user.email || undefined,
      success_url: `${appUrl}/tableau-de-bord/comptabilite?addon=success`,
      cancel_url: `${appUrl}/tableau-de-bord/comptabilite?addon=cancel`,
      metadata,
      subscription_data: { metadata },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Session Stripe indisponible" }, { status: 500 });
    }
    return NextResponse.json({ url: session.url, amountLabel: accountingPriceLabel() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Stripe";
    console.error("[API][stripe][accounting]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
