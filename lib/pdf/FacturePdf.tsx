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
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#3B82F6",
  },
  logoSection: {
    width: "40%",
  },
  logo: {
    maxHeight: 80,
    maxWidth: 200,
  },
  companyInfo: {
    width: "55%",
    textAlign: "right",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B82F6",
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 8,
    color: "#666",
    lineHeight: 1.5,
  },
  documentType: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3B82F6",
    marginTop: 20,
    marginBottom: 10,
  },
  documentNumber: {
    fontSize: 12,
    color: "#666",
    marginBottom: 30,
  },
  documentInfo: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 20,
  },
  infoBlock: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 4,
  },
  infoBlockTitle: {
    fontSize: 9,
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 8,
    fontWeight: "bold",
  },
  infoBlockText: {
    fontSize: 9,
    color: "#333",
    marginBottom: 4,
  },
  table: {
    width: "100%",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#3B82F6",
    color: "white",
    padding: 10,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tableCell: {
    fontSize: 9,
  },
  colDesignation: {
    width: "50%",
  },
  colQty: {
    width: "12%",
    textAlign: "right",
  },
  colPrice: {
    width: "19%",
    textAlign: "right",
  },
  colTotal: {
    width: "19%",
    textAlign: "right",
  },
  totals: {
    marginTop: 20,
    marginLeft: "auto",
    width: 250,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    fontSize: 9,
  },
  totalRowSubtotal: {
    color: "#666",
  },
  totalRowVat: {
    color: "#666",
  },
  totalRowTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3B82F6",
    borderTopWidth: 2,
    borderTopColor: "#3B82F6",
    paddingTop: 10,
    marginTop: 5,
  },
  notes: {
    marginTop: 30,
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 4,
    fontSize: 9,
  },
  notesTitle: {
    fontSize: 9,
    color: "#666",
    marginBottom: 8,
    fontWeight: "bold",
  },
});

// Types pour les données
interface FacturePdfProps {
  company: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    logoUrl?: string;
  };
  client: {
    name: string;
    address?: string;
    email?: string;
  };
  document: {
    number: string;
    date: string;
    dueDate?: string;
    currency?: string;
    currencySymbol?: string;
    vatRate?: number;
    notes?: string;
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
}

// Fonction pour formater la monnaie
const formatCurrency = (amount: number, currencySymbol: string = "€") => {
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ` ${currencySymbol}`
  );
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

export const FacturePdf: React.FC<FacturePdfProps> = ({
  company,
  client,
  document,
  lines,
  totals,
  primaryColor = "#3B82F6",
}) => {
  // Styles dynamiques avec la couleur primaire
  const dynamicStyles = StyleSheet.create({
    headerBorder: {
      borderBottomColor: primaryColor,
    },
    documentType: {
      color: primaryColor,
    },
    companyName: {
      color: primaryColor,
    },
    tableHeader: {
      backgroundColor: primaryColor,
    },
    totalRowTotal: {
      color: primaryColor,
      borderTopColor: primaryColor,
    },
  });

  const currencySymbol = document.currencySymbol || "€";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={[styles.header, dynamicStyles.headerBorder]}>
          <View style={styles.logoSection}>
            {company.logoUrl && (
              <Image src={company.logoUrl} style={styles.logo} />
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={[styles.companyName, dynamicStyles.companyName]}>
              {company.name}
            </Text>
            <Text style={styles.companyDetails}>
              {company.address && `${company.address}\n`}
              {company.email && `${company.email}\n`}
              {company.phone}
            </Text>
          </View>
        </View>

        {/* Document Type */}
        <Text style={[styles.documentType, dynamicStyles.documentType]}>
          FACTURE
        </Text>
        <Text style={styles.documentNumber}>N° {document.number}</Text>

        {/* Client and Document Info */}
        <View style={styles.documentInfo}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>Facturer à</Text>
            <Text style={[styles.infoBlockText, { fontWeight: "bold" }]}>
              {client.name}
            </Text>
            {client.address && (
              <Text style={styles.infoBlockText}>{client.address}</Text>
            )}
            {client.email && (
              <Text style={styles.infoBlockText}>{client.email}</Text>
            )}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>Informations</Text>
            <Text style={styles.infoBlockText}>
              <Text style={{ fontWeight: "bold" }}>Date:</Text>{" "}
              {formatDate(document.date)}
            </Text>
            {document.dueDate && (
              <Text style={styles.infoBlockText}>
                <Text style={{ fontWeight: "bold" }}>Date d'échéance:</Text>{" "}
                {formatDate(document.dueDate)}
              </Text>
            )}
            <Text style={styles.infoBlockText}>
              <Text style={{ fontWeight: "bold" }}>Devise:</Text>{" "}
              {currencySymbol}
            </Text>
          </View>
        </View>

        {/* Lines Table */}
        <View style={styles.table}>
          <View style={[styles.tableHeader, dynamicStyles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, styles.colDesignation]}>
              Désignation
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>
              Prix unitaire
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          {lines.map((line, index) => (
            <View key={index}>
              <View style={styles.tableRow}>
                <View style={styles.colDesignation}>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                    {line.label}
                  </Text>
                  {line.description && (
                    <Text
                      style={[
                        styles.tableCell,
                        { fontSize: 8, color: "#666", marginTop: 4 },
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
          <View style={[styles.totalRow, styles.totalRowSubtotal]}>
            <Text>Sous-total HT:</Text>
            <Text>{formatCurrency(totals.subtotal, currencySymbol)}</Text>
          </View>
          {document.vatRate && document.vatRate > 0 && (
            <View style={[styles.totalRow, styles.totalRowVat]}>
              <Text>TVA ({document.vatRate}%):</Text>
              <Text>{formatCurrency(totals.vat, currencySymbol)}</Text>
            </View>
          )}
          <View
            style={[
              styles.totalRow,
              styles.totalRowTotal,
              dynamicStyles.totalRowTotal,
            ]}
          >
            <Text>Total TTC:</Text>
            <Text>{formatCurrency(totals.total, currencySymbol)}</Text>
          </View>
        </View>

        {/* Notes */}
        {document.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text>{document.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};






