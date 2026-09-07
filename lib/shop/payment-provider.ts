import type {
  ClubPaymentAccount,
  PaymentAccountStatus,
  PaymentProvider,
} from "./types";

/**
 * Abstraction des prestataires de paiement.
 * Le MVP n'implémente que Stripe Connect ; d'autres providers
 * pourront s'ajouter ici sans changer le checkout métier.
 */
export type PaymentAccountSnapshot = {
  provider: PaymentProvider;
  providerAccountId: string | null;
  status: PaymentAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  displayName: string | null;
  accountEmail: string | null;
  livemode: boolean | null;
};

export function isPaymentReady(account: PaymentAccountSnapshot | null | undefined): boolean {
  if (!account) return false;
  if (!account.providerAccountId) return false;
  return account.chargesEnabled && account.detailsSubmitted;
}

export function describePaymentReadiness(
  account: PaymentAccountSnapshot | null | undefined
): {
  ready: boolean;
  incomplete: boolean;
  label: string;
} {
  if (!account || !account.providerAccountId) {
    return {
      ready: false,
      incomplete: false,
      label: "Non connecté",
    };
  }
  if (isPaymentReady(account)) {
    return { ready: true, incomplete: false, label: "Paiements activés" };
  }
  return {
    ready: false,
    incomplete: true,
    label: "Configuration du paiement incomplète",
  };
}

export function toPaymentAccountSnapshot(
  row: ClubPaymentAccount | null | undefined
): PaymentAccountSnapshot | null {
  if (!row) return null;
  return {
    provider: row.provider,
    providerAccountId: row.providerAccountId,
    status: row.status,
    chargesEnabled: row.chargesEnabled,
    payoutsEnabled: row.payoutsEnabled,
    detailsSubmitted: row.detailsSubmitted,
    displayName: row.displayName,
    accountEmail: row.accountEmail,
    livemode: row.livemode,
  };
}

export function deriveAccountStatus(params: {
  providerAccountId: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}): PaymentAccountStatus {
  if (!params.providerAccountId) return "not_connected";
  if (params.chargesEnabled && params.detailsSubmitted) return "complete";
  if (params.detailsSubmitted && !params.chargesEnabled) return "restricted";
  if (params.detailsSubmitted) return "pending";
  return "onboarding";
}
