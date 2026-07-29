/**
 * Génération de la zone de paiement Swiss QR Bill en PDF vectoriel.
 *
 * `swissqrbill` est conçue pour PDFKit : c'est sa sortie de référence, et la
 * seule qui produise une zone de paiement entièrement vectorielle, aux cotes
 * officielles SIX, avec les polices standard du format PDF.
 *
 * La librairie n'affiche la ligne de découpe haute et les ciseaux du haut que
 * si `page.height > 105 mm`. On rend donc sur une page de 105 mm + une marge
 * technique minime, puis on normalise le MediaBox à 210 × 105 mm en conservant
 * le bas (le slip), ce qui garde la ligne haute à l'intérieur de la zone.
 */

import PDFDocument from "pdfkit";
import { PDFDocument as PDFLibDocument } from "pdf-lib";
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
 * Marge technique au-dessus du slip pour déclencher outlines/scissors.
 * Doit rester minimale : elle est ensuite retirée via MediaBox.
 */
const OUTLINE_TRIGGER_PT = 2;

/**
 * Rend la zone de paiement dans un PDF autonome 210 × 105 mm,
 * avec ligne de découpe haute et ciseaux officiels.
 */
export async function renderQRBillSlipPdf(data: QRBillData): Promise<Buffer> {
  const billData = toSwissQRBillPayload(data);
  const raw = await renderTriggeredSlip(billData, data.language ?? "FR");
  return normalizeSlipMediaBox(raw);
}

function renderTriggeredSlip(
  billData: SwissQRBillPayload,
  language: NonNullable<QRBillData["language"]>
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      // Hauteur > 105 mm → swissqrbill dessine la ligne haute et les ciseaux.
      const doc = new PDFDocument({
        size: [QR_BILL_WIDTH_PT, QR_BILL_HEIGHT_PT + OUTLINE_TRIGGER_PT],
        margin: 0,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const bill = new SwissQRBill(billData, {
        fontName: "Helvetica",
        language,
      });

      // y = 0 : le slip occupe le haut de la page PDFKit (y descendant).
      // Après conversion PDF, il se retrouve en bas de la MediaBox élargie.
      bill.attachTo(doc, 0, 0);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Recadre à exactement 210 × 105 mm sans toucher au contenu interne.
 *
 * Avec attachTo(x=0, y=0) sur une page un peu plus haute que 105 mm, PDFKit
 * place le slip en haut de son repère. Après conversion PDF, la ligne de
 * découpe haute se trouve donc en haut de la page (y élevé). On conserve
 * cette bande supérieure et on exclut les 2 pt techniques du bas.
 */
async function normalizeSlipMediaBox(pdf: Buffer): Promise<Buffer> {
  const source = await PDFLibDocument.load(pdf);
  const target = await PDFLibDocument.create();
  const [page] = await target.copyPages(source, [0]);

  // setMediaBox(x, y, width, height) — y = bas de la bande conservée.
  // On garde le haut de la page (ligne de découpe + ciseaux), on exclut
  // les OUTLINE_TRIGGER_PT techniques situés tout en bas.
  page.setMediaBox(
    0,
    OUTLINE_TRIGGER_PT,
    QR_BILL_WIDTH_PT,
    QR_BILL_HEIGHT_PT
  );
  page.setCropBox(
    0,
    OUTLINE_TRIGGER_PT,
    QR_BILL_WIDTH_PT,
    QR_BILL_HEIGHT_PT
  );

  target.addPage(page);
  return Buffer.from(await target.save());
}

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
