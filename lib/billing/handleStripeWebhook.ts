import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  handleCheckoutSessionCompleted,
  handleInvoicePaymentFailed,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from "@/lib/billing/stripeWebhookHandlers";

/**
 * Handler POST partagé par /api/webhook et /api/webhooks/stripe.
 */
export async function handleStripeWebhook(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || stripeSecretKey.includes("REMPLACEZ")) {
    console.error("[WEBHOOK][stripe] STRIPE_SECRET_KEY manquante");
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY not configured" },
      { status: 500 }
    );
  }

  if (!webhookSecret || webhookSecret.includes("REMPLACEZ")) {
    console.error("[WEBHOOK][stripe] STRIPE_WEBHOOK_SECRET manquante");
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[WEBHOOK][stripe] Signature invalide:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          stripe,
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[WEBHOOK][stripe] Événement ignoré: ${event.type}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Handler error";
    console.error(`[WEBHOOK][stripe] Erreur ${event.type}:`, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
