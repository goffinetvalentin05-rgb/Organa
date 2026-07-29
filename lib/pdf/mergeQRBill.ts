/**
 * Incrustation de la zone de paiement Swiss QR Bill dans un PDF Obillz.
 *
 * La facture est produite par `@react-pdf/renderer`, la zone de paiement par
 * PDFKit via `swissqrbill`. Les deux sont fusionnées ici avec `pdf-lib`, en
 * conservant le vectoriel de bout en bout : le QR reste net à n'importe quel
 * niveau de zoom et à l'impression, ce qui est indispensable pour que les
 * applications bancaires le lisent de façon fiable.
 *
 * Le composant `SwissQRBillSlip` réserve en amont, dans le flux du document,
 * une bande de la hauteur exacte du slip en bas de la dernière page. La zone
 * de paiement vient donc se poser sur un espace garanti libre.
 */

import { PDFDocument } from "pdf-lib";
import { renderQRBillSlipPdf } from "@/lib/swiss-qr-bill";
import type { QRBillData } from "@/lib/swiss-qr-bill/types";

export type QRBillPlacement = {
  x: number;
  y: 0;
  width: number;
  height: number;
};

/**
 * Calcule le placement du bloc QR à partir des largeurs RÉELLES mesurées.
 *
 * Formule imposée :
 *   x = (largeurPageA4 - largeurBlocQR) / 2
 *
 * Échelle 1:1 : on réutilise width/height du slip source, sans les forcer à
 * une constante qui pourrait étirer le rendu.
 */
export function getQRBillPlacement(
  pageWidth: number,
  slipWidth: number,
  slipHeight: number
): QRBillPlacement {
  return {
    x: (pageWidth - slipWidth) / 2,
    y: 0,
    width: slipWidth,
    height: slipHeight,
  };
}

/**
 * Ajoute la zone de paiement en bas de la dernière page du PDF fourni.
 *
 * @param documentPdf - PDF de la facture ou cotisation
 * @param qrData - Données de la QR-facture, déjà validées
 * @returns le PDF fusionné
 */
export async function attachQRBillToPdf(
  documentPdf: Buffer,
  qrData: QRBillData
): Promise<Buffer> {
  const slipPdf = await renderQRBillSlipPdf(qrData);

  const target = await PDFDocument.load(documentPdf);
  const slip = await PDFDocument.load(slipPdf);

  const slipPageObj = slip.getPage(0);
  const slipSize = slipPageObj.getSize();

  const [embedded] = await target.embedPdf(slip, [0]);

  const pages = target.getPages();
  const lastPage = pages[pages.length - 1];
  const pageSize = lastPage.getSize();

  const placement = getQRBillPlacement(
    pageSize.width,
    slipSize.width,
    slipSize.height
  );

  // Logs temporaires de diagnostic (à retirer une fois le centrage validé).
  console.log("[QR-Bill placement]", {
    largeurPageA4: pageSize.width,
    largeurBlocQR: slipSize.width,
    hauteurBlocQR: slipSize.height,
    xActuel_siZero: 0,
    xCentre: placement.x,
    margeGauche: placement.x,
    margeDroite: pageSize.width - placement.x - placement.width,
  });

  lastPage.drawPage(embedded, placement);

  return Buffer.from(await target.save());
}
