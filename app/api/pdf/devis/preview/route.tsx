import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { DevisPdf } from "@/lib/pdf/DevisPdf";
import { getDocumentPdfData } from "@/lib/utils/pdf-data";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
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

    const data = await getDocumentPdfData(id, "quote", { dataUserId: guard.clubId });

    // Générer le PDF avec @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
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

    // Retourner le PDF pour prévisualisation (inline)
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=devis-preview.pdf",
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la génération du PDF devis:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF",
        details: error.message,
      },
      { status: 500 }
    );
  }
}


