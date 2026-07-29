/**
 * Références de paiement Swiss QR Bill.
 *
 * Toute la logique de format (checksum modulo 10 récursif, détection QR-IBAN,
 * formatage) provient des utilitaires officiels de `swissqrbill`. Rien n'est
 * réimplémenté ici : ce module se limite à dériver une référence *stable* à
 * partir de l'identité du club et du numéro de document.
 *
 * Deux cas selon le compte du club :
 * - QR-IBAN  -> référence QRR obligatoire (27 chiffres)
 * - IBAN std -> aucune référence structurée (type NON), le numéro de document
 *               part dans la communication libre
 */

import {
  calculateQRReferenceChecksum,
  formatQRReference,
  isQRIBAN as isQRIBANOfficial,
} from "swissqrbill/utils";

/** Détermine si le compte est un QR-IBAN (exige une référence QRR). */
export function isQRIBAN(iban: string): boolean {
  if (!iban) return false;
  try {
    return isQRIBANOfficial(iban.replace(/\s/g, "").toUpperCase());
  } catch {
    return false;
  }
}

/**
 * Communication libre utilisée avec un IBAN standard (référence de type NON).
 * Limitée à 140 caractères par la norme.
 */
export function buildFreeReference(documentNumber: string): string {
  return documentNumber.trim().substring(0, 140);
}

/**
 * Dérive une référence QRR de 27 chiffres, déterministe et stable.
 *
 * Le même couple (club, numéro de document) produit toujours la même
 * référence, ce qui garantit qu'une régénération du PDF n'invente jamais une
 * nouvelle référence. Le chiffre de contrôle est calculé par la librairie.
 *
 * Structure : 6 chiffres dérivés du club + 20 chiffres du numéro de document
 * + 1 chiffre de contrôle.
 */
export function generateQRRReference(clubId: string, documentNumber: string): string {
  const clubDigits = digitsFrom(clubId).substring(0, 6).padStart(6, "0");
  const docDigits = digitsFrom(documentNumber).slice(-20).padStart(20, "0");

  const payload = `${clubDigits}${docDigits}`.substring(0, 26);
  return payload + calculateQRReferenceChecksum(payload);
}

/** Formatage d'affichage officiel : "XX XXXXX XXXXX XXXXX XXXXX XXXXX". */
export function formatQRRReference(reference: string): string {
  try {
    return formatQRReference(reference.replace(/\s/g, ""));
  } catch {
    return reference;
  }
}

/**
 * Réduit une chaîne quelconque à ses chiffres. Si elle n'en contient aucun,
 * on dérive une suite numérique stable depuis ses caractères pour ne jamais
 * retomber sur une référence entièrement nulle.
 */
function digitsFrom(value: string): string {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length > 0) return digits;

  let derived = "";
  for (const char of value || "") {
    derived += String(char.charCodeAt(0) % 10);
  }
  return derived || "0";
}
