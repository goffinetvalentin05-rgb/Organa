import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeApplicationFeeCents } from "./money";
import {
  applyStockDelta,
  loadClubProductsForQuote,
  nextOrderNumber,
  parseCartItems,
  parseCustomer,
  quoteCart,
  type CheckoutCustomer,
} from "./checkout";
import { isPaymentReady } from "./payment-provider";
import { resolvePublicShop } from "./public";
import { appBaseUrl, getClubStripeAccount, getStripe } from "./stripe-connect";

export async function createShopCheckoutSession(params: {
  slug: string;
  items: unknown;
  customer: unknown;
}): Promise<{ url: string; orderId: string } | { error: string; status: number }> {
  const resolved = await resolvePublicShop(params.slug);
  if (!resolved) return { error: "Boutique introuvable.", status: 404 };
  if (!resolved.catalog.canCheckout) {
    return {
      error:
        resolved.catalog.checkoutBlockedReason ||
        "La boutique n’accepte pas encore les paiements.",
      status: 400,
    };
  }

  const customer = parseCustomer(params.customer);
  if ("error" in customer) return { error: customer.error, status: 400 };
  const items = parseCartItems(params.items);
  if ("error" in items) return { error: items.error, status: 400 };

  const supabase = createAdminClient();
  const clubId = resolved.clubId;
  const account = await getClubStripeAccount(supabase, clubId);
  if (!isPaymentReady(account) || !account?.providerAccountId) {
    return { error: "Paiements du club non configurés.", status: 400 };
  }

  const products = await loadClubProductsForQuote(
    supabase,
    clubId,
    items.map((i) => i.productId)
  );
  const quote = quoteCart(items, products);
  if ("error" in quote) return { error: quote.error, status: 400 };

  const { data: settings } = await supabase
    .from("shop_settings")
    .select("pickup_info, display_name")
    .eq("club_id", clubId)
    .maybeSingle();

  const orderNumber = await nextOrderNumber(supabase, clubId);
  const { data: order, error: orderError } = await supabase
    .from("shop_orders")
    .insert({
      club_id: clubId,
      order_number: orderNumber,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_email: customer.email,
      customer_phone: customer.phone,
      fulfillment_method: "pickup",
      pickup_info: settings?.pickup_info || resolved.catalog.pickupInfo,
      currency: "CHF",
      subtotal_cents: quote.totalCents,
      total_cents: quote.totalCents,
      payment_status: "pending",
      fulfillment_status: "none",
      payment_provider: "stripe",
      stripe_connected_account_id: account.providerAccountId,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: orderError?.message || "Impossible de créer la commande.", status: 500 };
  }

  const { error: itemsError } = await supabase.from("shop_order_items").insert(
    quote.lines.map((line) => ({
      club_id: clubId,
      order_id: order.id,
      product_id: line.product.id,
      variant_id: line.variant?.id || null,
      product_name: line.product.name,
      variant_label: line.variant?.label || null,
      quantity: line.quantity,
      unit_price_cents: line.unitPriceCents,
      line_total_cents: line.lineTotalCents,
    }))
  );

  if (itemsError) {
    await supabase.from("shop_orders").delete().eq("id", order.id).eq("club_id", clubId);
    return { error: itemsError.message, status: 500 };
  }

  try {
    await applyStockDelta(supabase, clubId, quote.lines, "reserve");
  } catch (err) {
    await supabase.from("shop_orders").delete().eq("id", order.id).eq("club_id", clubId);
    const message = err instanceof Error ? err.message : "Stock indisponible.";
    return { error: message, status: 409 };
  }

  const stripe = getStripe();
  const base = appBaseUrl();
  const successUrl = `${base}/boutique/${params.slug}/succes?order=${order.id}`;
  const cancelUrl = `${base}/boutique/${params.slug}/checkout?cancelled=1`;
  const applicationFee = computeApplicationFeeCents(quote.totalCents);

  const metadata = {
    obillz_purpose: "club_shop",
    club_id: clubId,
    order_id: order.id,
    connected_account_id: account.providerAccountId,
  };

  // Pas de payment_method_types : Checkout affiche uniquement les méthodes
  // réellement activées sur le Connected Account (carte, wallets, TWINT…).
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    customer_email: customer.email,
    locale: "fr",
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: order.id,
    metadata,
    payment_intent_data: {
      metadata: {
        ...metadata,
      },
      ...(applicationFee > 0 ? { application_fee_amount: applicationFee } : {}),
    },
    line_items: quote.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: "chf",
        unit_amount: line.unitPriceCents,
        product_data: {
          name: line.variant
            ? `${line.product.name} (${line.variant.label})`
            : line.product.name,
        },
      },
    })),
  };

  try {
    const session = await stripe.checkout.sessions.create(sessionParams, {
      stripeAccount: account.providerAccountId,
    });

    if (!session.url) {
      throw new Error("Session Stripe sans URL");
    }

    await supabase
      .from("shop_orders")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      })
      .eq("id", order.id)
      .eq("club_id", clubId);

    await supabase.from("shop_payments").insert({
      club_id: clubId,
      order_id: order.id,
      provider: "stripe",
      provider_account_id: account.providerAccountId,
      provider_session_id: session.id,
      amount_cents: quote.totalCents,
      currency: "CHF",
      application_fee_cents: applicationFee,
      status: "pending",
    });

    return { url: session.url, orderId: order.id };
  } catch (err) {
    await applyStockDelta(supabase, clubId, quote.lines, "restore").catch(() => undefined);
    await supabase
      .from("shop_orders")
      .update({
        payment_status: "cancelled",
        fulfillment_status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("club_id", clubId);
    const message = err instanceof Error ? err.message : "Erreur Stripe Checkout.";
    console.error("[SHOP][checkout]", err);
    return { error: message, status: 502 };
  }
}

export type { CheckoutCustomer };
