import { renderToBuffer } from "@react-pdf/renderer";
import { DevisPdf } from "@/lib/pdf/DevisPdf";
import { FacturePdf } from "@/lib/pdf/FacturePdf";
import type { getDocumentPdfData } from "@/lib/utils/pdf-data";

type DocumentPdfData = Awaited<ReturnType<typeof getDocumentPdfData>>;

export async function renderQuotePdfBuffer(data: DocumentPdfData): Promise<Buffer> {
  return renderToBuffer(
    <DevisPdf
      company={data.company}
      client={data.client}
      document={data.document}
      lines={data.lines}
      totals={data.totals}
      primaryColor={data.primaryColor}
      documentLabel={data.documentLabel}
    />
  );
}

export async function renderInvoicePdfBuffer(data: DocumentPdfData): Promise<Buffer> {
  return renderToBuffer(
    <FacturePdf
      company={data.company}
      client={data.client}
      document={data.document}
      lines={data.lines}
      totals={data.totals}
      primaryColor={data.primaryColor}
    />
  );
}
