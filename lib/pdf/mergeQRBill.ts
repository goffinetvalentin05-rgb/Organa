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
import { renderQRBillSlipPdf, QR_BILL_HEIGHT_PT } from "@/lib/swiss-qr-bill";
import type { QRBillData } from "@/lib/swiss-qr-bill/types";

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

  // Ancrage en bas à gauche, sur toute la largeur : la norme SIX impose que la
  // zone de paiement occupe le bas de la page sur 210 × 105 mm.
  lastPage.drawPage(slipPage, {
    x: 0,
    y: 0,
    width,
    height: QR_BILL_HEIGHT_PT,
  });

  return Buffer.from(await target.save());
}
