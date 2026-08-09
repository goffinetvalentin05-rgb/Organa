import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  handleCheckoutSessionCompleted,
  handleInvoicePaymentFailed,
  handleInvoicePaymentSucceeded,
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from "@/lib/billing/stripeWebhookHandlers";
import { StripeWebhookSyncError } from "@/lib/billing/stripeSync";

/**
 * Handler POST partagé par /api/webhook et /api/webhooks/stripe.
 * Toute la logique métier vit dans stripeWebhookHandlers + stripeSync.
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

  const eventCtx = { eventId: event.id, eventType: event.type };

  console.log(
    `[WEBHOOK][stripe] received ${JSON.stringify({
      event_id: event.id,
      event_type: event.type,
      livemode: event.livemode,
    })}`
  );

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          stripe,
          event.data.object as Stripe.Checkout.Session,
          eventCtx
        );
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(
          stripe,
          event.data.object as Stripe.Subscription,
          eventCtx
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          stripe,
          event.data.object as Stripe.Subscription,
          eventCtx
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          stripe,
          event.data.object as Stripe.Subscription,
          eventCtx
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          stripe,
          event.data.object as Stripe.Invoice,
          eventCtx
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
          eventCtx
        );
        break;

      case "invoice.paid":
        // Redondant avec invoice.payment_succeeded pour les abonnements.
        // On ignore volontairement pour éviter un double traitement concurrent.
        console.log(
          `[WEBHOOK][stripe] ignoré (redondant) ${JSON.stringify({
            event_id: event.id,
            event_type: event.type,
          })}`
        );
        break;

      default:
        console.log(
          `[WEBHOOK][stripe] ignoré (non géré) ${JSON.stringify({
            event_id: event.id,
            event_type: event.type,
          })}`
        );
    }
  } catch (error: unknown) {
    if (error instanceof StripeWebhookSyncError) {
      if (error.permanent) {
        // Données irrécupérables : ack pour stopper les retries Stripe (~3 jours),
        // mais log critique pour intervention manuelle.
        console.error(
          `[WEBHOOK][stripe] CRITICAL_PERMANENT_SYNC_FAILURE ${JSON.stringify({
            event_id: event.id,
            event_type: event.type,
            code: error.code,
            message: error.message,
            details: error.details ?? null,
            action: "acked_no_retry",
          })}`
        );
        return NextResponse.json(
          {
            received: true,
            event_id: event.id,
            sync: "permanent_failure_acked",
            code: error.code,
          },
          { status: 200 }
        );
      }

      console.error(
        `[WEBHOOK][stripe] sync_error ${JSON.stringify({
          event_id: event.id,
          event_type: event.type,
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        })}`
      );
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    const message = error instanceof Error ? error.message : "Handler error";
    console.error(
      `[WEBHOOK][stripe] Erreur ${event.type} event_id=${event.id}:`,
      error
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true, event_id: event.id });
}
