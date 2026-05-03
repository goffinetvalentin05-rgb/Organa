import { resolveResendFromProfile, type ClubResendProfile } from "@/lib/email/resend-delivery";
import { humanExpiry } from "@/lib/auth/invitations";

/**
 * Email d'invitation à rejoindre un club Obillz.
 *
 * Stratégie d'envoi :
 *   - Si le club a configuré son propre Resend (mode custom), on utilise
 *     son adresse expéditrice (le destinataire reconnaît mieux).
 *   - Sinon : Resend Obillz global (RESEND_API_KEY).
 *   - Sinon : on retourne `{ ok: false, reason: "no_email" }` ; l'app
 *     stocke quand même l'invitation et affiche le lien direct dans
 *     l'interface owner pour qu'il puisse le copier-coller.
 */

export interface InviteEmailInput {
  to: string;
  recipientName: string | null;
  inviterName: string | null;
  clubName: string;
  functionTitle: string | null;
  invitationUrl: string;
  expiresAt: string | Date;
  /** Profil du club (utilisé pour résoudre Resend custom si configuré). */
  clubProfile: ClubResendProfile;
}

export type InviteEmailResult =
  | { ok: true; emailId: string | null; mode: "custom" | "obillz" }
  | { ok: false; reason: "no_email" | "send_failed"; details?: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getFirstName(fullName: string | null): string {
  if (!fullName) return "";
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] || "";
}

export function renderInviteEmailHtml(input: InviteEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const clubName = escapeHtml(input.clubName);
  const recipientFirst = getFirstName(input.recipientName);
  const greeting = recipientFirst
    ? `Bonjour ${escapeHtml(recipientFirst)},`
    : "Bonjour,";
  const inviter = input.inviterName
    ? escapeHtml(input.inviterName)
    : "Un responsable du club";
  const fct = input.functionTitle ? escapeHtml(input.functionTitle) : null;
  const expiry = humanExpiry(input.expiresAt);
  const url = input.invitationUrl;

  const subject = `Invitation à rejoindre ${input.clubName} sur Obillz`;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { margin:0; padding:0; background:#f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1f2937; }
          .wrap { max-width: 560px; margin: 32px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 16px rgba(0,0,0,.06); }
          .head { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color:#ffffff; padding: 28px 32px; }
          .head h1 { margin:0; font-size: 22px; font-weight: 700; letter-spacing:-.01em; }
          .body { padding: 28px 32px; line-height: 1.6; font-size: 15px; }
          .cta { display:inline-block; padding: 12px 22px; background:#2563eb; color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size: 15px; margin: 20px 0 8px; }
          .meta { background:#f9fafb; border-radius:8px; padding: 14px 16px; margin: 16px 0; font-size: 14px; color: #4b5563; }
          .meta strong { color:#111827; }
          .small { font-size: 12px; color:#6b7280; margin-top: 24px; }
          .url-fallback { font-size: 12px; word-break: break-all; color:#374151; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="head">
            <h1>Invitation au club ${clubName}</h1>
          </div>
          <div class="body">
            <p>${greeting}</p>
            <p>${inviter} vous invite à rejoindre <strong>${clubName}</strong> sur Obillz, l'outil de gestion du club.</p>
            <div class="meta">
              ${fct ? `<div><strong>Fonction proposée :</strong> ${fct}</div>` : ""}
              <div><strong>Lien valable jusqu'au :</strong> ${expiry}</div>
            </div>
            <p>Pour accepter cette invitation et accéder à votre espace :</p>
            <p>
              <a href="${url}" class="cta">Accepter l'invitation</a>
            </p>
            <div class="url-fallback">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              ${url}
            </div>
            <p class="small">
              Si vous n'attendiez pas cette invitation, vous pouvez l'ignorer en toute sécurité.
              Le lien expirera automatiquement à la date indiquée ci-dessus.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text =
    `${greeting}\n\n` +
    `${input.inviterName ?? "Un responsable du club"} vous invite à rejoindre ` +
    `${input.clubName} sur Obillz.\n\n` +
    (input.functionTitle ? `Fonction proposée : ${input.functionTitle}\n` : "") +
    `Lien valable jusqu'au : ${expiry}\n\n` +
    `Accepter l'invitation : ${url}\n\n` +
    `Si vous n'attendiez pas cette invitation, ignorez ce message.`;

  return { subject, html, text };
}

export async function sendInvitationEmail(
  input: InviteEmailInput
): Promise<InviteEmailResult> {
  const delivery = resolveResendFromProfile(input.clubProfile);
  if (!delivery) {
    console.warn(
      "[INVITE][email] Aucune config Resend disponible. Stockage de l'invitation sans envoi."
    );
    return { ok: false, reason: "no_email" };
  }

  const { subject, html, text } = renderInviteEmailHtml(input);

  try {
    const { data, error } = await delivery.resend.emails.send({
      from: delivery.from,
      to: [input.to],
      subject,
      html,
      text,
    });

    if (error) {
      const msg =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "Erreur Resend";
      console.error("[INVITE][email] Échec Resend:", msg);
      return { ok: false, reason: "send_failed", details: msg };
    }

    return { ok: true, emailId: data?.id ?? null, mode: delivery.mode };
  } catch (e: any) {
    console.error("[INVITE][email] Exception envoi:", e);
    return {
      ok: false,
      reason: "send_failed",
      details: e?.message ?? "exception",
    };
  }
}
