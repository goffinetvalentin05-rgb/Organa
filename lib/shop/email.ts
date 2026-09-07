import { createAdminClient } from "@/lib/supabase/admin";
import { resolveResendFromProfile, type ClubResendProfile } from "@/lib/email/resend-delivery";
import { formatChf } from "./money";
import { appBaseUrl } from "./stripe-connect";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendOrderPaidEmails(orderId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("shop_orders")
    .select(
      "id, club_id, order_number, customer_first_name, customer_last_name, customer_email, pickup_info, total_cents, currency, emails_sent_at, payment_status"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.payment_status !== "paid") return;
  if (order.emails_sent_at) return;

  const { data: items } = await supabase
    .from("shop_order_items")
    .select("product_name, variant_label, quantity, unit_price_cents, line_total_cents")
    .eq("order_id", order.id);

  const { data: settings } = await supabase
    .from("shop_settings")
    .select("display_name, orders_email, pickup_info")
    .eq("club_id", order.club_id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled"
    )
    .eq("user_id", order.club_id)
    .maybeSingle();

  const clubName =
    settings?.display_name?.trim() || profile?.company_name?.trim() || "Club";
  const clubEmail =
    settings?.orders_email?.trim() || profile?.company_email?.trim() || null;
  const pickup = order.pickup_info || settings?.pickup_info || "";

  const delivery = resolveResendFromProfile(profile as ClubResendProfile);
  if (!delivery) {
    console.warn("[SHOP][email] aucun prestataire Resend configuré");
    return;
  }

  const linesHtml = (items || [])
    .map((item) => {
      const variant = item.variant_label ? ` — ${escapeHtml(item.variant_label)}` : "";
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.product_name)}${variant} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${formatChf(item.line_total_cents)}</td>
      </tr>`;
    })
    .join("");

  const manageUrl = `${appBaseUrl()}/tableau-de-bord/boutique?tab=commandes`;

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0F172A;">
      <h2>Merci pour votre commande auprès de ${escapeHtml(clubName)}.</h2>
      <p>Bonjour ${escapeHtml(order.customer_first_name)},</p>
      <p>Votre paiement a bien été reçu. Voici le récapitulatif :</p>
      <p><strong>N° commande :</strong> ${escapeHtml(order.order_number)}</p>
      <table style="width:100%;border-collapse:collapse;">${linesHtml}</table>
      <p style="margin-top:16px;font-size:16px;"><strong>Total : ${formatChf(order.total_cents)}</strong></p>
      ${
        pickup
          ? `<div style="margin-top:20px;padding:16px;background:#F4F7FB;border-radius:12px;">
              <strong>Retrait au club</strong>
              <p style="margin:8px 0 0;">${escapeHtml(pickup)}</p>
            </div>`
          : ""
      }
      <p style="color:#64748B;margin-top:24px;font-size:13px;">Cet e-mail a été envoyé via Obillz.</p>
    </div>
  `;

  await delivery.resend.emails.send({
    from: delivery.from,
    to: [order.customer_email],
    subject: `Merci pour votre commande auprès de ${clubName}`,
    html: customerHtml,
  });

  if (clubEmail) {
    const clubHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0F172A;">
        <h2>Nouvelle commande boutique — ${escapeHtml(order.order_number)}</h2>
        <p><strong>Client :</strong> ${escapeHtml(order.customer_first_name)} ${escapeHtml(order.customer_last_name)}</p>
        <p><strong>E-mail :</strong> ${escapeHtml(order.customer_email)}</p>
        <table style="width:100%;border-collapse:collapse;">${linesHtml}</table>
        <p style="margin-top:16px;"><strong>Total : ${formatChf(order.total_cents)}</strong></p>
        <p style="margin-top:24px;">
          <a href="${manageUrl}" style="display:inline-block;padding:10px 16px;background:#1A23FF;color:#fff;text-decoration:none;border-radius:10px;">
            Voir la commande
          </a>
        </p>
      </div>
    `;
    await delivery.resend.emails.send({
      from: delivery.from,
      to: [clubEmail],
      subject: `Nouvelle commande boutique ${order.order_number}`,
      html: clubHtml,
    });
  }

  await supabase
    .from("shop_orders")
    .update({ emails_sent_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("club_id", order.club_id)
    .is("emails_sent_at", null);
}
