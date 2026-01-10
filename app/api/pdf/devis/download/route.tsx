import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { DevisPdf } from "@/lib/pdf/DevisPdf";

export const runtime = "nodejs";

// Données mockées pour le devis (structure simple)
function getMockDevisData() {
  return {
    company: {
      name: "Organa",
      address: "123 Rue de l'Innovation\n75001 Paris, France",
      email: "contact@organa.fr",
      phone: "+33 1 23 45 67 89",
      logoUrl: undefined,
    },
    client: {
      name: "Client Exemple",
      address: "456 Avenue des Clients\n69000 Lyon, France",
      email: "client@exemple.fr",
    },
    document: {
      number: "DEV-2024-001",
      date: new Date().toISOString(),
      currency: "EUR",
      currencySymbol: "€",
      vatRate: 20,
      notes: "Devis valable 30 jours",
    },
    lines: [
      {
        label: "Prestation 1",
        description: "Description détaillée de la prestation 1",
        qty: 2,
        unitPrice: 100.0,
        total: 200.0,
        vat: 20,
      },
      {
        label: "Prestation 2",
        description: "Description de la prestation 2",
        qty: 1,
        unitPrice: 150.0,
        total: 150.0,
        vat: 20,
      },
    ],
    totals: {
      subtotal: 350.0,
      vat: 70.0,
      total: 420.0,
    },
    primaryColor: "#3B82F6",
  };
}

export async function GET() {
  try {
    const data = getMockDevisData();

    // Générer le PDF avec @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      <DevisPdf
        company={data.company}
        client={data.client}
        document={data.document}
        lines={data.lines}
        totals={{
          totalHT: 0,
          totalTVA: 0,
          totalTTC: 0,
        }}
      />
    );

    // Nom du fichier avec la date
    const filename = `devis-${data.document.number}-${new Date().toISOString().split("T")[0]}.pdf`;

    // Retourner le PDF pour téléchargement (attachment)
    return new NextResponse(pdfBuffer, {
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


