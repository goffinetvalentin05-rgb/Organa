/**
 * Génération de la zone de paiement Swiss QR Bill en PDF vectoriel.
 *
 * `swissqrbill` est conçue pour PDFKit : c'est sa sortie de référence, et la
 * seule qui produise une zone de paiement entièrement vectorielle, aux cotes
 * officielles SIX, avec les polices standard du format PDF (aucun fichier de
 * police à embarquer).
 *
 * On produit ici une page isolée de 210 × 105 mm contenant uniquement le slip.
 * Cette page est ensuite incrustée dans le PDF de la facture par
 * `lib/pdf/mergeQRBill.ts`.
 */

import PDFDocument from "pdfkit";
import { SwissQRBill } from "swissqrbill/pdf";
import { mm2pt } from "swissqrbill/utils";
import type { Data as SwissQRBillPayload } from "swissqrbill/types";
import type { QRBillData } from "./types";
import { isQRIBAN } from "./reference";

/** Largeur de la zone de paiement : 210 mm (pleine largeur A4). */
export const QR_BILL_WIDTH_PT = mm2pt(210);
/** Hauteur de la zone de paiement : 105 mm, imposée par la norme. */
export const QR_BILL_HEIGHT_PT = mm2pt(105);

/**
 * Rend la zone de paiement dans un PDF autonome d'une seule page.
 *
 * @throws si les données sont refusées par la librairie (validation SIX).
 */
export async function renderQRBillSlipPdf(data: QRBillData): Promise<Buffer> {
  const billData = toSwissQRBillPayload(data);

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [QR_BILL_WIDTH_PT, QR_BILL_HEIGHT_PT],
        margin: 0,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // `outlines` et `scissors` sont actifs par défaut : la librairie dessine
      // elle-même les traits de découpe et les ciseaux exigés par la norme.
      const bill = new SwissQRBill(billData, {
        fontName: "Helvetica",
        language: data.language ?? "FR",
      });

      bill.attachTo(doc, 0, 0);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Traduit nos données typées vers la structure attendue par `swissqrbill`.
 *
 * La référence n'est transmise que pour un QR-IBAN : avec un IBAN standard la
 * norme impose le type NON (aucune référence structurée), le numéro de
 * document voyageant alors dans la communication libre.
 */
function toSwissQRBillPayload(data: QRBillData): SwissQRBillPayload {
  const account = data.creditor.account.replace(/\s/g, "").toUpperCase();

  const payload: SwissQRBillPayload = {
    currency: data.currency,
    creditor: {
      account,
      name: data.creditor.name,
      address: data.creditor.street ?? "",
      buildingNumber: data.creditor.buildingNumber,
      zip: data.creditor.zip,
      city: data.creditor.city,
      country: data.creditor.country || "CH",
    },
  };

  // Montant absent = case « montant » laissée vide, à compléter par le payeur.
  if (typeof data.amount === "number" && data.amount > 0) {
    payload.amount = data.amount;
  }

  if (data.debtor) {
    payload.debtor = {
      name: data.debtor.name,
      address: data.debtor.street ?? "",
      buildingNumber: data.debtor.buildingNumber,
      zip: data.debtor.zip,
      city: data.debtor.city,
      country: data.debtor.country || "CH",
    };
  }

  if (isQRIBAN(account) && data.reference) {
    payload.reference = data.reference.replace(/\s/g, "");
  }

  if (data.message) {
    payload.message = data.message.substring(0, 140);
  }

  return payload;
}
