/**
 * Génération de la référence Swiss QR Bill (type NON — sans référence structurée).
 *
 * Pour les clubs qui utilisent un IBAN standard (non QR-IBAN),
 * le type de référence est NON (pas de référence structurée).
 * La communication libre est utilisée pour identifier la facture.
 *
 * Pour les clubs qui auraient un QR-IBAN (CH31...), la référence QRR
 * (27 chiffres avec chiffre de contrôle modulo 10 récursif) peut être générée.
 *
 * Référence : SIX Payment Standards — Swiss QR Bill, version 2.2
 */

/**
 * Détermine si un IBAN est un QR-IBAN (commence par CH31).
 */
export function isQRIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  // QR-IBAN : CH suivi de 31 en positions 3-4 du BBAN (check digits 31)
  // En pratique : commence par CH et le BBAN commence par 3... vérif sur les positions 2-3
  // Règle officielle : IID (banque) est comprise entre 30000 et 31999
  if (!cleaned.startsWith("CH")) return false;
  const iid = parseInt(cleaned.substring(4, 9), 10);
  return iid >= 30000 && iid <= 31999;
}

/**
 * Génère un identifiant de référence stable à partir du numéro de document.
 * Utilisé comme communication libre (type NON) pour les IBAN standards.
 *
 * @param documentNumber - ex. "FAC-2024-001" ou "COT-2024-042"
 * @returns chaîne nettoyée, max 140 car.
 */
export function buildFreeReference(documentNumber: string): string {
  return documentNumber.substring(0, 140);
}

/**
 * Calcule le chiffre de contrôle modulo 10 récursif (norme QRR).
 * Table de contrôle officielle SIX.
 */
const MOD10_TABLE = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];

function mod10Recursive(payload: string): number {
  let carry = 0;
  for (const char of payload) {
    carry = MOD10_TABLE[(carry + parseInt(char, 10)) % 10];
  }
  return (10 - carry) % 10;
}

/**
 * Génère une référence QRR (27 chiffres) à partir d'un numéro de document.
 * La référence est déterministe : le même numéro produit toujours la même référence.
 *
 * Format QRR :
 * - 26 chiffres payload (numéro club 6 + numéro document 20)
 * - 1 chiffre de contrôle (mod10 récursif)
 *
 * @param clubId - ID du club (UUID) — utilisé pour dériver un identifiant court
 * @param documentNumber - Numéro de document (ex. "FAC-2024-001")
 * @returns chaîne de 27 chiffres sans espaces
 */
export function generateQRRReference(clubId: string, documentNumber: string): string {
  // Dériver un identifiant numérique 6 chiffres depuis le club UUID
  const clubHash = clubId.replace(/-/g, "").replace(/[^0-9]/g, "").substring(0, 6).padEnd(6, "0");

  // Nettoyer le numéro de document : garder uniquement les chiffres, pad à 20
  const docDigits = documentNumber.replace(/\D/g, "").substring(0, 20).padStart(20, "0");

  const payload = (clubHash + docDigits).substring(0, 26).padStart(26, "0");
  const checkDigit = mod10Recursive(payload);

  return payload + checkDigit;
}

/**
 * Formate une référence QRR (27 chiffres) selon la norme d'affichage SIX :
 * "XX XXXXX XXXXX XXXXX XXXXX XXXXX"
 */
export function formatQRRReference(ref: string): string {
  const r = ref.replace(/\s/g, "");
  if (r.length !== 27) return ref;
  // Format officiel : 2 + 5 + 5 + 5 + 5 + 5
  return `${r.substring(0, 2)} ${r.substring(2, 7)} ${r.substring(7, 12)} ${r.substring(12, 17)} ${r.substring(17, 22)} ${r.substring(22, 27)}`;
}
