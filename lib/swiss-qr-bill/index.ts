/**
 * Module Swiss QR Bill — Obillz
 *
 * Point d'entrée unique de la logique QR-facture. Le format, la validation et
 * le rendu proviennent de la librairie `swissqrbill` (conforme SIX Group) ;
 * ce module n'ajoute que l'intégration métier Obillz.
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
  renderQRBillSlipPdf,
  QR_BILL_WIDTH_PT,
  QR_BILL_HEIGHT_PT,
} from "./generate-pdf";
