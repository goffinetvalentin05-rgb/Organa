import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveResendFromProfile } from "@/lib/email/resend-delivery";

type AdminSupabase = SupabaseClient;

export type PlanningSignupConfirmationEmailParams = {
  toEmail: string;
  volunteerName: string;
  eventName: string;
  slotName: string;
  slotDateLabel: string;
  startTime: string;
  endTime: string;
  clubName: string;
};

/**
 * Email de confirmation d’inscription bénévole (même contenu que l’ancien envoi Resend du lien public).
 * Le flux public ne l’appelle plus (page de confirmation à la place) ; conservé pour un renvoi manuel
 * ou une intégration future. Les affectations dashboard utilisent toujours l’email dédié dans
 * `app/api/plannings/[id]/assignments/route.ts`.
 */
export async function sendPlanningSignupConfirmationEmail(
  supabase: AdminSupabase,
  clubUserId: string,
  params: PlanningSignupConfirmationEmailParams
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled"
    )
    .eq("user_id", clubUserId)
    .maybeSingle();

  const delivery = resolveResendFromProfile({
    company_name: profile?.company_name,
    company_email: profile?.company_email,
    email_sender_name: profile?.email_sender_name,
    email_sender_email: profile?.email_sender_email,
    resend_api_key: profile?.resend_api_key,
    email_custom_enabled: profile?.email_custom_enabled,
  });
  if (!delivery) return;

  const resend = delivery.resend;
  const subject = "Confirmation - inscription benevole";
  const {
    toEmail,
    volunteerName,
    eventName,
    slotName,
    slotDateLabel,
    startTime,
    endTime,
    clubName,
  } = params;

  const html = `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
              <p>Bonjour ${volunteerName},</p>
              <p>Votre inscription est confirmee pour l'evenement suivant :</p>
              <p>
                <strong>Evenement :</strong> ${eventName}<br/>
                <strong>Poste :</strong> ${slotName}<br/>
                ${slotDateLabel ? `<strong>Date :</strong> ${slotDateLabel}<br/>` : ""}
                <strong>Horaire :</strong> ${startTime} - ${endTime}
              </p>
              <p>Merci pour votre aide !</p>
              <p>${clubName}</p>
              <p style="font-size: 12px; color: #6b7280;">Si vous avez une question, contactez le club.</p>
            </div>
          `;

  const text = `Bonjour ${volunteerName},

Votre inscription est confirmee pour l'evenement suivant :

Evenement : ${eventName}
Poste : ${slotName}
${slotDateLabel ? `Date : ${slotDateLabel}\n` : ""}Horaire : ${startTime} - ${endTime}

Merci pour votre aide !

${clubName}

Si vous avez une question, contactez le club.`;

  await resend.emails.send({
    from: delivery.from,
    to: [toEmail],
    subject,
    html,
    text,
  });
}
