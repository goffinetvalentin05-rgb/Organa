import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describePaymentReadiness, isPaymentReady } from "@/lib/shop/payment-provider";
import type { ClubPaymentAccount } from "@/lib/shop/types";
import { getClubStripeAccount, loadLiveClubConnectAccount } from "./accounts";
import {
  emptyConnectRequirements,
  type ConnectRequirements,
  deriveConnectUiMode,
  isConnectActionRequired,
} from "./ui-state";
import type { ClubConnectStatusDto } from "./types";

export type { ClubConnectStatusDto } from "./types";

function requirementsFromStripe(
  stripeAccount: Stripe.Account | null
): ConnectRequirements {
  if (!stripeAccount) return emptyConnectRequirements();
  return {
    currentlyDue: stripeAccount.requirements?.currently_due ?? [],
    pastDue: stripeAccount.requirements?.past_due ?? [],
    eventuallyDue: stripeAccount.requirements?.eventually_due ?? [],
    disabledReason: stripeAccount.requirements?.disabled_reason ?? null,
  };
}

export async function getClubConnectStatus(
  supabase: SupabaseClient,
  clubId: string
): Promise<ClubConnectStatusDto> {
  let account: ClubPaymentAccount | null = null;
  let stripeAccount: Stripe.Account | null = null;

  try {
    const live = await loadLiveClubConnectAccount(supabase, clubId);
    account = live.account;
    stripeAccount = live.stripeAccount;
  } catch (error) {
    console.warn("[PAYMENTS][connect] status refresh", error);
    account = await getClubStripeAccount(supabase, clubId);
  }

  const readiness = describePaymentReadiness(account);
  const requirements = requirementsFromStripe(stripeAccount);
  const chargesEnabled = Boolean(account?.chargesEnabled);
  const payoutsEnabled = Boolean(account?.payoutsEnabled);
  const detailsSubmitted = Boolean(account?.detailsSubmitted);
  const hasAccount = Boolean(account?.providerAccountId);

  return {
    account,
    ready: isPaymentReady(account),
    incomplete: readiness.incomplete,
    label: readiness.label,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    requirements,
    actionRequired: hasAccount
      ? isConnectActionRequired({
          chargesEnabled,
          detailsSubmitted,
          currentlyDue: requirements.currentlyDue,
          pastDue: requirements.pastDue,
        })
      : false,
    uiMode: deriveConnectUiMode({
      hasAccount,
      detailsSubmitted,
      chargesEnabled,
      currentlyDue: requirements.currentlyDue,
      pastDue: requirements.pastDue,
    }),
  };
}
