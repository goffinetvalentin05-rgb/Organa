import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { FacturePdf } from "@/lib/pdf/FacturePdf";

export const runtime = "nodejs";

// Données mockées pour la facture (structure simple)
function getMockFactureData() {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 30); // Échéance dans 30 jours

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
      number: "FAC-2024-001",
      date: today.toISOString(),
      dueDate: dueDate.toISOString(),
      currency: "EUR",
      currencySymbol: "€",
      vatRate: 20,
      notes: "Paiement à réception de la facture",
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
    const data = getMockFactureData();

    // Générer le PDF avec @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      <FacturePdf
        company={data.company}
        client={data.client}
        document={data.document}
        lines={data.lines}
        totals={{
          subtotal: 0,
          vat: 0,
          total: 0,
        }}
      />
    );

    // Retourner le PDF pour prévisualisation (inline)
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=facture-preview.pdf",
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la génération du PDF facture:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF",
        details: error.message,
      },
      { status: 500 }
    );
  }
}


