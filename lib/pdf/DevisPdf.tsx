import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Styles pour le PDF
const styles = StyleSheet.create({
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

// Types pour les données
interface DevisPdfProps {
  company: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    logoUrl?: string;
    iban?: string;
    bankName?: string;
    conditionsPaiement?: string;
  };
  client: {
    name: string;
    address?: string;
    email?: string;
  };
  document: {
    number: string;
    date: string;
    currency?: string;
    currencySymbol?: string;
    vatRate?: number;
    notes?: string;
    type?: "quote" | "invoice";
  };
  lines: Array<{
    label: string;
    description?: string;
    qty: number;
    unitPrice: number;
    total: number;
    vat?: number;
  }>;
  totals: {
    subtotal: number;
    vat: number;
    total: number;
  };
  primaryColor?: string;
  // Labels dynamiques pour cotisation vs devis
  documentLabel?: {
    title: string;      // "COTISATION" ou "DEVIS"
    clientLabel: string; // "CONCERNE" ou "CLIENT"
  };
}

// Fonction pour formater la monnaie
const formatCurrency = (amount: number, currencySymbol: string = "€") => {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${currencySymbol}`;
};

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatIban = (iban?: string) => {
  if (!iban) return "";
  const compact = iban.replace(/\s+/g, "");
  return compact.replace(/(.{4})/g, "$1 ").trim();
};

const sanitizeNotes = (
  notes: string | undefined,
  company: { iban?: string; bankName?: string; conditionsPaiement?: string }
) => {
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
};

const hyphenationCallback = (word: string) => {
  if (word.length <= 18) return [word];
  return word.match(/.{1,18}/g) || [word];
};

export const DevisPdf: React.FC<DevisPdfProps> = ({
  company,
  client,
  document,
  lines,
  totals,
  primaryColor = "#3B82F6",
  documentLabel,
}) => {
  // Styles dynamiques avec la couleur primaire
  const dynamicStyles = StyleSheet.create({
    documentType: {
      color: primaryColor,
    },
    companyName: {
      color: primaryColor,
    },
    totalRowTotal: {
      color: primaryColor,
      borderTopColor: primaryColor,
    },
  });

  const currencySymbol = document.currencySymbol || "€";
  
  // Labels par défaut : cotisation pour les quotes, devis sinon
  const title = documentLabel?.title || "COTISATION";
  const clientLabel = documentLabel?.clientLabel || "Concerne";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.companyBlock}>
              <View style={styles.companyTop}>
                {company.logoUrl && (
                  <Image src={company.logoUrl} style={styles.logo} />
                )}
                <View>
                  <Text style={[styles.companyName, dynamicStyles.companyName]}>
                    {company.name}
                  </Text>
                  <Text style={[styles.companyDetails, styles.wrapText]}>
                    {company.address && `${company.address}\n`}
                    {company.email && `${company.email}\n`}
                    {company.phone}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.documentBlock}>
              <Text style={[styles.documentType, dynamicStyles.documentType]}>
                {title}
              </Text>
              <View style={styles.metaBox}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Numéro</Text>
                  <Text>{document.number}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Date d'émission</Text>
                  <Text>{formatDate(document.date)}</Text>
                </View>
                <View style={[styles.metaRow, { marginBottom: 0 }]}>
                  <Text style={styles.metaLabel}>Devise</Text>
                  <Text>{currencySymbol}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Client / Membre concerné */}
          <View style={styles.clientSection}>
            <Text style={styles.sectionTitle}>{clientLabel}</Text>
            <View style={styles.clientBox}>
              <Text style={[styles.clientName, styles.textBlock]}>
                {client.name}
              </Text>
              {client.address && (
                <Text style={[styles.companyDetails, styles.wrapText]}>
                  {client.address}
                </Text>
              )}
              {client.email && (
                <Text style={[styles.companyDetails, styles.wrapText]}>
                  {client.email}
                </Text>
              )}
            </View>
          </View>

          {/* Lines Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDesignation]}>
                Description
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>
                Quantité
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>
                Prix unitaire
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            </View>
            {lines.map((line, index) => (
              <View key={index}>
                <View style={styles.tableRow}>
                  <View style={styles.colDesignation}>
                    <Text
                      style={[styles.tableCell, styles.textBlock]}
                    >
                      {line.label}
                    </Text>
                    {line.description && (
                      <Text
                        style={[
                          styles.tableCell,
                          styles.textBlock,
                          { fontSize: 8, color: "#64748B", marginTop: 4 },
                        ]}
                      >
                        {line.description}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.tableCell, styles.colQty]}>
                    {line.qty}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    {formatCurrency(line.unitPrice, currencySymbol)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colTotal]}>
                    {formatCurrency(line.total, currencySymbol)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text>Sous-total HT</Text>
              <Text>{formatCurrency(totals.subtotal, currencySymbol)}</Text>
            </View>
            {document.vatRate && document.vatRate > 0 && (
              <View style={styles.totalRow}>
                <Text>TVA ({document.vatRate}%)</Text>
                <Text>{formatCurrency(totals.vat, currencySymbol)}</Text>
              </View>
            )}
            <View
              style={[styles.totalRow, styles.totalRowTotal, dynamicStyles.totalRowTotal]}
            >
              <Text>Total TTC</Text>
              <Text>{formatCurrency(totals.total, currencySymbol)}</Text>
            </View>
          </View>

          {sanitizeNotes(document.notes, company) && (
            <View style={styles.notesSection}>
              <Text
                style={[styles.notesText, styles.wrapText, styles.textBlock]}
                wrap
                hyphenationCallback={hyphenationCallback}
              >
                {sanitizeNotes(document.notes, company)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        {(company.iban || company.bankName || company.conditionsPaiement) && (
          <View style={styles.footer} fixed>
            {(company.iban || company.bankName) && (
              <Text style={styles.footerText}>
                {company.bankName ? `${company.bankName} • ` : ""}
                {company.iban ? `IBAN ${formatIban(company.iban)}` : ""}
              </Text>
            )}
            {company.conditionsPaiement && (
              <Text style={styles.footerText}>
                {company.conditionsPaiement}
              </Text>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
};








