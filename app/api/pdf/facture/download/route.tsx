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

    const filename = `facture-${data.document.number || id}-${new Date().toISOString().split("T")[0]}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
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
