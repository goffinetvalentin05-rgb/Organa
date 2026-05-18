import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PRICING } from "@/lib/billing/subscription";
import { TEAM_PRICING, STANDARD_PRICING } from "@/lib/billing/teamPlan";
import {
  missingTeamPriceEnvKeys,
  resolveStripePriceId,
  type StripeProductPlan,
} from "@/lib/billing/stripePrices";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Créer une session Stripe Checkout pour l'abonnement
 *
 * Body attendu:
 * - billingInterval: "monthly" | "yearly" (obligatoire)
 * - plan: "standard" | "team" (optionnel, défaut "standard")
 *
 * Variables d'environnement (Price IDs) :
 * - STRIPE_PRICE_STANDARD_MONTHLY / STRIPE_PRICE_STANDARD_YEARLY
 * - STRIPE_PRICE_TEAM_MONTHLY / STRIPE_PRICE_TEAM_YEARLY
 * - STRIPE_SECRET_KEY
 * - NEXT_PUBLIC_APP_URL
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const billingInterval = (body.billingInterval || body.billingCycle) as
      | "monthly"
      | "yearly";

    const rawPlan = body.plan;
    const plan: StripeProductPlan =
      rawPlan === "team" || rawPlan === "standard" ? rawPlan : "standard";

    if (
      !billingInterval ||
      (billingInterval !== "monthly" && billingInterval !== "yearly")
    ) {
      return NextResponse.json(
        {
          error: "INVALID_BILLING_INTERVAL",
          message:
            "L'intervalle de facturation doit être 'monthly' ou 'yearly'",
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const priceId = resolveStripePriceId(plan, billingInterval);

    if (!priceId) {
      const missing = missingTeamPriceEnvKeys();
      console.warn(
        "[API][stripe/checkout] Price ID Équipe non configuré",
        { plan, billingInterval, missing }
      );
      return NextResponse.json(
        {
          error: "STRIPE_PRICE_NOT_CONFIGURED",
          message:
            "Le passage à Obillz Équipe sera bientôt disponible en ligne. Contactez-nous en attendant.",
          missing,
          plan,
        },
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const pricingTable =
      plan === "team"
        ? TEAM_PRICING
        : { monthly: STANDARD_PRICING.monthly, yearly: STANDARD_PRICING.yearly };

    console.log("[API][stripe/checkout] Configuration:", {
      plan,
      billingInterval,
      priceId,
      appUrl: appUrl ? "✅ Configuré" : "❌ Manquant",
    });

    if (!stripeSecretKey || stripeSecretKey.includes("REMPLACEZ")) {
      console.error("🚨 STRIPE_SECRET_KEY manquante ou non configurée");
      return NextResponse.json(
        {
          error: "ENV_MISSING",
          missing: ["STRIPE_SECRET_KEY"],
          message: "STRIPE_SECRET_KEY n'est pas configurée.",
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const missing: string[] = [];
    if (!appUrl) missing.push("NEXT_PUBLIC_APP_URL");

    if (missing.length > 0) {
      console.error(`🚨 Variables manquantes: ${missing.join(", ")}`);
      return NextResponse.json(
        {
          error: "ENV_MISSING",
          missing,
          message: `Variables manquantes: ${missing.join(", ")}`,
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let stripe: Stripe;
    try {
      stripe = new Stripe(stripeSecretKey);
    } catch (stripeInitError: unknown) {
      const details =
        stripeInitError instanceof Error
          ? stripeInitError.message
          : "Erreur initialisation Stripe";
      console.error("[API][stripe/checkout] Erreur initialisation Stripe:", stripeInitError);
      return NextResponse.json(
        { error: "STRIPE_CHECKOUT_FAILED", details },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      console.log("[API][stripe/checkout] Utilisateur non authentifié");
      return NextResponse.json(
        { error: "NOT_AUTHENTICATED" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const successPath =
      plan === "team"
        ? "/tableau-de-bord/parametres?checkout=success&plan=team"
        : "/tableau-de-bord/parametres?checkout=success";

    console.log("[API][stripe/checkout] Création de la session Stripe Checkout...", {
      plan,
      billingInterval,
      price_id: priceId,
      user_id: user.id,
      amount: pricingTable[billingInterval].amount,
    });

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: user.email || undefined,
        client_reference_id: user.id,
        success_url: `${appUrl}${successPath}&cycle=${billingInterval}`,
        cancel_url: `${appUrl}/tableau-de-bord/parametres?checkout=cancelled&plan=${plan}`,
        metadata: {
          user_id: user.id,
          billing_interval: billingInterval,
          subscription_tier: plan,
        },
      });
    } catch (stripeError: unknown) {
      const details =
        stripeError instanceof Error ? stripeError.message : "Erreur Stripe";
      console.error("[API][stripe/checkout] Erreur Stripe Checkout:", stripeError);
      return NextResponse.json(
        { error: "STRIPE_CHECKOUT_FAILED", details },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!session?.url) {
      return NextResponse.json(
        { error: "STRIPE_CHECKOUT_FAILED", details: "URL de session manquante" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const legacyAmount =
      plan === "standard" ? PRICING[billingInterval].amount : undefined;

    return NextResponse.json(
      {
        url: session.url,
        sessionId: session.id,
        plan,
        billingInterval,
        amount: pricingTable[billingInterval].amount,
        currency: pricingTable[billingInterval].currency,
        legacyAmount,
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[API][stripe/checkout] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "STRIPE_CHECKOUT_FAILED", details },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
