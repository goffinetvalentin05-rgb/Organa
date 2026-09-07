import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeApplicationFeeCents } from "./money";
import {
  applyStockDelta,
  loadClubProductsForQuote,
  quotedLinesFromOrderItems,
} from "./checkout";
import { sendOrderPaidEmails } from "./email";
import { syncStripeAccountRow } from "./stripe-connect";

const SHOP_PURPOSE = "club_shop";

export function isShopStripeEvent(event: Stripe.Event): boolean {
  if (event.type === "account.updated") return true;
  const obj = event.data.object as {
    metadata?: Record<string, string> | null;
  };
  return obj?.metadata?.obillz_purpose === SHOP_PURPOSE;
}

async function claimEvent(
  providerEventId: string,
  eventType: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("shop_webhook_events").insert({
    provider: "stripe",
    provider_event_id: providerEventId,
    event_type: eventType,
  });
  if (error) {
    if (error.code === "23505") return false;
    throw error;
  }
  return true;
}

async function findOrderBySession(sessionId: string, clubId?: string | null) {
  const supabase = createAdminClient();
  let query = supabase
    .from("shop_orders")
    .select(
      "id, club_id, payment_status, fulfillment_status, stripe_connected_account_id, emails_sent_at, total_cents, currency"
    )
    .eq("stripe_checkout_session_id", sessionId);
  if (clubId) query = query.eq("club_id", clubId);
  const { data } = await query.maybeSingle();
  return data;
}

async function restoreOrderStock(orderId: string, clubId: string) {
  const supabase = createAdminClient();
  const { data: items } = await supabase
    .from("shop_order_items")
    .select(
      "product_id, variant_id, product_name, variant_label, quantity, unit_price_cents, line_total_cents"
    )
    .eq("order_id", orderId)
    .eq("club_id", clubId);
  if (!items?.length) return;
  const productIds = items
    .map((i) => i.product_id)
    .filter((id): id is string => Boolean(id));
  const products = await loadClubProductsForQuote(supabase, clubId, productIds);
  const lines = quotedLinesFromOrderItems(items, products);
  await applyStockDelta(supabase, clubId, lines, "restore");
}

export async function markOrderPaid(params: {
  orderId: string;
  clubId: string;
  expectedAccountId: string | null;
  eventAccountId: string | null;
  sessionId: string | null;
  paymentIntentId: string | null;
  chargeId: string | null;
  amountCents: number;
}): Promise<void> {
  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("shop_orders")
    .select(
      "id, club_id, payment_status, stripe_connected_account_id, emails_sent_at, total_cents, order_number, customer_first_name, customer_last_name, customer_email, pickup_info, currency"
    )
    .eq("id", params.orderId)
    .eq("club_id", params.clubId)
    .maybeSingle();

  if (error || !order) {
    throw new Error("Commande introuvable pour le paiement boutique");
  }

  if (
    params.expectedAccountId &&
    params.eventAccountId &&
    params.expectedAccountId !== params.eventAccountId
  ) {
    throw new Error("Compte Stripe connecté incohérent (multi-tenant)");
  }

  if (
    order.stripe_connected_account_id &&
    params.eventAccountId &&
    order.stripe_connected_account_id !== params.eventAccountId
  ) {
    throw new Error("La commande n’appartient pas à ce compte Stripe");
  }

  if (order.payment_status === "paid") {
    if (!order.emails_sent_at) {
      await sendOrderPaidEmails(order.id).catch((err) => {
        console.error("[SHOP][email] retry after paid", err);
      });
    }
    return;
  }

  if (order.payment_status === "refunded") return;

  const { data: existingPay } = await supabase
    .from("shop_payments")
    .select("id")
    .eq("order_id", order.id)
    .eq("club_id", order.club_id)
    .eq("provider", "stripe")
    .maybeSingle();

  if (existingPay) {
    await supabase
      .from("shop_payments")
      .update({
        provider_account_id: params.eventAccountId || order.stripe_connected_account_id,
        provider_session_id: params.sessionId,
        provider_payment_intent_id: params.paymentIntentId,
        provider_charge_id: params.chargeId,
        amount_cents: params.amountCents || order.total_cents,
        application_fee_cents: computeApplicationFeeCents(
          params.amountCents || order.total_cents
        ),
        status: "succeeded",
      })
      .eq("id", existingPay.id)
      .eq("club_id", order.club_id);
  } else {
    const { error: payError } = await supabase.from("shop_payments").insert({
      club_id: order.club_id,
      order_id: order.id,
      provider: "stripe",
      provider_account_id: params.eventAccountId || order.stripe_connected_account_id,
      provider_session_id: params.sessionId,
      provider_payment_intent_id: params.paymentIntentId,
      provider_charge_id: params.chargeId,
      amount_cents: params.amountCents || order.total_cents,
      currency: order.currency || "CHF",
      application_fee_cents: computeApplicationFeeCents(
        params.amountCents || order.total_cents
      ),
      status: "succeeded",
    });
    if (payError && payError.code !== "23505") {
      console.error("[SHOP][payments] insert", payError);
    }
  }

  const { error: updError } = await supabase
    .from("shop_orders")
    .update({
      payment_status: "paid",
      fulfillment_status: "to_prepare",
      stripe_payment_intent_id: params.paymentIntentId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("club_id", order.club_id)
    .neq("payment_status", "paid");

  if (updError) throw updError;

  await sendOrderPaidEmails(order.id).catch((err) => {
    console.error("[SHOP][email] send after paid", err);
  });
}

async function markOrderTerminal(params: {
  sessionId: string;
  paymentStatus: "failed" | "cancelled" | "expired" | "refunded";
  restoreStock: boolean;
  paymentRecordStatus?: "failed" | "cancelled" | "expired" | "refunded";
}) {
  const order = await findOrderBySession(params.sessionId);
  if (!order) return;
  if (order.payment_status === "paid" && params.paymentStatus !== "refunded") {
    return;
  }
  if (order.payment_status === params.paymentStatus) return;

  const supabase = createAdminClient();
  const alreadyRestored =
    order.payment_status === "cancelled" ||
    order.payment_status === "expired" ||
    order.payment_status === "refunded";

  await supabase
    .from("shop_orders")
    .update({
      payment_status: params.paymentStatus,
      fulfillment_status:
        params.paymentStatus === "refunded" ? "cancelled" : "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("club_id", order.club_id);

  if (params.restoreStock && !alreadyRestored && order.payment_status === "pending") {
    await restoreOrderStock(order.id, order.club_id);
  }

  if (params.paymentRecordStatus) {
    await supabase
      .from("shop_payments")
      .update({ status: params.paymentRecordStatus })
      .eq("order_id", order.id)
      .eq("club_id", order.club_id);
  }
}

async function releaseEvent(providerEventId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("shop_webhook_events")
    .delete()
    .eq("provider", "stripe")
    .eq("provider_event_id", providerEventId);
}

export async function handleShopStripeEvent(
  _stripe: Stripe,
  event: Stripe.Event
): Promise<void> {
  const claimed = await claimEvent(event.id, event.type);
  if (!claimed) {
    console.log(`[SHOP][webhook] already processed ${event.id}`);
    return;
  }

  const connectedAccount =
    typeof event.account === "string" ? event.account : null;

  try {
  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const clubId = account.metadata?.club_id;
      if (!clubId) return;
      const supabase = createAdminClient();
      await syncStripeAccountRow(supabase, clubId, account);
      break;
    }

    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.obillz_purpose !== SHOP_PURPOSE) return;

      const clubId = session.metadata?.club_id;
      const orderId = session.metadata?.order_id;
      if (!clubId || !orderId) {
        throw new Error("Metadata boutique manquante sur la session Checkout");
      }
      if (session.metadata.connected_account_id && connectedAccount) {
        if (session.metadata.connected_account_id !== connectedAccount) {
          throw new Error("Session Checkout / compte Connect incohérents");
        }
      }

      const paid =
        session.payment_status === "paid" ||
        event.type === "checkout.session.async_payment_succeeded";
      if (!paid) return;

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      await markOrderPaid({
        orderId,
        clubId,
        expectedAccountId: session.metadata.connected_account_id || null,
        eventAccountId: connectedAccount,
        sessionId: session.id,
        paymentIntentId,
        chargeId: null,
        amountCents: session.amount_total ?? 0,
      });
      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.obillz_purpose !== SHOP_PURPOSE) return;
      await markOrderTerminal({
        sessionId: session.id,
        paymentStatus: "failed",
        restoreStock: true,
        paymentRecordStatus: "failed",
      });
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.obillz_purpose !== SHOP_PURPOSE) return;
      await markOrderTerminal({
        sessionId: session.id,
        paymentStatus: "expired",
        restoreStock: true,
        paymentRecordStatus: "expired",
      });
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      if (pi.metadata?.obillz_purpose !== SHOP_PURPOSE) return;
      const sessionId = pi.metadata?.checkout_session_id;
      if (!sessionId) return;
      await markOrderTerminal({
        sessionId,
        paymentStatus: "failed",
        restoreStock: true,
        paymentRecordStatus: "failed",
      });
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const piId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
      if (!piId) return;
      const supabase = createAdminClient();
      const { data: order } = await supabase
        .from("shop_orders")
        .select("id, club_id, payment_status, stripe_checkout_session_id")
        .eq("stripe_payment_intent_id", piId)
        .maybeSingle();
      if (!order?.stripe_checkout_session_id) return;
      if (charge.refunded) {
        await markOrderTerminal({
          sessionId: order.stripe_checkout_session_id,
          paymentStatus: "refunded",
          restoreStock: order.payment_status === "paid",
          paymentRecordStatus: "refunded",
        });
      }
      break;
    }

    default:
      break;
  }
  } catch (error) {
    await releaseEvent(event.id);
    throw error;
  }
}
