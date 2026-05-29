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
    const data = await getDocumentPdfData(id, "quote", { dataUserId: guard.clubId });
    const pdfBuffer = await renderQuotePdfBuffer(data);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=devis-preview.pdf",
      },
    });
  } catch (error: unknown) {
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
