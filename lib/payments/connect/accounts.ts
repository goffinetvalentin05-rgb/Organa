import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  deriveAccountStatus,
  type PaymentAccountSnapshot,
} from "@/lib/shop/payment-provider";
import type { ClubPaymentAccount, PaymentAccountStatus } from "@/lib/shop/types";
import { getStripe } from "./stripe-client";

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

export type LiveClubConnectAccount = {
  account: ClubPaymentAccount | null;
  stripeAccount: Stripe.Account | null;
};

export async function loadLiveClubConnectAccount(
  supabase: SupabaseClient,
  clubId: string
): Promise<LiveClubConnectAccount> {
  const current = await getClubStripeAccount(supabase, clubId);
  if (!current?.providerAccountId) {
    return { account: current, stripeAccount: null };
  }

  const stripe = getStripe();
  const stripeAccount = await stripe.accounts.retrieve(current.providerAccountId);
  const account = await syncStripeAccountRow(
    supabase,
    clubId,
    stripeAccount,
    current.id
  );
  return { account, stripeAccount };
}

async function clubContact(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("company_name, company_email")
    .eq("user_id", clubId)
    .maybeSingle();
  return data;
}

/**
 * Garantit un unique Connected Account Express par club.
 * Réutilise `club_payment_accounts.provider_account_id` s’il existe déjà.
 * Ne recrée jamais un compte Stripe pour un module différent.
 */
export async function ensureClubConnectedAccount(params: {
  supabase: SupabaseClient;
  clubId: string;
}): Promise<ClubPaymentAccount> {
  const { supabase, clubId } = params;
  const existing = await getClubStripeAccount(supabase, clubId);

  if (existing?.providerAccountId) {
    try {
      const stripe = getStripe();
      const retrieved = await stripe.accounts.retrieve(existing.providerAccountId);
      return syncStripeAccountRow(supabase, clubId, retrieved, existing.id);
    } catch (error) {
      console.warn("[PAYMENTS][connect] retrieve existing account", error);
      return existing;
    }
  }

  const stripe = getStripe();
  const profile = await clubContact(clubId);
  const created = await stripe.accounts.create({
    type: "express",
    country: "CH",
    email: profile?.company_email || undefined,
    business_profile: profile?.company_name
      ? { name: profile.company_name.slice(0, 80) }
      : undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      club_id: clubId,
      obillz_purpose: "club_payments",
    },
  });

  return syncStripeAccountRow(supabase, clubId, created, existing?.id);
}
