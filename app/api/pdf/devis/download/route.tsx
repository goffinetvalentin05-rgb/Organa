import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { DevisPdf } from "@/lib/pdf/DevisPdf";
import { getDocumentPdfData } from "@/lib/utils/pdf-data";

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

    const data = await getDocumentPdfData(id, "quote");

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

    // Nom du fichier avec la date - utiliser "cotisation" pour les quotes
    const prefix = data.documentLabel?.title === "COTISATION" ? "cotisation" : "devis";
    const filename = `${prefix}-${data.document.number || id}-${new Date().toISOString().split("T")[0]}.pdf`;

    // Retourner le PDF pour téléchargement (attachment)
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
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


