import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deriveAccountStatus,
  type PaymentAccountSnapshot,
} from "./payment-provider";
import type { ClubPaymentAccount, PaymentAccountStatus } from "./types";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("REMPLACEZ")) {
    throw new Error("STRIPE_SECRET_KEY manquante");
  }
  return new Stripe(key);
}

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

type AccountRow = {
  id: string;
  club_id: string;
  provider: string;
  provider_account_id: string | null;
  status: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  display_name: string | null;
  account_email: string | null;
  livemode: boolean | null;
};

export function mapPaymentAccount(row: AccountRow): ClubPaymentAccount {
  return {
    id: row.id,
    clubId: row.club_id,
    provider: "stripe",
    providerAccountId: row.provider_account_id,
    status: row.status as PaymentAccountStatus,
    chargesEnabled: row.charges_enabled,
    payoutsEnabled: row.payouts_enabled,
    detailsSubmitted: row.details_submitted,
    displayName: row.display_name,
    accountEmail: row.account_email,
    livemode: row.livemode,
  };
}

const ACCOUNT_SELECT =
  "id, club_id, provider, provider_account_id, status, charges_enabled, payouts_enabled, details_submitted, display_name, account_email, livemode";

export async function getClubStripeAccount(
  supabase: SupabaseClient,
  clubId: string
): Promise<ClubPaymentAccount | null> {
  const { data, error } = await supabase
    .from("club_payment_accounts")
    .select(ACCOUNT_SELECT)
    .eq("club_id", clubId)
    .eq("provider", "stripe")
    .maybeSingle();
  if (error) throw error;
  return data ? mapPaymentAccount(data as AccountRow) : null;
}

export function snapshotFromAccount(
  account: ClubPaymentAccount | null
): PaymentAccountSnapshot | null {
  if (!account) return null;
  return {
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    status: account.status,
    chargesEnabled: account.chargesEnabled,
    payoutsEnabled: account.payoutsEnabled,
    detailsSubmitted: account.detailsSubmitted,
    displayName: account.displayName,
    accountEmail: account.accountEmail,
    livemode: account.livemode,
  };
}

export async function syncStripeAccountRow(
  supabase: SupabaseClient,
  clubId: string,
  stripeAccount: Stripe.Account,
  existingId?: string
): Promise<ClubPaymentAccount> {
  const payload = {
    club_id: clubId,
    provider: "stripe",
    provider_account_id: stripeAccount.id,
    charges_enabled: Boolean(stripeAccount.charges_enabled),
    payouts_enabled: Boolean(stripeAccount.payouts_enabled),
    details_submitted: Boolean(stripeAccount.details_submitted),
    display_name:
      stripeAccount.business_profile?.name ||
      stripeAccount.settings?.dashboard?.display_name ||
      null,
    account_email: stripeAccount.email || null,
    livemode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ?? null,
    status: deriveAccountStatus({
      providerAccountId: stripeAccount.id,
      detailsSubmitted: Boolean(stripeAccount.details_submitted),
      chargesEnabled: Boolean(stripeAccount.charges_enabled),
      payoutsEnabled: Boolean(stripeAccount.payouts_enabled),
    }),
  };

  if (existingId) {
    const { data, error } = await supabase
      .from("club_payment_accounts")
      .update(payload)
      .eq("id", existingId)
      .eq("club_id", clubId)
      .select(ACCOUNT_SELECT)
      .single();
    if (error) throw error;
    return mapPaymentAccount(data as AccountRow);
  }

  const { data, error } = await supabase
    .from("club_payment_accounts")
    .upsert(payload, { onConflict: "club_id,provider" })
    .select(ACCOUNT_SELECT)
    .single();
  if (error) throw error;
  return mapPaymentAccount(data as AccountRow);
}

export async function refreshStripeAccount(
  supabase: SupabaseClient,
  clubId: string
): Promise<ClubPaymentAccount | null> {
  const current = await getClubStripeAccount(supabase, clubId);
  if (!current?.providerAccountId) return current;

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(current.providerAccountId);
  return syncStripeAccountRow(supabase, clubId, account, current.id);
}

export async function createConnectOnboardingLink(params: {
  supabase: SupabaseClient;
  clubId: string;
  clubEmail?: string | null;
  clubName?: string | null;
}): Promise<{ url: string; account: ClubPaymentAccount }> {
  const stripe = getStripe();
  const { supabase, clubId, clubEmail, clubName } = params;
  let account = await getClubStripeAccount(supabase, clubId);

  if (!account?.providerAccountId) {
    const created = await stripe.accounts.create({
      type: "express",
      country: "CH",
      email: clubEmail || undefined,
      business_profile: clubName
        ? { name: clubName.slice(0, 80) }
        : undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        club_id: clubId,
        obillz_purpose: "club_shop",
      },
    });
    account = await syncStripeAccountRow(supabase, clubId, created);
  }

  const base = appBaseUrl();
  const returnUrl = `${base}/tableau-de-bord/boutique?tab=paiements&stripe=return`;
  const refreshUrl = `${base}/tableau-de-bord/boutique?tab=paiements&stripe=refresh`;

  const link = await stripe.accountLinks.create({
    account: account.providerAccountId!,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return { url: link.url, account };
}

export async function createConnectLoginLink(accountId: string): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}
