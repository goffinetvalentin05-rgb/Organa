/**
 * Génération du Swiss QR Bill en SVG via la librairie `swissqrbill`.
 * Compatible avec @react-pdf/renderer via intégration SVG → data URI.
 *
 * Librairie : https://github.com/schoero/swissqrbill
 * Conformité : SIX Group Swiss QR Bill v2.2
 */

import type { QRBillData } from "./types";
import { isQRIBAN } from "./reference";

/**
 * Génère le SVG complet du Swiss QR Bill (payment part A6 + receipt).
 *
 * @param data - Données validées du QR Bill
 * @returns SVG string (outerHTML)
 */
export async function generateSwissQRBillSVG(data: QRBillData): Promise<string> {
  // Import dynamique pour éviter les problèmes SSR et de build
  const { SwissQRBill } = await import("swissqrbill/svg");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const billData = buildSwissQRBillData(data) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrBill = new SwissQRBill(billData, { language: data.language ?? "FR" } as any);

  return qrBill.toString();
}

/**
 * Génère un data URI SVG pour intégration dans @react-pdf/renderer via <Image>.
 *
 * @react-pdf/renderer accepte les data URIs SVG sous forme :
 * "data:image/svg+xml;base64,..."
 *
 * @param data - Données validées du QR Bill
 * @returns data URI string
 */
export async function generateSwissQRBillDataUri(data: QRBillData): Promise<string> {
  const svg = await generateSwissQRBillSVG(data);
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Construit l'objet data attendu par swissqrbill à partir de nos données typées.
 */
function buildSwissQRBillData(data: QRBillData) {
  const useQRIBAN = isQRIBAN(data.creditor.account);

  const billData: Record<string, unknown> = {
    currency: data.currency,
    creditor: {
      account: data.creditor.account.replace(/\s/g, ""),
      name: data.creditor.name,
      address: data.creditor.street ?? "",
      buildingNumber: data.creditor.buildingNumber,
      zip: data.creditor.zip,
      city: data.creditor.city,
      country: data.creditor.country || "CH",
    },
  };

  // Montant : undefined = montant libre (case vide sur le slip)
  if (data.amount !== undefined && data.amount !== null && data.amount > 0) {
    billData.amount = data.amount;
  }

  // Débiteur
  if (data.debtor) {
    billData.debtor = {
      name: data.debtor.name,
      address: data.debtor.street ?? "",
      buildingNumber: data.debtor.buildingNumber,
      zip: data.debtor.zip,
      city: data.debtor.city,
      country: data.debtor.country || "CH",
    };
  }

  // Référence : QRR pour QR-IBAN, NON sinon
  if (useQRIBAN && data.reference) {
    billData.reference = data.reference.replace(/\s/g, "");
  }
  // Pour IBAN standard (NON), pas de référence structurée

  // Message libre (communication)
  if (data.message) {
    billData.message = data.message.substring(0, 140);
  }

  return billData;
}
