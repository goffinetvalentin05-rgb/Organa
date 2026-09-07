import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OBILLZ_BRAND_PRIMARY } from "@/lib/public-page/colors";
import { resolveMembershipPaymentMethod } from "@/lib/quotes/payment-method";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!token || token.length < 16) {
      return NextResponse.json({ error: "Lien invalide." }, { status: 404 });
    }

    const supabase = createAdminClient();
    const { data: document, error } = await supabase
      .from("documents")
      .select(
        "id, user_id, type, status, title, numero, total_ttc, payment_method, date_echeance, client:clients(nom)"
      )
      .eq("payment_token", token)
      .eq("type", "quote")
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !document) {
      return NextResponse.json({ error: "Cotisation introuvable." }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, logo_url, primary_color")
      .eq("user_id", document.user_id)
      .maybeSingle();

    const client = Array.isArray(document.client) ? document.client[0] : document.client;
    const method = resolveMembershipPaymentMethod(document.payment_method);
    const paid = document.status === "accepte";

    return NextResponse.json({
      title: document.title || "Cotisation",
      numero: document.numero,
      memberName: (client as { nom?: string } | null)?.nom || "Membre",
      amount: Number(document.total_ttc) || 0,
      currency: "CHF",
      status: paid ? "paid" : document.status === "refuse" ? "cancelled" : "pending",
      dueDate: document.date_echeance,
      paymentMethod: method,
      canPay: method === "stripe" && !paid && document.status !== "refuse",
      clubName: profile?.company_name || "Club",
      logoUrl: profile?.logo_url || null,
      primaryColor: profile?.primary_color || OBILLZ_BRAND_PRIMARY,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
