import { Resend } from "resend";

type ClubEmailConfig = {
  clubName: string;
  clubEmail: string;
  senderName?: string | null;
  senderEmail?: string | null;
  resendApiKey?: string | null;
};

type RequestPayload = {
  date: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  eventType: string;
  message?: string | null;
};

function getFromAddress(config: ClubEmailConfig) {
  const senderEmail = config.senderEmail || config.clubEmail;
  if (config.senderName) return `${config.senderName} <${senderEmail}>`;
  return senderEmail;
}

function canSend(config: ClubEmailConfig) {
  return Boolean(config.resendApiKey && getFromAddress(config));
}

export async function sendRequestReceivedToClub(
  config: ClubEmailConfig,
  payload: RequestPayload,
  manageUrl: string
) {
  if (!canSend(config)) return;
  const resend = new Resend(config.resendApiKey);
  const subject = `Nouvelle demande buvette - ${payload.date}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>Nouvelle demande de réservation buvette</h2>
      <p><strong>Date demandée :</strong> ${payload.date}</p>
      <p><strong>Nom :</strong> ${payload.firstName} ${payload.lastName}</p>
      <p><strong>Email :</strong> ${payload.email}</p>
      <p><strong>Téléphone :</strong> ${payload.phone || "-"}</p>
      <p><strong>Type d'événement :</strong> ${payload.eventType}</p>
      <p><strong>Message :</strong><br/>${payload.message || "-"}</p>
      <div style="margin-top: 24px;">
        <a href="${manageUrl}" style="display:inline-block;padding:10px 16px;background:#6D5EF8;color:#fff;text-decoration:none;border-radius:8px;margin-right:8px;">
          Gérer la demande
        </a>
      </div>
      <p style="color:#666;margin-top:16px;">Depuis l'interface, vous pouvez accepter ou refuser.</p>
    </div>
  `;

  await resend.emails.send({
    from: getFromAddress(config),
    to: [config.clubEmail],
    subject,
    html,
  });
}

export async function sendPendingConfirmationToRequester(
  config: ClubEmailConfig,
  payload: RequestPayload
) {
  if (!canSend(config)) return;
  const resend = new Resend(config.resendApiKey);
  const subject = `Votre demande buvette est en cours de validation`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>Demande bien reçue</h2>
      <p>Bonjour ${payload.firstName},</p>
      <p>Votre demande pour le <strong>${payload.date}</strong> a bien été reçue par ${config.clubName}.</p>
      <p>Votre demande est en cours de validation.</p>
    </div>
  `;

  await resend.emails.send({
    from: getFromAddress(config),
    to: [payload.email],
    subject,
    html,
  });
}

export async function sendDecisionToRequester(
  config: ClubEmailConfig,
  payload: Pick<RequestPayload, "firstName" | "email" | "date">,
  decision: "accepted" | "refused"
) {
  if (!canSend(config)) return;
  const resend = new Resend(config.resendApiKey);
  const accepted = decision === "accepted";
  const subject = accepted
    ? "Votre réservation buvette est confirmée"
    : "Votre demande buvette n'a pas été acceptée";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <p>Bonjour ${payload.firstName},</p>
      <p>
        ${
          accepted
            ? `Votre réservation pour le <strong>${payload.date}</strong> est confirmée.`
            : `Votre demande pour le <strong>${payload.date}</strong> n'a pas été acceptée.`
        }
      </p>
      <p>Cordialement,<br/>${config.clubName}</p>
    </div>
  `;

  await resend.emails.send({
    from: getFromAddress(config),
    to: [payload.email],
    subject,
    html,
  });
}
