import { NextResponse } from "next/server";
import { getDocumentPdfData } from "@/lib/utils/pdf-data";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { renderQuotePdfBuffer } from "@/lib/pdf/renderDocumentPdf";
import { getErrorMessage } from "@/lib/utils/error-message";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID du devis manquant" },
      { status: 400 }
    );
  }

  const guard = await requirePermission(PERMISSIONS.VIEW_DOCUMENTS);
  if ("error" in guard) return guard.error;

  try {
    const step = "pdf.quote.preview.getDocumentPdfData";
    const data = await getDocumentPdfData(id, "quote", { dataUserId: guard.clubId });
    const pdfPayload = {
      type: "quote",
      id,
      hasLogo: Boolean(data.company?.logoUrl),
      clubName: data.company?.name || "Club",
      memberName: data.client?.name || "Membre",
    };
    const step2 = "pdf.quote.preview.render";
    const pdfBuffer = await renderQuotePdfBuffer(data);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=devis-preview.pdf",
      },
    });
  } catch (error: unknown) {
    console.error("ERREUR DOCUMENT COTISATION", {
      step: "pdf.quote.preview.catch",
      error,
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      data: null,
      clubId: guard.clubId,
      memberId: null,
      documentPayload: { id, type: "quote" },
      pdfPayload: { kind: "preview" },
      storagePath: null,
    });
    console.error("Erreur lors de la génération du PDF devis:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
