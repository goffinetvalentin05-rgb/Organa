import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { isQRReferenceValid } from "swissqrbill/utils";

import {
  generateQRRReference,
  formatQRRReference,
  isQRIBAN,
  isValidSwissIBAN,
  validateQRBillData,
  renderQRBillSlipPdf,
  QR_BILL_HEIGHT_PT,
} from "@/lib/swiss-qr-bill";
import type { QRBillData } from "@/lib/swiss-qr-bill/types";
import { attachQRBillToPdf } from "@/lib/pdf/mergeQRBill";

/** IBAN standard suisse (référence de type NON). */
const IBAN_STANDARD = "CH5800791123000889012";
/** QR-IBAN (impose une référence QRR). */
const IBAN_QR = "CH4431999123000889012";

const CLUB_ID = "3f2b1c8a-9d4e-4f11-8a76-52c0be91d7a4";

function buildData(overrides: Partial<QRBillData> = {}): QRBillData {
  return {
    currency: "CHF",
    amount: 120.5,
    creditor: {
      account: IBAN_STANDARD,
      name: "FC Exemple",
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
    ...overrides,
  };
}

describe("références QR", () => {
  it("génère une référence QRR de 27 chiffres acceptée par la librairie", () => {
    const reference = generateQRRReference(CLUB_ID, "FAC-2026-001");

    expect(reference).toMatch(/^\d{27}$/);
    expect(isQRReferenceValid(reference)).toBe(true);
  });

  it("produit toujours la même référence pour un même document", () => {
    const first = generateQRRReference(CLUB_ID, "FAC-2026-001");
    const second = generateQRRReference(CLUB_ID, "FAC-2026-001");

    expect(second).toBe(first);
  });

  it("distingue deux documents et deux clubs", () => {
    const doc1 = generateQRRReference(CLUB_ID, "FAC-2026-001");
    const doc2 = generateQRRReference(CLUB_ID, "FAC-2026-002");
    const autreClub = generateQRRReference("8a1d0e77-2222-4333-9444-55667788990a", "FAC-2026-001");

    expect(doc2).not.toBe(doc1);
    expect(autreClub).not.toBe(doc1);
  });

  it("reste valide même si le numéro de document ne contient aucun chiffre", () => {
    const reference = generateQRRReference(CLUB_ID, "COTISATION-ANNUELLE");

    expect(reference).toMatch(/^\d{27}$/);
    expect(isQRReferenceValid(reference)).toBe(true);
  });

  it("formate la référence selon l'affichage officiel", () => {
    const reference = generateQRRReference(CLUB_ID, "FAC-2026-001");

    expect(formatQRRReference(reference)).toMatch(/^\d{2}( \d{5}){5}$/);
  });

  it("reconnaît un QR-IBAN et un IBAN standard", () => {
    expect(isQRIBAN(IBAN_QR)).toBe(true);
    expect(isQRIBAN(IBAN_STANDARD)).toBe(false);
  });
});

describe("validation", () => {
  it("accepte un jeu de données complet", () => {
    expect(validateQRBillData(buildData()).valid).toBe(true);
  });

  it("valide les IBAN suisses et rejette les autres", () => {
    expect(isValidSwissIBAN(IBAN_STANDARD)).toBe(true);
    expect(isValidSwissIBAN("CH58 0079 1123 0008 8901 2")).toBe(true);
    expect(isValidSwissIBAN("CH5800791123000889013")).toBe(false); // checksum faux
    expect(isValidSwissIBAN("FR7630006000011234567890189")).toBe(false);
    expect(isValidSwissIBAN("")).toBe(false);
  });

  it("signale un IBAN absent avec un message actionnable", () => {
    const result = validateQRBillData(buildData({ creditor: { ...buildData().creditor, account: "" } }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "iban")).toBe(true);
    expect(result.errors[0].message).toContain("Paramètres");
  });

  it("signale une adresse de bénéficiaire incomplète", () => {
    const result = validateQRBillData(
      buildData({ creditor: { ...buildData().creditor, zip: "", city: "" } })
    );

    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toEqual(
      expect.arrayContaining(["creditor.zip", "creditor.city"])
    );
  });

  it("exige une référence QRR lorsque le compte est un QR-IBAN", () => {
    const result = validateQRBillData(
      buildData({ creditor: { ...buildData().creditor, account: IBAN_QR }, reference: undefined })
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "reference")).toBe(true);
  });

  it("refuse une devise non supportée", () => {
    const result = validateQRBillData(buildData({ currency: "USD" as unknown as "CHF" }));

    expect(result.errors.some((e) => e.field === "currency")).toBe(true);
  });
});

describe("rendu de la zone de paiement", () => {
  it("produit une page PDF entièrement vectorielle aux cotes normalisées", async () => {
    const slip = await renderQRBillSlipPdf(buildData());

    expect(slip.subarray(0, 5).toString()).toBe("%PDF-");

    const raw = slip.toString("latin1");
    expect(raw).toContain("/Font");
    // Aucune image bitmap : le QR doit rester vectoriel pour rester scannable.
    expect(raw).not.toContain("/Subtype /Image");

    const doc = await PDFDocument.load(slip);
    expect(doc.getPageCount()).toBe(1);

    const { height } = doc.getPage(0).getSize();
    expect(height).toBeCloseTo(QR_BILL_HEIGHT_PT, 1);
  });

  it("fonctionne avec un QR-IBAN et sa référence QRR", async () => {
    const slip = await renderQRBillSlipPdf(
      buildData({
        creditor: { ...buildData().creditor, account: IBAN_QR },
        reference: generateQRRReference(CLUB_ID, "FAC-2026-001"),
      })
    );

    expect(slip.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("laisse la case montant vide quand aucun montant n'est fourni", async () => {
    const slip = await renderQRBillSlipPdf(buildData({ amount: undefined }));

    expect(slip.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("rejette des données non conformes", async () => {
    await expect(
      renderQRBillSlipPdf(buildData({ creditor: { ...buildData().creditor, account: "CH00INVALIDE" } }))
    ).rejects.toBeTruthy();
  });
});

describe("incrustation dans le PDF du document", () => {
  async function blankPdf(pageCount: number): Promise<Buffer> {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pageCount; i += 1) doc.addPage([595.28, 841.89]);
    return Buffer.from(await doc.save());
  }

  it("n'ajoute aucune page au document", async () => {
    for (const pageCount of [1, 2, 3]) {
      const merged = await attachQRBillToPdf(await blankPdf(pageCount), buildData());
      const doc = await PDFDocument.load(merged);

      expect(doc.getPageCount()).toBe(pageCount);
    }
  });

  it("conserve le format A4 de la dernière page", async () => {
    const merged = await attachQRBillToPdf(await blankPdf(1), buildData());
    const doc = await PDFDocument.load(merged);
    const { width, height } = doc.getPage(0).getSize();

    expect(width).toBeCloseTo(595.28, 1);
    expect(height).toBeCloseTo(841.89, 1);
  });

  it("produit un PDF plus lourd que l'original, signe que le slip est bien incrusté", async () => {
    const original = await blankPdf(1);
    const merged = await attachQRBillToPdf(original, buildData());

    expect(merged.length).toBeGreaterThan(original.length);
  });
});
