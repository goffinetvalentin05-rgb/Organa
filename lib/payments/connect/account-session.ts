import type Stripe from "stripe";
import { getStripe } from "./stripe-client";

/**
 * Construit une AccountSession pour les composants Connect Embedded.
 * L’identifiant de compte DOIT venir du serveur (club courant), jamais du client.
 */
export function buildAccountSessionParams(
  connectedAccountId: string
): Stripe.AccountSessionCreateParams {
  return {
    account: connectedAccountId,
    components: {
      account_onboarding: { enabled: true },
      account_management: {
        enabled: true,
        features: { external_account_collection: true },
      },
      notification_banner: {
        enabled: true,
        features: { external_account_collection: true },
      },
    },
  };
}

export async function createClubAccountSession(
  connectedAccountId: string
): Promise<{ clientSecret: string; expiresAt: number }> {
  const stripe = getStripe();
  const session = await stripe.accountSessions.create(
    buildAccountSessionParams(connectedAccountId)
  );
  return {
    clientSecret: session.client_secret,
    expiresAt: session.expires_at,
  };
}
