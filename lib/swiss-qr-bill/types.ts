/**
 * Types Swiss QR Bill — conformes aux spécifications SIX Group
 * https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/qr-bill.html
 */

export interface QRBillCreditor {
  /** Nom du bénéficiaire (max 70 car.) */
  name: string;
  /** Rue (max 70 car.) */
  street?: string;
  /** Numéro de bâtiment (max 16 car.) */
  buildingNumber?: string | number;
  /** NPA (max 16 car.) */
  zip: string | number;
  /** Ville (max 35 car.) */
  city: string;
  /** Pays ISO 3166-1 alpha-2 */
  country: string;
  /** IBAN (CH ou liechtenstein, ou QR-IBAN commençant par CH31) */
  account: string;
}

export interface QRBillDebtor {
  /** Nom du débiteur (max 70 car.) */
  name: string;
  /** Rue (max 70 car.) */
  street?: string;
  /** Numéro de bâtiment (max 16 car.) */
  buildingNumber?: string | number;
  /** NPA (max 16 car.) */
  zip: string | number;
  /** Ville (max 35 car.) */
  city: string;
  /** Pays ISO 3166-1 alpha-2 */
  country: string;
}

export interface QRBillData {
  creditor: QRBillCreditor;
  debtor?: QRBillDebtor;
  /** Montant (null = montant libre) */
  amount?: number;
  /** Devise : CHF ou EUR */
  currency: "CHF" | "EUR";
  /** Référence NON ou SCOR (optionnel si type NON) */
  reference?: string;
  /** Message libre (max 140 car.) */
  message?: string;
  /** Langue d'affichage */
  language?: "DE" | "FR" | "IT" | "EN" | "RM";
}

export interface QRBillValidationError {
  field: string;
  message: string;
}

export interface QRBillValidationResult {
  valid: boolean;
  errors: QRBillValidationError[];
}
