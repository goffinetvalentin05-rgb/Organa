/**
 * Styles et helpers communs aux PDF « documents club » (facture, cotisation, contrat sponsor).
 * Source unique pour garder la même identité visuelle Obillz.
 */
import { StyleSheet } from "@react-pdf/renderer";

export const clubDocumentPdfStyles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0F172A",
  },
  content: {
    paddingBottom: 96,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  companyBlock: {
    width: "58%",
  },
  companyTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  logo: {
    maxHeight: 56,
    maxWidth: 160,
    marginRight: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.4,
  },
  documentBlock: {
    width: "38%",
    alignItems: "flex-end",
  },
  documentType: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  metaBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#F8FAFC",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#475569",
    marginBottom: 4,
  },
  metaLabel: {
    color: "#64748B",
  },
  clientSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 8,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientBox: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 12,
  },
  clientName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  wrapText: {
    wordBreak: "break-word",
    overflowWrap: "break-word",
    whiteSpace: "normal",
  },
  table: {
    width: "100%",
    marginTop: 6,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#475569",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    alignItems: "flex-start",
  },
  tableCell: {
    fontSize: 9,
  },
  textBlock: {
    width: "100%",
    maxWidth: "100%",
    flexWrap: "wrap",
    wordBreak: "break-word",
  },
  colDesignation: {
    width: "52%",
    flexShrink: 1,
  },
  colQty: {
    width: "12%",
    textAlign: "right",
  },
  colPrice: {
    width: "18%",
    textAlign: "right",
  },
  colTotal: {
    width: "18%",
    textAlign: "right",
  },
  totals: {
    marginTop: 10,
    marginLeft: "auto",
    width: 230,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#F8FAFC",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontSize: 9,
    color: "#475569",
  },
  totalRowTotal: {
    fontSize: 12,
    fontWeight: "bold",
    paddingTop: 6,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  notesSection: {
    marginTop: 18,
    width: "100%",
    maxWidth: "100%",
  },
  notesText: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.4,
    width: "100%",
    maxWidth: "100%",
  },
  /** Corps de texte type contrat (légèrement plus lisible que les notes) */
  contractBodyText: {
    fontSize: 10,
    color: "#0F172A",
    lineHeight: 1.55,
    width: "100%",
    maxWidth: "100%",
  },
  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 48,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  footerText: {
    fontSize: 8,
    color: "#475569",
    lineHeight: 1.4,
    width: "100%",
    maxWidth: "100%",
  },
});

export function formatPdfCurrency(amount: number, currencySymbol: string = "€") {
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ` ${currencySymbol}`
  );
}

export function formatPdfDateLong(dateString: string) {
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(dateString) ? `${dateString}T12:00:00` : dateString
  );
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatPdfIban(iban?: string) {
  if (!iban) return "";
  const compact = iban.replace(/\s+/g, "");
  return compact.replace(/(.{4})/g, "$1 ").trim();
}

export function sanitizePdfNotes(
  notes: string | undefined,
  company: { iban?: string; bankName?: string; conditionsPaiement?: string }
) {
  if (!notes) return "";
  const ibanCompact = company.iban ? company.iban.replace(/\s+/g, "") : "";
  const bankName = company.bankName?.trim().toLowerCase() || "";
  const paymentTerms = company.conditionsPaiement?.trim().toLowerCase() || "";

  const cleanedLines = notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const normalized = line.replace(/\s+/g, "").toLowerCase();
      if (ibanCompact && normalized.includes(ibanCompact.toLowerCase())) return false;
      if (bankName && line.toLowerCase().includes(bankName)) return false;
      if (paymentTerms && line.toLowerCase().includes(paymentTerms)) return false;
      if (/^iban\b/i.test(line)) return false;
      return true;
    });

  return cleanedLines.join("\n");
}

export function pdfHyphenationCallback(word: string) {
  if (word.length <= 18) return [word];
  return word.match(/.{1,18}/g) || [word];
}
