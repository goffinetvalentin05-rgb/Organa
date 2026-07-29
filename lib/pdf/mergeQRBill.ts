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
import {
  renderQRBillSlipPdf,
  QR_BILL_HEIGHT_PT,
  QR_BILL_WIDTH_PT,
} from "@/lib/swiss-qr-bill";
import type { QRBillData } from "@/lib/swiss-qr-bill/types";

export type QRBillPlacement = {
  x: number;
  y: 0;
  width: number;
  height: number;
};

/**
 * Calcule un placement centré sans jamais redimensionner la zone officielle.
 *
 * Une page A4 créée par un moteur PDF peut différer de quelques millièmes de
 * point de la conversion exacte de 210 mm. Utiliser directement la largeur de
 * la page étirait imperceptiblement le slip. Le centrer à sa largeur SIX
 * exacte garantit des cotes inchangées et des marges latérales identiques.
 */
export function getQRBillPlacement(pageWidth: number): QRBillPlacement {
  return {
    x: (pageWidth - QR_BILL_WIDTH_PT) / 2,
    y: 0,
    width: QR_BILL_WIDTH_PT,
    height: QR_BILL_HEIGHT_PT,
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

  const [slipPage] = await target.embedPdf(slip, [0]);

  const pages = target.getPages();
  const lastPage = pages[pages.length - 1];
  const { width } = lastPage.getSize();

  // Centré sur la page à ses dimensions SIX exactes : aucun étirement, même
  // minime, n'est appliqué au QR, aux séparateurs ou aux espacements internes.
  lastPage.drawPage(slipPage, getQRBillPlacement(width));

  return Buffer.from(await target.save());
}
