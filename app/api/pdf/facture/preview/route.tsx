import { NextResponse } from "next/server";
import { getDocumentPdfData } from "@/lib/utils/pdf-data";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { renderInvoicePdfBuffer } from "@/lib/pdf/renderDocumentPdf";
import { getErrorMessage } from "@/lib/utils/error-message";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID de la facture manquant" },
      { status: 400 }
    );
  }

  const guard = await requirePermission(PERMISSIONS.VIEW_INVOICES);
  if ("error" in guard) return guard.error;

  try {
    const data = await getDocumentPdfData(id, "invoice", { dataUserId: guard.clubId });
    const pdfBuffer = await renderInvoicePdfBuffer(data);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=facture-preview.pdf",
      },
    });
  } catch (error: unknown) {
    console.error("ERREUR DOCUMENT COTISATION", {
      step: "pdf.invoice.preview.catch",
      error,
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      data: null,
      clubId: guard.clubId,
      memberId: null,
      documentPayload: { id, type: "invoice" },
      pdfPayload: { kind: "preview" },
      storagePath: null,
    });
    console.error("Erreur lors de la génération du PDF facture:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
