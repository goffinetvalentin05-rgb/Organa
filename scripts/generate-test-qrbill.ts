/**
 * Génère une facture complète avec QR-facture pour contrôle visuel local.
 *
 * Exécution :
 *   npx vite-node -c vitest.config.ts scripts/generate-test-qrbill.ts
 */
import React from "react";
import { writeFileSync } from "node:fs";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { FacturePdf } from "@/lib/pdf/FacturePdf";
import { attachQRBillToPdf } from "@/lib/pdf/mergeQRBill";
import type { QRBillData } from "@/lib/swiss-qr-bill/types";

const outputPath = "scripts/exemple-facture-qr.pdf";

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

const invoiceElement = React.createElement(FacturePdf, {
  company: {
    name: "FC Exemple Delémont",
    address: "Rue du Stade 12\n2800 Delémont",
    email: "tresorier@fc-exemple.ch",
    phone: "+41 32 000 00 00",
    iban: qrData.creditor.account,
    bankName: "Banque Cantonale du Jura",
    conditionsPaiement: "Paiement à 30 jours",
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
    {
      label: "Cotisation annuelle senior",
      qty: 1,
      unitPrice: 250,
      total: 250,
    },
    {
      label: "Équipement — maillot officiel",
      description: "Taille L, floquage inclus",
      qty: 1,
      unitPrice: 60,
      total: 60,
    },
    {
      label: "Participation tournoi de printemps",
      qty: 2,
      unitPrice: 15,
      total: 30,
    },
  ],
  totals: { subtotal: 340, vat: 0, total: 340 },
  primaryColor: "#6D5EF8",
  qrBill: { hasQRBill: true, errorMessage: null },
});

const invoice = await renderToBuffer(
  invoiceElement as Parameters<typeof renderToBuffer>[0]
);

const finalPdf = await attachQRBillToPdf(invoice, qrData);
const parsed = await PDFDocument.load(finalPdf);

if (parsed.getPageCount() !== 1) {
  throw new Error(`La facture de test contient ${parsed.getPageCount()} pages au lieu d'une.`);
}

writeFileSync(outputPath, finalPdf);
console.log(`Facture QR générée : ${outputPath} (${finalPdf.length} octets, 1 page)`);
