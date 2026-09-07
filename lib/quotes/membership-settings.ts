import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  getClubStripeAccount,
  snapshotFromAccount,
} from "@/lib/payments/connect/accounts";
import { isPaymentReady } from "@/lib/shop/payment-provider";
import {
  parseMembershipPaymentMethod,
  resolveMembershipPaymentMethod,
  type MembershipPaymentMethod,
} from "./payment-method";

export function createMembershipPaymentToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function getClubMembershipPaymentMethod(
  supabase: SupabaseClient,
  clubId: string
): Promise<MembershipPaymentMethod> {
  const { data } = await supabase
    .from("profiles")
    .select("membership_payment_method")
    .eq("user_id", clubId)
    .maybeSingle();
  return resolveMembershipPaymentMethod(data?.membership_payment_method);
}

export async function setClubMembershipPaymentMethod(
  supabase: SupabaseClient,
  clubId: string,
  method: MembershipPaymentMethod
): Promise<MembershipPaymentMethod> {
  const { error } = await supabase
    .from("profiles")
    .update({ membership_payment_method: method })
    .eq("user_id", clubId);
  if (error) throw error;
  return method;
}

export async function isClubStripeReadyForCharges(
  supabase: SupabaseClient,
  clubId: string
): Promise<boolean> {
  const account = await getClubStripeAccount(supabase, clubId);
  return isPaymentReady(snapshotFromAccount(account));
}

export async function resolveQuotePaymentMethodForInsert(params: {
  supabase: SupabaseClient;
  clubId: string;
  requested: unknown;
}): Promise<{ method: MembershipPaymentMethod; error?: string }> {
  const requested = parseMembershipPaymentMethod(params.requested);
  const method =
    requested ??
    (await getClubMembershipPaymentMethod(params.supabase, params.clubId));

  if (method === "stripe") {
    const ready = await isClubStripeReadyForCharges(params.supabase, params.clubId);
    if (!ready) {
      return {
        method,
        error:
          "Le compte de paiement Stripe n’est pas configuré. Choisissez QR-facture ou configurez Stripe.",
      };
    }
  }

  return { method };
}

export async function clubContactForQuote(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("company_name, logo_url, primary_color")
    .eq("user_id", clubId)
    .maybeSingle();
  return data;
}
