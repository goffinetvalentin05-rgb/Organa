import type Stripe from "stripe";
import { getStripe } from "@/lib/payments/connect/stripe-client";
import { clubStripeFeeCents } from "./stripeCash";

/**
 * Frais réellement prélevés par Stripe sur le compte du club.
 * Un échec de lecture ne bloque pas l'encaissement : les frais restent à zéro et sont journalisés.
 */
export async function lookupStripeFeeCents(input: {
  paymentIntentId: string | null;
  chargeId: string | null;
  stripeAccount: string | null;
  amountCents: number;
  stripe?: Stripe;
}): Promise<number> {
  if (!input.paymentIntentId && !input.chargeId) return 0;
  try {
    const stripe = input.stripe ?? getStripe();
    const options = input.stripeAccount ? { stripeAccount: input.stripeAccount } : undefined;
    let processing = 0;
    let application = 0;
    if (input.chargeId) {
      const charge = await stripe.charges.retrieve(
        input.chargeId,
        { expand: ["balance_transaction"] },
        options,
      );
      const balance = charge.balance_transaction;
      if (balance && typeof balance !== "string") processing = balance.fee || 0;
      application = charge.application_fee_amount || 0;
    } else if (input.paymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(
        input.paymentIntentId,
        { expand: ["latest_charge.balance_transaction"] },
        options,
      );
      const charge = intent.latest_charge;
      if (charge && typeof charge !== "string") {
        const balance = charge.balance_transaction;
        if (balance && typeof balance !== "string") processing = balance.fee || 0;
        application = charge.application_fee_amount || 0;
      }
    }
    return clubStripeFeeCents({
      amountCents: input.amountCents,
      processingFeeCents: processing,
      applicationFeeCents: application,
    });
  } catch (error) {
    console.error("[ACCOUNTING][stripe-fee]", error);
    return 0;
  }
}
