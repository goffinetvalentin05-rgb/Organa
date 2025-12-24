import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Initialiser Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("[WEBHOOK][stripe] STRIPE_SECRET_KEY non configurée");
}

const stripe = new Stripe(stripeSecretKey || "");

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// Client Supabase avec service role key (bypass RLS pour les webhooks)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  console.warn("[WEBHOOK][stripe] SUPABASE_SERVICE_ROLE_KEY non configurée, le webhook pourrait échouer");
}

// Helper pour créer le client Supabase
function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Configuration Supabase manquante pour le webhook");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  // Lire le raw body (obligatoire pour vérifier la signature Stripe)
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("[WEBHOOK][stripe] Signature manquante");
    return NextResponse.json(
      { error: "Signature manquante" },
      { status: 400 }
    );
  }

  // Vérifier la signature du webhook
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[WEBHOOK][stripe] event=${event.type} id=${event.id}`);
  } catch (err: any) {
    console.error("[WEBHOOK][stripe] Erreur de signature:", err.message);
    return NextResponse.json(
      { error: `Erreur de signature: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseClient();

    // A. Gérer checkout.session.completed (paiement réussi)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Récupérer l'user_id depuis les metadata ou client_reference_id
      const userId = session.metadata?.user_id || session.client_reference_id;

      if (!userId) {
        console.error("[WEBHOOK][stripe] user_id non trouvé dans la session", {
          session_id: session.id,
        });
        return NextResponse.json(
          { error: "user_id non trouvé" },
          { status: 400 }
        );
      }

      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      console.log(`[WEBHOOK][stripe] checkout.session.completed user_id=${userId} customer=${customerId} subscription=${subscriptionId}`);

      // Mettre à jour le plan de l'utilisateur
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          plan: "pro",
          stripe_customer_id: customerId || null,
          stripe_subscription_id: subscriptionId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[WEBHOOK][stripe] Erreur mise à jour plan:", updateError);
        return NextResponse.json(
          { error: "Erreur lors de la mise à jour du plan" },
          { status: 500 }
        );
      }

      console.log(`[WEBHOOK][stripe] updated plan=pro user_id=${userId}`);
    }

    // B. Gérer customer.subscription.deleted (abonnement annulé)
    else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      console.log(`[WEBHOOK][stripe] customer.subscription.deleted subscription=${subscription.id}`);

      // Trouver l'utilisateur par stripe_subscription_id
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          plan: "free",
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (updateError) {
        console.error("[WEBHOOK][stripe] Erreur mise à jour annulation:", updateError);
        return NextResponse.json(
          { error: "Erreur lors de la mise à jour de l'annulation" },
          { status: 500 }
        );
      }

      console.log(`[WEBHOOK][stripe] updated plan=free subscription=${subscription.id}`);
    }

    // C. Gérer invoice.payment_failed (paiement échoué)
    else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;

      const customerId = invoice.customer as string;
      const subscriptionId = invoice.subscription as string;

      console.log(`[WEBHOOK][stripe] invoice.payment_failed customer=${customerId} subscription=${subscriptionId}`);

      // Trouver l'utilisateur par customer ou subscription
      let query = supabase
        .from("profiles")
        .update({
          plan: "free",
          updated_at: new Date().toISOString(),
        });

      if (subscriptionId) {
        query = query.eq("stripe_subscription_id", subscriptionId);
      } else if (customerId) {
        query = query.eq("stripe_customer_id", customerId);
      } else {
        console.warn("[WEBHOOK][stripe] Impossible de trouver l'utilisateur: customer et subscription manquants");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const { error: updateError } = await query;

      if (updateError) {
        console.error("[WEBHOOK][stripe] Erreur mise à jour paiement échoué:", updateError);
        // Ne pas retourner d'erreur 500, juste logger
      } else {
        console.log(`[WEBHOOK][stripe] updated plan=free (payment failed) customer=${customerId}`);
      }
    }

    // Répondre rapidement à Stripe (200 OK)
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[WEBHOOK][stripe] Erreur inattendue:", error);
    // Retourner 500 seulement en cas d'erreur critique
    return NextResponse.json(
      { error: "Erreur lors du traitement du webhook", details: error.message },
      { status: 500 }
    );
  }
}

