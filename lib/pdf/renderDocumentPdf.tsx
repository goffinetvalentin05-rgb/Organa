import { renderToBuffer } from "@react-pdf/renderer";
import { DevisPdf } from "@/lib/pdf/DevisPdf";
import { FacturePdf } from "@/lib/pdf/FacturePdf";
import { attachQRBillToPdf } from "@/lib/pdf/mergeQRBill";
import type { getDocumentPdfData } from "@/lib/utils/pdf-data";

type DocumentPdfData = Awaited<ReturnType<typeof getDocumentPdfData>>;

export async function renderQuotePdfBuffer(data: DocumentPdfData): Promise<Buffer> {
  const pdf = await renderToBuffer(
    <DevisPdf
      company={data.company}
      client={data.client}
      document={data.document}
      lines={data.lines}
      totals={data.totals}
      primaryColor={data.primaryColor}
      documentLabel={data.documentLabel}
      qrBill={data.qrBill}
    />
  );

  return withQRBill(pdf, data);
}

export async function renderInvoicePdfBuffer(data: DocumentPdfData): Promise<Buffer> {
  const pdf = await renderToBuffer(
    <FacturePdf
      company={data.company}
      client={data.client}
      document={data.document}
      lines={data.lines}
      totals={data.totals}
      primaryColor={data.primaryColor}
      qrBill={data.qrBill}
    />
  );

  return withQRBill(pdf, data);
}

/**
 * Incruste la zone de paiement Swiss QR Bill dans le PDF rendu.
 *
 * L'échec de cette étape ne doit jamais empêcher la délivrance du document :
 * en cas de problème on retourne la facture sans zone de paiement plutôt que
 * de renvoyer une erreur à l'utilisateur.
 */
async function withQRBill(pdf: Buffer, data: DocumentPdfData): Promise<Buffer> {
  if (!data.qrBill?.hasQRBill || !data.qrBill.data) return pdf;

  try {
    return await attachQRBillToPdf(pdf, data.qrBill.data);
  } catch (error) {
    console.error("[pdf] Incrustation de la QR-facture impossible:", error);
    return pdf;
  }
}
