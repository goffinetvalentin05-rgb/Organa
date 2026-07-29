/**
 * Génère avant/après pour valider le centrage du bloc QR complet.
 *
 * - avant : ancienne méthode (page 105 mm exacte, x = 0) — sans ligne haute
 * - apres : méthode actuelle (A4 + crop + x centré mesuré)
 */
import React from "react";
import { writeFileSync } from "node:fs";
import { renderToBuffer } from "@react-pdf/renderer";
import PDFKit from "pdfkit";
import { SwissQRBill } from "swissqrbill/pdf";
import { PDFDocument } from "pdf-lib";

import { FacturePdf } from "@/lib/pdf/FacturePdf";
import { attachQRBillToPdf, getQRBillPlacement } from "@/lib/pdf/mergeQRBill";
import {
  renderQRBillSlipPdf,
  QR_BILL_WIDTH_PT,
  QR_BILL_HEIGHT_PT,
} from "@/lib/swiss-qr-bill";
import type { QRBillData } from "@/lib/swiss-qr-bill/types";

const qrData: QRBillData = {
  currency: "CHF",
  amount: 340,
  creditor: {
    account: "CH5800791123000889012",
    name: "FC Exemple Delémont",
    street: "Rue du Stade",
    buildingNumber: "12",
    zip: "2800",
    city: "Delémont",
    country: "CH",
  },
  debtor: {
    name: "Jean Dupont",
    street: "Rue des Membres",
    buildingNumber: "5",
    zip: "2800",
    city: "Delémont",
    country: "CH",
  },
  message: "FAC-2026-001",
  language: "FR",
};

async function buildInvoiceBody() {
  return renderToBuffer(
    React.createElement(FacturePdf, {
      company: {
        name: "FC Exemple Delémont",
        address: "Rue du Stade 12\n2800 Delémont",
        email: "tresorier@fc-exemple.ch",
        phone: "+41 32 000 00 00",
        iban: qrData.creditor.account,
      },
      client: {
        name: "Jean Dupont",
        address: "Rue des Membres 5\n2800 Delémont",
        email: "jean.dupont@example.ch",
      },
      document: {
        number: "FAC-2026-001",
        date: "2026-07-29",
        dueDate: "2026-08-28",
        currency: "CHF",
        currencySymbol: "CHF",
        subject: "Cotisation saison 2026",
      },
      lines: [
        { label: "Cotisation annuelle senior", qty: 1, unitPrice: 250, total: 250 },
        {
          label: "Équipement — maillot officiel",
          description: "Taille L, floquage inclus",
          qty: 1,
          unitPrice: 60,
          total: 60,
        },
        { label: "Participation tournoi de printemps", qty: 2, unitPrice: 15, total: 30 },
      ],
      totals: { subtotal: 340, vat: 0, total: 340 },
      primaryColor: "#6D5EF8",
      qrBill: { hasQRBill: true, errorMessage: null },
    }) as Parameters<typeof renderToBuffer>[0]
  );
}

/** Ancienne génération : page exactement 105 mm → pas de ligne de découpe haute. */
function renderLegacySlip(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFKit({
        size: [QR_BILL_WIDTH_PT, QR_BILL_HEIGHT_PT],
        margin: 0,
      });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const bill = new SwissQRBill(
        {
          currency: "CHF",
          amount: 340,
          creditor: {
            account: qrData.creditor.account,
            name: qrData.creditor.name,
            address: qrData.creditor.street ?? "",
            buildingNumber: qrData.creditor.buildingNumber,
            zip: qrData.creditor.zip,
            city: qrData.creditor.city,
            country: qrData.creditor.country,
          },
          debtor: qrData.debtor
            ? {
                name: qrData.debtor.name,
                address: qrData.debtor.street ?? "",
                buildingNumber: qrData.debtor.buildingNumber,
                zip: qrData.debtor.zip,
                city: qrData.debtor.city,
                country: qrData.debtor.country,
              }
            : undefined,
          message: qrData.message,
        },
        { fontName: "Helvetica", language: "FR" }
      );
      bill.attachTo(doc, 0, 0);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function mergeLegacy(invoice: Buffer, slip: Buffer, x: number) {
  const target = await PDFDocument.load(invoice);
  const src = await PDFDocument.load(slip);
  const slipSize = src.getPage(0).getSize();
  const [embedded] = await target.embedPdf(src, [0]);
  const last = target.getPages()[target.getPageCount() - 1];
  last.drawPage(embedded, {
    x,
    y: 0,
    width: slipSize.width,
    height: slipSize.height,
  });
  return Buffer.from(await target.save());
}

const invoice = await buildInvoiceBody();
const invW = (await PDFDocument.load(invoice)).getPage(0).getSize().width;

console.log("=== AVANT (legacy : page 105mm, x=0) ===");
const legacySlip = await renderLegacySlip();
const legacySize = (await PDFDocument.load(legacySlip)).getPage(0).getSize();
console.log("largeur page A4 =", invW);
console.log("largeur bloc QR =", legacySize.width);
console.log("x actuel        =", 0);
console.log("x centre        =", (invW - legacySize.width) / 2);
const before = await mergeLegacy(invoice, legacySlip, 0);
writeFileSync("scripts/qr-placement-avant.pdf", before);
console.log("écrit scripts/qr-placement-avant.pdf");

console.log("\n=== APRÈS (A4+crop + x mesuré) ===");
const newSlip = await renderQRBillSlipPdf(qrData);
const newSize = (await PDFDocument.load(newSlip)).getPage(0).getSize();
const placement = getQRBillPlacement(invW, newSize.width, newSize.height);
console.log("largeur page A4 =", invW);
console.log("largeur bloc QR =", newSize.width);
console.log("hauteur bloc QR =", newSize.height);
console.log("x actuel (0)    =", 0);
console.log("x centre        =", placement.x);
console.log("marge G / D     =", placement.x, "/", invW - placement.x - placement.width);

const after = await attachQRBillToPdf(invoice, qrData);
writeFileSync("scripts/qr-placement-apres.pdf", after);
writeFileSync("scripts/exemple-facture-qr.pdf", after);
console.log("écrit scripts/qr-placement-apres.pdf");
console.log("écrit scripts/exemple-facture-qr.pdf");

// Vérifie la présence de la ligne haute dans le slip après
const stream = newSlip.toString("latin1");
console.log("\nSlip après contient marqueur 210mm ?", stream.includes("595.27"));
console.log("Pages facture après =", (await PDFDocument.load(after)).getPageCount());
