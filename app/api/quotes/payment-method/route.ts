import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import {
  getClubMembershipPaymentMethod,
  isClubStripeReadyForCharges,
  setClubMembershipPaymentMethod,
} from "@/lib/quotes/membership-settings";
import { parseMembershipPaymentMethod } from "@/lib/quotes/payment-method";

export const runtime = "nodejs";

async function requireQuotesAccess(mode: "view" | "manage") {
  const perm =
    mode === "manage" ? PERMISSIONS.MANAGE_INVOICES : PERMISSIONS.VIEW_INVOICES;
  const primary = await requirePermission(perm);
  if (!("error" in primary)) return primary;
  const fallback = await requirePermission(
    mode === "manage" ? PERMISSIONS.MANAGE_DOCUMENTS : PERMISSIONS.VIEW_DOCUMENTS
  );
  return fallback;
}

export async function GET() {
  try {
    const guard = await requireQuotesAccess("view");
    if ("error" in guard) return guard.error;
    const supabase = await createClient();
    const [method, stripeReady] = await Promise.all([
      getClubMembershipPaymentMethod(supabase, guard.clubId),
      isClubStripeReadyForCharges(supabase, guard.clubId),
    ]);
    return NextResponse.json({ method, stripeReady });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const guard = await requireQuotesAccess("manage");
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;

    const body = (await request.json().catch(() => ({}))) as { method?: unknown };
    const method = parseMembershipPaymentMethod(body.method);
    if (!method) {
      return NextResponse.json({ error: "Méthode d’encaissement invalide." }, { status: 400 });
    }

    const supabase = await createClient();
    if (method === "stripe") {
      const ready = await isClubStripeReadyForCharges(supabase, guard.clubId);
      if (!ready) {
        return NextResponse.json(
          { error: "Compte de paiement non configuré." },
          { status: 400 }
        );
      }
    }

    await setClubMembershipPaymentMethod(supabase, guard.clubId, method);
    const stripeReady = await isClubStripeReadyForCharges(supabase, guard.clubId);
    return NextResponse.json({ method, stripeReady });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
