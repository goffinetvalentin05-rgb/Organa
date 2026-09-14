import { createAdminClient } from "@/lib/supabase/admin";
import { resolveResendFromProfile, type ClubResendProfile } from "@/lib/email/resend-delivery";
import { appBaseUrl } from "@/lib/payments/connect/stripe-client";
import { formatChf } from "@/lib/shop/money";
import { SUPPORTER_SELECT } from "./types";
import type { SupporterRow } from "./types";
import { formatSwissDateLong } from "./format";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendSupporterWelcomeEmail(supporterId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("supporters")
    .select(`${SUPPORTER_SELECT}, offer:supporter_offers(name)`)
    .eq("id", supporterId)
    .maybeSingle();

  if (!data) return;
  const row = data as SupporterRow & {
    offer: { name: string } | { name: string }[] | null;
  };
  if (row.status !== "active") return;
  if (row.emails_sent_at) return;
  if (!row.card_token || !row.email) return;

  const offer = Array.isArray(row.offer) ? row.offer[0] : row.offer;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled"
    )
    .eq("user_id", row.club_id)
    .maybeSingle();

  const clubName = profile?.company_name?.trim() || "Club";
  const delivery = resolveResendFromProfile(profile as ClubResendProfile);
  if (!delivery) {
    console.warn("[SUPPORTERS][email] aucun prestataire Resend configuré");
    return;
  }

  const cardUrl = `${appBaseUrl()}/supporter/card/${row.card_token}`;
  const amount = formatChf(row.amount_paid_cents || 0);
  const validity = formatSwissDateLong(row.end_date) || "selon l’offre";
  const offerName = offer?.name || "Supporter";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0F172A;">
      <h2>Bienvenue parmi les supporters du ${escapeHtml(clubName)}</h2>
      <p>Bonjour ${escapeHtml(row.first_name)},</p>
      <p>Merci pour votre soutien au ${escapeHtml(clubName)}.</p>
      <p>Votre adhésion <strong>${escapeHtml(offerName)}</strong> est maintenant active.</p>
      <p><strong>Montant :</strong> ${escapeHtml(amount)}</p>
      <p><strong>Validité :</strong> jusqu’au ${escapeHtml(validity)}</p>
      <p style="margin:28px 0;">
        <a href="${escapeHtml(cardUrl)}" style="display:inline-block;padding:12px 20px;background:#1A23FF;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;">
          Voir ma carte supporter
        </a>
      </p>
      <p>À bientôt,<br/>${escapeHtml(clubName)}</p>
    </div>
  `;

  await delivery.resend.emails.send({
    from: delivery.from,
    to: [row.email],
    subject: `Bienvenue parmi les supporters du ${clubName}`,
    html,
  });

  await supabase
    .from("supporters")
    .update({ emails_sent_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("club_id", row.club_id)
    .is("emails_sent_at", null);
}
