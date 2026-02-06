import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { PRICING } from "@/lib/billing/subscription";

export const runtime = "nodejs";

/**
 * Créer une session Stripe Checkout pour l'abonnement
 *
 * Body attendu:
 * - billingCycle: "monthly" | "yearly" (obligatoire)
 *
 * Variables d'environnement requises:
 * - STRIPE_SECRET_KEY
 * - STRIPE_PRICE_MONTHLY (price_xxx pour 25 CHF/mois)
 * - STRIPE_PRICE_YEARLY (price_xxx pour 270 CHF/an)
 * - NEXT_PUBLIC_APP_URL
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parser le body pour obtenir le cycle de facturation
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const billingCycle = body.billingCycle as "monthly" | "yearly";

    if (!billingCycle || (billingCycle !== "monthly" && billingCycle !== "yearly")) {
      return NextResponse.json(
        {
          error: "INVALID_BILLING_CYCLE",
          message: "Le cycle de facturation doit être 'monthly' ou 'yearly'",
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Vérifier les variables d'environnement
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Sélectionner le price ID selon le cycle
    const priceId =
      billingCycle === "yearly"
        ? process.env.STRIPE_PRICE_YEARLY
        : process.env.STRIPE_PRICE_MONTHLY;

    // Fallback vers l'ancienne variable si les nouvelles ne sont pas définies
    const fallbackPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
    const finalPriceId = priceId || fallbackPriceId;

    console.log("[API][stripe/checkout] Configuration:", {
      billingCycle,
      priceId: finalPriceId ? "✅ Configuré" : "❌ Manquant",
      appUrl: appUrl ? "✅ Configuré" : "❌ Manquant",
    });

    // Vérifier STRIPE_SECRET_KEY
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

    // Vérifier les autres variables
    const missing: string[] = [];
    if (!finalPriceId) missing.push(billingCycle === "yearly" ? "STRIPE_PRICE_YEARLY" : "STRIPE_PRICE_MONTHLY");
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

    // 3. Initialiser Stripe
    let stripe;
    try {
      stripe = new Stripe(stripeSecretKey!);
    } catch (stripeInitError: any) {
      console.error("[API][stripe/checkout] Erreur initialisation Stripe:", stripeInitError);
      return NextResponse.json(
        { error: "STRIPE_CHECKOUT_FAILED", details: "Erreur initialisation Stripe" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Créer le client Supabase et vérifier l'authentification
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      console.log("[API][stripe/checkout] Utilisateur non authentifié");
      return NextResponse.json(
        { error: "NOT_AUTHENTICATED" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Créer la session Stripe Checkout
    console.log("[API][stripe/checkout] Création de la session Stripe Checkout...", {
      billingCycle,
      price_id: finalPriceId,
      user_id: user.id,
      user_email: user.email,
      amount: PRICING[billingCycle].amount,
      currency: PRICING[billingCycle].currency,
    });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: finalPriceId!,
            quantity: 1,
          },
        ],
        customer_email: user.email || undefined,
        client_reference_id: user.id,
        success_url: `${appUrl}/tableau-de-bord/parametres?checkout=success&cycle=${billingCycle}`,
        cancel_url: `${appUrl}/tableau-de-bord/abonnement?checkout=cancelled`,
        metadata: {
          user_id: user.id,
          billing_cycle: billingCycle,
        },
      });

      console.log("[API][stripe/checkout] ✅ Session Stripe créée avec succès", {
        session_id: session.id,
        session_url: session.url ? "✅ URL présente" : "❌ URL manquante",
      });
    } catch (stripeError: any) {
      console.error("[API][stripe/checkout] Erreur Stripe Checkout:", stripeError);
      return NextResponse.json(
        { error: "STRIPE_CHECKOUT_FAILED", details: stripeError.message },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Vérifier que l'URL de la session existe
    if (!session || !session.url) {
      console.error("[API][stripe/checkout] Session créée mais URL manquante");
      return NextResponse.json(
        { error: "STRIPE_CHECKOUT_FAILED", details: "URL de session manquante" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 7. Succès - Retourner l'URL
    return NextResponse.json(
      {
        url: session.url,
        sessionId: session.id,
        billingCycle,
        amount: PRICING[billingCycle].amount,
        currency: PRICING[billingCycle].currency,
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[API][stripe/checkout] Erreur inattendue:", error);
    return NextResponse.json(
      {
        error: "STRIPE_CHECKOUT_FAILED",
        details: error.message || "Erreur inconnue",
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

