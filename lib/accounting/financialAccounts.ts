/** Compte bancaire principal : code stable utilisé par les mappings automatiques. */
export const PRIMARY_BANK_CODE = "bank";

export function extraBankSystemCode(number: string): string {
  return `bank_${number}`;
}

/** Banque ajoutée à l’onboarding : bank_1021, pas bank_fees. */
export function isExtraBankSystemCode(code: string | null | undefined): boolean {
  return typeof code === "string" && /^bank_\d+$/.test(code);
}

export function isBankSystemCode(code: string | null | undefined): boolean {
  return code === PRIMARY_BANK_CODE || isExtraBankSystemCode(code);
}

/** Banque, caisse, Stripe, ou banque ajoutée à l’onboarding. */
export function isFinancialSystemCode(code: string | null | undefined): boolean {
  return isBankSystemCode(code) || code === "cash" || code === "stripe";
}
