import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupporterActive } from "@/lib/supporters/status";
import { appBaseUrl } from "@/lib/payments/connect/stripe-client";

export const runtime = "nodejs";

/**
 * Statut public post-paiement : pas d’email, téléphone, Stripe.
 * L’activation n’est jamais déduite du simple retour /succes.
 */
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("supporters")
      .select("id, status, start_date, end_date, card_token, club_id")
      .eq("id", id)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    }

    const valid = isSupporterActive({
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
    });

    return NextResponse.json({
      status: data.status,
      active: valid,
      cardUrl:
        valid && data.card_token
          ? `${appBaseUrl()}/supporter/card/${data.card_token}`
          : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
