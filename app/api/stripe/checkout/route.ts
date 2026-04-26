import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { PRICING } from "@/lib/billing/subscription";

export const runtime = "nodejs";
const PRICE_MONTHLY = "price_1TQTaxHvElMyrvJkVltPcQUp";
const PRICE_YEARLY = "price_1TQTbbHvElMyrvJkmsJXnHKW";

/**
 * Créer une session Stripe Checkout pour l'abonnement
 *
 * Body attendu:
 * - billingInterval: "monthly" | "yearly" (obligatoire)
 *
 * Variables d'environnement requises:
 * - STRIPE_SECRET_KEY
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

    const billingInterval = (body.billingInterval || body.billingCycle) as
      | "monthly"
      | "yearly";

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

    // 2. Vérifier les variables d'environnement
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Sélectionner le price ID selon l'intervalle
    const priceId =
      billingInterval === "yearly" ? PRICE_YEARLY : PRICE_MONTHLY;

    console.log("[API][stripe/checkout] Configuration:", {
      billingInterval,
      priceId,
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
      billingInterval,
      price_id: priceId,
      user_id: user.id,
      user_email: user.email,
      amount: PRICING[billingInterval].amount,
      currency: PRICING[billingInterval].currency,
    });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        customer_email: user.email || undefined,
        client_reference_id: user.id,
        success_url: `${appUrl}/tableau-de-bord/parametres?checkout=success&cycle=${billingInterval}`,
        cancel_url: `${appUrl}/tableau-de-bord/abonnement?checkout=cancelled`,
        metadata: {
          user_id: user.id,
          billing_interval: billingInterval,
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
        billingInterval,
        amount: PRICING[billingInterval].amount,
        currency: PRICING[billingInterval].currency,
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

