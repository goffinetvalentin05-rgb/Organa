/**
 * Validation des données Swiss QR Bill avant génération.
 *
 * La validation de l'IBAN (structure + checksum mod-97) est déléguée à
 * `swissqrbill/utils`. Ce module y ajoute les contrôles métier propres à
 * Obillz et surtout des messages d'erreur explicites, affichables tels quels
 * dans l'interface.
 */

import { isIBANValid } from "swissqrbill/utils";
import { isQRIBAN } from "./reference";
import type { QRBillData, QRBillValidationResult, QRBillValidationError } from "./types";

const SETTINGS_HINT = "Paramètres > QR-facture suisse";

/** Valide un IBAN suisse ou liechtensteinois (structure et chiffres de contrôle). */
export function isValidSwissIBAN(iban: string): boolean {
  if (!iban) return false;
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  if (!cleaned.startsWith("CH") && !cleaned.startsWith("LI")) return false;
  try {
    return isIBANValid(cleaned);
  } catch {
    return false;
  }
}

export function validateQRBillData(data: Partial<QRBillData>): QRBillValidationResult {
  const errors: QRBillValidationError[] = [];

  if (!data.creditor) {
    return {
      valid: false,
      errors: [
        {
          field: "creditor",
          message: `Les coordonnées du bénéficiaire sont manquantes. Renseignez-les dans ${SETTINGS_HINT}.`,
        },
      ],
    };
  }

  const { creditor } = data;

  // --- Compte du bénéficiaire ---
  if (!creditor.account?.trim()) {
    errors.push({
      field: "iban",
      message: `L'IBAN du club est manquant. Renseignez-le dans ${SETTINGS_HINT}.`,
    });
  } else if (!isValidSwissIBAN(creditor.account)) {
    errors.push({
      field: "iban",
      message: `L'IBAN « ${creditor.account} » est invalide. Un IBAN suisse commence par CH (ou LI) et comporte 21 caractères.`,
    });
  }

  // --- Identité et adresse du bénéficiaire ---
  if (!creditor.name?.trim()) {
    errors.push({
      field: "creditor.name",
      message: `Le nom du bénéficiaire est manquant. Renseignez-le dans ${SETTINGS_HINT}.`,
    });
  } else if (creditor.name.length > 70) {
    errors.push({
      field: "creditor.name",
      message: "Le nom du bénéficiaire dépasse 70 caractères, limite imposée par la norme.",
    });
  }

  if (!String(creditor.zip ?? "").trim()) {
    errors.push({
      field: "creditor.zip",
      message: `Le NPA du bénéficiaire est manquant. Renseignez-le dans ${SETTINGS_HINT}.`,
    });
  }

  if (!creditor.city?.trim()) {
    errors.push({
      field: "creditor.city",
      message: `La ville du bénéficiaire est manquante. Renseignez-la dans ${SETTINGS_HINT}.`,
    });
  }

  if (!creditor.country?.trim()) {
    errors.push({
      field: "creditor.country",
      message: `Le pays du bénéficiaire est manquant. Renseignez-le dans ${SETTINGS_HINT}.`,
    });
  }

  // --- Débiteur : facultatif, mais complet dès qu'il est fourni ---
  if (data.debtor) {
    const { debtor } = data;
    if (!debtor.name?.trim()) {
      errors.push({ field: "debtor.name", message: "Le nom du destinataire est manquant." });
    }
    if (!String(debtor.zip ?? "").trim()) {
      errors.push({ field: "debtor.zip", message: "Le NPA du destinataire est manquant." });
    }
    if (!debtor.city?.trim()) {
      errors.push({ field: "debtor.city", message: "La ville du destinataire est manquante." });
    }
  }

  // --- Devise ---
  if (!data.currency || !["CHF", "EUR"].includes(data.currency)) {
    errors.push({
      field: "currency",
      message: "La QR-facture n'accepte que les devises CHF et EUR.",
    });
  }

  // --- Montant ---
  if (data.amount !== undefined && data.amount !== null) {
    if (!Number.isFinite(data.amount) || data.amount < 0.01) {
      errors.push({ field: "amount", message: "Le montant doit être supérieur à zéro." });
    } else if (data.amount > 999999999.99) {
      errors.push({
        field: "amount",
        message: "Le montant dépasse le plafond autorisé (999 999 999.99).",
      });
    }
  }

  // --- Cohérence référence / type de compte ---
  if (
    creditor.account &&
    isValidSwissIBAN(creditor.account) &&
    isQRIBAN(creditor.account) &&
    !data.reference?.trim()
  ) {
    errors.push({
      field: "reference",
      message: "Ce compte est un QR-IBAN : il exige une référence QRR, qui n'a pas pu être générée.",
    });
  }

  return { valid: errors.length === 0, errors };
}

/** Met les erreurs en forme pour un affichage utilisateur. */
export function formatValidationErrors(result: QRBillValidationResult): string {
  return result.errors.map((error) => error.message).join(" ");
}
