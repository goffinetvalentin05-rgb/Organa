import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { handleShopStripeEvent } from "@/lib/shop/stripe-webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Webhook dédié aux événements boutique / Stripe Connect.
 * Peut aussi être branché sur le même endpoint que l'abonnement SaaS
 * (voir handleStripeWebhook) grâce à metadata.obillz_purpose.
 */
export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret =
    process.env.STRIPE_SHOP_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || stripeSecretKey.includes("REMPLACEZ")) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
  }
  if (!webhookSecret || webhookSecret.includes("REMPLACEZ")) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[SHOP][webhook] signature", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production" && event.livemode === false) {
    return NextResponse.json(
      { received: true, event_id: event.id, rejected: "test_mode_event" },
      { status: 200 }
    );
  }

  try {
    await handleShopStripeEvent(stripe, event);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Handler error";
    console.error("[SHOP][webhook] handler", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true, event_id: event.id });
}
