import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Forcer le runtime Node.js (pas Edge)
export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  text: {
    fontSize: 12,
    color: "#666",
    marginTop: 10,
  },
});

export async function GET() {
  try {
    // Obtenir la date du jour au format français
    const dateDuJour = new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Générer le PDF avec @react-pdf/renderer (utiliser JSX directement)
    const pdfBuffer = await renderToBuffer(
      <Document>
        <Page size="A4" style={styles.page}>
          <View>
            <Text style={styles.title}>Organa PDF OK</Text>
            <Text style={styles.text}>{dateDuJour}</Text>
          </View>
        </Page>
      </Document>
    );

    // Retourner le PDF avec les en-têtes appropriés
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la génération du PDF:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF", details: error.message },
      { status: 500 }
    );
  }
}

