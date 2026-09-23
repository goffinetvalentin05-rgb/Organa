/** Compte bancaire principal : code stable utilisé par les mappings automatiques. */
export const PRIMARY_BANK_CODE = "bank";

export function extraBankSystemCode(number: string): string {
  return `bank_${number}`;
}

export function isBankSystemCode(code: string | null | undefined): boolean {
  return code === PRIMARY_BANK_CODE || Boolean(code?.startsWith("bank_"));
}

/** Banque, caisse, Stripe, ou banque ajoutée à l’onboarding. */
export function isFinancialSystemCode(code: string | null | undefined): boolean {
  return isBankSystemCode(code) || code === "cash" || code === "stripe";
}
