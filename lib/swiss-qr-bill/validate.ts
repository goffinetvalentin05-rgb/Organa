/**
 * Validation des données Swiss QR Bill avant génération.
 * Conforme aux règles SIX Group Swiss QR Bill v2.2.
 */

import type { QRBillData, QRBillValidationResult, QRBillValidationError } from "./types";

/**
 * Valide un IBAN CH/LI de base (format uniquement, pas checksum complet).
 */
export function isValidSwissIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  if (cleaned.length !== 21) return false;
  if (!cleaned.startsWith("CH") && !cleaned.startsWith("LI")) return false;
  if (!/^[A-Z]{2}[0-9]{2}[0-9A-Z]+$/.test(cleaned)) return false;
  return true;
}

/**
 * Validation complète des données pour la génération Swiss QR Bill.
 * Retourne un résultat avec les erreurs de validation.
 */
export function validateQRBillData(data: Partial<QRBillData>): QRBillValidationResult {
  const errors: QRBillValidationError[] = [];

  // --- CRÉANCIER ---
  if (!data.creditor) {
    errors.push({ field: "creditor", message: "Les informations du bénéficiaire sont manquantes." });
    return { valid: false, errors };
  }

  const { creditor } = data;

  if (!creditor.account || creditor.account.trim() === "") {
    errors.push({
      field: "iban",
      message: "L'IBAN du bénéficiaire est manquant. Configurez-le dans Paramètres > Paiements.",
    });
  } else if (!isValidSwissIBAN(creditor.account)) {
    errors.push({
      field: "iban",
      message: `L'IBAN "${creditor.account}" n'est pas un IBAN suisse valide (format CH/LI, 21 caractères).`,
    });
  }

  if (!creditor.name || creditor.name.trim() === "") {
    errors.push({
      field: "creditor.name",
      message: "Le nom du bénéficiaire est manquant. Configurez-le dans Paramètres > Paiements.",
    });
  } else if (creditor.name.length > 70) {
    errors.push({
      field: "creditor.name",
      message: "Le nom du bénéficiaire ne peut pas dépasser 70 caractères.",
    });
  }

  if (!creditor.zip || String(creditor.zip).trim() === "") {
    errors.push({
      field: "creditor.zip",
      message: "Le code postal du bénéficiaire est manquant. Configurez-le dans Paramètres > Paiements.",
    });
  }

  if (!creditor.city || creditor.city.trim() === "") {
    errors.push({
      field: "creditor.city",
      message: "La ville du bénéficiaire est manquante. Configurez-la dans Paramètres > Paiements.",
    });
  }

  if (!creditor.country || creditor.country.trim() === "") {
    errors.push({
      field: "creditor.country",
      message: "Le pays du bénéficiaire est manquant (ex. CH).",
    });
  }

  // --- DÉBITEUR (optionnel mais si présent, valider) ---
  if (data.debtor) {
    const { debtor } = data;
    if (!debtor.name || debtor.name.trim() === "") {
      errors.push({ field: "debtor.name", message: "Le nom du débiteur est manquant." });
    }
    if (!debtor.zip || String(debtor.zip).trim() === "") {
      errors.push({ field: "debtor.zip", message: "Le code postal du débiteur est manquant." });
    }
    if (!debtor.city || debtor.city.trim() === "") {
      errors.push({ field: "debtor.city", message: "La ville du débiteur est manquante." });
    }
    if (!debtor.country || debtor.country.trim() === "") {
      errors.push({ field: "debtor.country", message: "Le pays du débiteur est manquant." });
    }
  }

  // --- DEVISE ---
  if (!data.currency || !["CHF", "EUR"].includes(data.currency)) {
    errors.push({
      field: "currency",
      message: "La devise doit être CHF ou EUR.",
    });
  }

  // --- MONTANT ---
  if (data.amount !== undefined && data.amount !== null) {
    if (isNaN(data.amount) || data.amount < 0.01) {
      errors.push({
        field: "amount",
        message: "Le montant doit être supérieur à 0.",
      });
    }
    if (data.amount > 999999999.99) {
      errors.push({
        field: "amount",
        message: "Le montant dépasse la limite autorisée (999 999 999.99).",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Retourne un message d'erreur lisible depuis un résultat de validation.
 */
export function formatValidationErrors(result: QRBillValidationResult): string {
  return result.errors.map((e) => `• ${e.message}`).join("\n");
}
