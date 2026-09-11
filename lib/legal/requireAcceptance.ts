import { LEGAL_ACCEPTANCE_ERROR } from "@/lib/legal/versions";

/** Case d’acceptation CGU/DPA : uniquement `true` strict (jamais une chaîne). */
export function isLegalAccepted(value: unknown): boolean {
  return value === true;
}

export function legalAcceptanceError(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return LEGAL_ACCEPTANCE_ERROR;
  }
  if (!isLegalAccepted((body as { acceptLegal?: unknown }).acceptLegal)) {
    return LEGAL_ACCEPTANCE_ERROR;
  }
  return null;
}
