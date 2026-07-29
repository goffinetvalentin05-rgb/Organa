/**
 * Garde-fou de mise en page : le contenu de la facture ne doit jamais empiéter
 * sur la zone de paiement Swiss QR Bill, qui occupe les 105 mm du bas de la
 * dernière page.
 *
 * La vérification rejoue la pile graphique du PDF (transformations `cm`,
 * `q`/`Q`, matrices de texte) pour retrouver les coordonnées réellement
 * dessinées : `@react-pdf/renderer` travaille dans un repère inversé et
 * fortement imbriqué, les coordonnées brutes du flux ne sont pas exploitables.
 */

import React from "react";
import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument, PDFRawStream, PDFArray, decodePDFRawStream } from "pdf-lib";

import { FacturePdf } from "@/lib/pdf/FacturePdf";
import { DevisPdf } from "@/lib/pdf/DevisPdf";
import { QR_BILL_HEIGHT_PT } from "@/lib/swiss-qr-bill";

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

const mul = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[1] * n[2],
  m[0] * n[1] + m[1] * n[3],
  m[2] * n[0] + m[3] * n[2],
  m[2] * n[1] + m[3] * n[3],
  m[4] * n[0] + m[5] * n[2] + n[4],
  m[4] * n[1] + m[5] * n[3] + n[5],
];

const applyY = (m: Matrix, x: number, y: number) => m[1] * x + m[3] * y + m[5];

/** Ordonnée la plus basse réellement dessinée sur la dernière page, en points. */
async function lowestDrawnPoint(pdf: Buffer): Promise<number> {
  const doc = await PDFDocument.load(pdf);
  const page = doc.getPage(doc.getPageCount() - 1);

  const contents = page.node.Contents();
  const streams =
    contents instanceof PDFArray
      ? contents.asArray().map((ref) => doc.context.lookup(ref))
      : [contents];

  let text = "";
  for (const stream of streams) {
    if (stream instanceof PDFRawStream) {
      text += Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1");
    }
  }

  let ctm: Matrix = [...IDENTITY] as Matrix;
  let textMatrix: Matrix = [...IDENTITY] as Matrix;
  const stack: Matrix[] = [];
  const ys: number[] = [];
  const nums: number[] = [];

  for (const token of text.split(/\s+/)) {
    const value = Number(token);
    if (token !== "" && Number.isFinite(value)) {
      nums.push(value);
      continue;
    }

    const n = (back: number) => nums[nums.length - back];

    switch (token) {
      case "q":
        stack.push([...ctm] as Matrix);
        break;
      case "Q":
        ctm = stack.pop() ?? ([...IDENTITY] as Matrix);
        break;
      case "cm":
        if (nums.length >= 6) ctm = mul([n(6), n(5), n(4), n(3), n(2), n(1)] as Matrix, ctm);
        break;
      case "BT":
        textMatrix = [...IDENTITY] as Matrix;
        break;
      case "Tm":
        if (nums.length >= 6) {
          textMatrix = [n(6), n(5), n(4), n(3), n(2), n(1)] as Matrix;
          ys.push(applyY(mul(textMatrix, ctm), 0, 0));
        }
        break;
      case "Td":
      case "TD":
        if (nums.length >= 2) {
          textMatrix = mul([1, 0, 0, 1, n(2), n(1)] as Matrix, textMatrix);
          ys.push(applyY(mul(textMatrix, ctm), 0, 0));
        }
        break;
      case "re":
        if (nums.length >= 4) {
          const [x, y, w, h] = [n(4), n(3), n(2), n(1)];
          for (const [px, py] of [
            [x, y],
            [x + w, y],
            [x, y + h],
            [x + w, y + h],
          ]) {
            ys.push(applyY(ctm, px, py));
          }
        }
        break;
      default:
        break;
    }

    nums.length = 0;
  }

  return Math.min(...ys);
}

function buildLines(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    label: `Prestation ${index + 1}`,
    description: index % 3 === 0 ? "Détail complémentaire de la prestation facturée" : undefined,
    qty: 1,
    unitPrice: 25,
    total: 25,
  }));
}

const company = {
  name: "FC Exemple Delémont",
  address: "Rue du Stade 12\n2800 Delémont",
  email: "tresorier@fc-exemple.ch",
  phone: "+41 32 000 00 00",
  iban: "CH5800791123000889012",
  bankName: "Banque Cantonale du Jura",
  conditionsPaiement: "Paiement à 30 jours",
};

const client = {
  name: "Jean Dupont",
  address: "Rue des Membres 5\n2800 Delémont",
  email: "jean.dupont@example.ch",
};

function documentMeta(number: string) {
  return {
    number,
    date: "2026-07-29",
    dueDate: "2026-08-28",
    currency: "CHF",
    currencySymbol: "CHF",
    subject: "Cotisation saison 2026",
  };
}

function totalsFor(lineCount: number) {
  const total = lineCount * 25;
  return { subtotal: total, vat: 0, total };
}

describe("réservation de la zone de paiement", () => {
  const cases = [
    { label: "facture courte", lines: 2 },
    { label: "facture moyenne", lines: 8 },
    { label: "facture longue sur plusieurs pages", lines: 30 },
    { label: "facture très longue", lines: 60 },
  ];

  for (const { label, lines } of cases) {
    it(`laisse la zone de paiement libre — ${label}`, async () => {
      const pdf = await renderToBuffer(
        React.createElement(FacturePdf, {
          company,
          client,
          document: documentMeta("FAC-2026-001"),
          lines: buildLines(lines),
          totals: totalsFor(lines),
          primaryColor: "#6D5EF8",
          qrBill: { hasQRBill: true, errorMessage: null },
        })
      );

      const lowest = await lowestDrawnPoint(pdf);

      expect(lowest).toBeGreaterThanOrEqual(QR_BILL_HEIGHT_PT);
    });
  }

  it("laisse également la zone libre sur une cotisation", async () => {
    const pdf = await renderToBuffer(
      React.createElement(DevisPdf, {
        company,
        client,
        document: { ...documentMeta("COT-2026-042"), type: "quote" as const },
        lines: buildLines(10),
        totals: totalsFor(10),
        primaryColor: "#6D5EF8",
        documentLabel: { title: "COTISATION", clientLabel: "Concerne", numberLabel: "Référence" },
        qrBill: { hasQRBill: true, errorMessage: null },
      })
    );

    const lowest = await lowestDrawnPoint(pdf);

    expect(lowest).toBeGreaterThanOrEqual(QR_BILL_HEIGHT_PT);
  });

  it("n'impose aucune réservation quand la QR-facture est indisponible", async () => {
    const withoutQR = await renderToBuffer(
      React.createElement(FacturePdf, {
        company,
        client,
        document: documentMeta("FAC-2026-002"),
        lines: buildLines(2),
        totals: totalsFor(2),
        primaryColor: "#6D5EF8",
        qrBill: { hasQRBill: false, errorMessage: "IBAN manquant" },
      })
    );

    // Le pied de page bancaire classique reprend sa place : le contenu
    // redescend donc sous la limite des 105 mm.
    const lowest = await lowestDrawnPoint(withoutQR);

    expect(lowest).toBeLessThan(QR_BILL_HEIGHT_PT);
  });
});
