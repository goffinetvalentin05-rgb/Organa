/**
 * Module Swiss QR Bill — Obillz
 *
 * Point d'entrée unique pour toute la logique QR Bill.
 * Conformité : SIX Group Swiss QR Bill v2.2
 */

export type {
  QRBillData,
  QRBillCreditor,
  QRBillDebtor,
  QRBillValidationError,
  QRBillValidationResult,
} from "./types";

export {
  isQRIBAN,
  generateQRRReference,
  formatQRRReference,
  buildFreeReference,
} from "./reference";

export {
  isValidSwissIBAN,
  validateQRBillData,
  formatValidationErrors,
} from "./validate";

export {
  generateSwissQRBillSVG,
  generateSwissQRBillDataUri,
} from "./generate-svg";
