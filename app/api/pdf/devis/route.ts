import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { DevisPdf } from "./template";
import { devisAPI } from "@/lib/mock-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || id.trim() === "") {
      return NextResponse.json(
        { error: "Le paramètre 'id' est requis" },
        { status: 400 }
      );
    }

    const devis = devisAPI.getById(id);

    if (!devis) {
      return NextResponse.json(
        { error: `Devis avec l'ID '${id}' introuvable` },
        { status: 404 }
      );
    }

    if (!devis.lignes || !Array.isArray(devis.lignes)) {
      return NextResponse.json(
        { error: "Les données du devis sont invalides" },
        { status: 500 }
      );
    }

    const document = React.createElement(DevisPdf, { devis }) as any;
    const pdfDoc = pdf(document);
    const pdfBuffer = await pdfDoc.toBuffer();
    
    let buffer: Buffer;
    if (Buffer.isBuffer(pdfBuffer)) {
      buffer = pdfBuffer;
    } else if (pdfBuffer instanceof Uint8Array) {
      buffer = Buffer.from(pdfBuffer);
    } else {
      const chunks: Uint8Array[] = [];
      const reader = (pdfBuffer as any).getReader();
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          chunks.push(result.value);
        }
      }
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const uint8Array = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        uint8Array.set(chunk, offset);
        offset += chunk.length;
      }
      buffer = Buffer.from(uint8Array);
    }

    const filename = `devis-${devis.numero || id}.pdf`;

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la génération du PDF devis:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF",
        message: error?.message || "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
