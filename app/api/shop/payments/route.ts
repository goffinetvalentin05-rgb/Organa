import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { describePaymentReadiness, isPaymentReady } from "@/lib/shop/payment-provider";
import {
  createConnectLoginLink,
  createConnectOnboardingLink,
  getClubStripeAccount,
  refreshStripeAccount,
} from "@/lib/shop/stripe-connect";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

export const runtime = "nodejs";

async function clubContact(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("company_name, company_email")
    .eq("user_id", clubId)
    .maybeSingle();
  return data;
}

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SHOP);
    if ("error" in guard) return guard.error;
    const supabase = await createClient();
    let account = await getClubStripeAccount(supabase, guard.clubId);
    if (account?.providerAccountId) {
      try {
        account = await refreshStripeAccount(supabase, guard.clubId);
      } catch (error) {
        console.warn("[SHOP][payments] refresh", error);
      }
    }
    const readiness = describePaymentReadiness(account);
    return NextResponse.json({
      account,
      ready: isPaymentReady(account),
      incomplete: readiness.incomplete,
      label: readiness.label,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SHOP);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;

    const supabase = await createClient();
    const profile = await clubContact(guard.clubId);
    const { url, account } = await createConnectOnboardingLink({
      supabase,
      clubId: guard.clubId,
      clubEmail: profile?.company_email,
      clubName: profile?.company_name,
    });
    return NextResponse.json({ url, account });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[SHOP][payments] connect", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SHOP);
    if ("error" in guard) return guard.error;
    const supabase = await createClient();
    const account = await getClubStripeAccount(supabase, guard.clubId);
    if (!account?.providerAccountId) {
      return NextResponse.json({ error: "Aucun compte Stripe connecté." }, { status: 400 });
    }
    const url = await createConnectLoginLink(account.providerAccountId);
    return NextResponse.json({ url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
