import { createAdminClient } from "@/lib/supabase/admin";

/** Enregistre un versement Stripe vers la banque. N'échoue pas l'appelant : le webhook doit accuser réception. */
export async function recordClubStripePayout(input: {
  connectedAccountId: string | null;
  payoutId: string;
  amountCents: number;
  arrivalDate: number | null;
  currency: string | null;
}): Promise<void> {
  if (!input.connectedAccountId || !input.payoutId) return;
  if ((input.currency || "chf").toLowerCase() !== "chf") {
    console.error("[ACCOUNTING][payout] devise ignorée", input.currency);
    return;
  }
  const amount = Math.round(input.amountCents) / 100;
  if (amount <= 0) return;
  const paidOn = input.arrivalDate
    ? new Date(input.arrivalDate * 1000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  try {
    const admin = createAdminClient();
    const { data: account, error: accountError } = await admin
      .from("club_payment_accounts")
      .select("club_id")
      .eq("provider", "stripe")
      .eq("provider_account_id", input.connectedAccountId)
      .maybeSingle();
    if (accountError || !account?.club_id) {
      console.error("[ACCOUNTING][payout] club introuvable", input.connectedAccountId);
      return;
    }
    const { error } = await admin.rpc("accounting_record_stripe_payout", {
      p_club: account.club_id,
      p_payout: input.payoutId,
      p_amount: amount,
      p_paid_on: paidOn,
    });
    if (error) console.error("[ACCOUNTING][payout]", error.message);
  } catch (error) {
    console.error("[ACCOUNTING][payout]", error);
  }
}
