import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Types pour les données du document
export interface DocumentPDFData {
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
    logoUrl: string | null;
  };
  client: {
    name: string;
    address: string;
    email: string;
  };
  document: {
    number: string;
    title?: string;
    date: string;
    dueDate?: string;
    currency: string;
    vatRate: number;
    notes?: string;
    type: "invoice" | "quote";
  };
  lines: Array<{
    label: string;
    description?: string;
    qty: number;
    unitPrice: number;
    total: number;
    vat: number;
  }>;
  totals: {
    subtotal: number;
    vat: number;
    total: number;
  };
  primaryColor?: string;
  currencySymbol?: string;
}

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
  },
  logoSection: {
    flex: 0,
    minWidth: 0,
    maxWidth: "50%",
  },
  logo: {
    maxHeight: 180,
    maxWidth: 500,
    objectFit: "contain",
  },
  companyInfo: {
    flex: 1,
    textAlign: "right",
    minWidth: 0,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#3b82f6",
  },
  companyDetails: {
    fontSize: 9,
    color: "#666",
    lineHeight: 1.6,
  },
  documentType: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    color: "#3b82f6",
  },
  documentInfo: {
    flexDirection: "row",
    gap: 30,
    marginBottom: 30,
  },
  infoBlock: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 4,
  },
  infoBlockTitle: {
    fontSize: 10,
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 8,
    fontWeight: 600,
  },
  infoBlockText: {
    fontSize: 10,
    color: "#333",
    margin: 4,
  },
  infoBlockTextBold: {
    fontSize: 10,
    color: "#333",
    margin: 4,
    fontWeight: 600,
  },
  linesTable: {
    width: "100%",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#3b82f6",
    color: "white",
    padding: 12,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 600,
    textTransform: "uppercase",
    color: "white",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    padding: 10,
  },
  tableCell: {
    fontSize: 10,
    color: "#333",
    padding: 4,
  },
  tableCellRight: {
    fontSize: 10,
    color: "#333",
    padding: 4,
    textAlign: "right",
  },
  lineTitle: {
    fontWeight: "bold",
    marginBottom: 0,
  },
  lineDescription: {
    fontSize: 9,
    color: "#666",
    lineHeight: 1.3,
    marginTop: 4,
    backgroundColor: "#f8f9fa",
    padding: 4,
  },
  colDesignation: {
    width: "45%",
  },
  colQty: {
    width: "15%",
  },
  colPrice: {
    width: "20%",
  },
  colTotal: {
    width: "20%",
  },
  totals: {
    marginTop: 20,
    marginLeft: "auto",
    width: 300,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    fontSize: 10,
  },
  totalsRowSubtotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    fontSize: 10,
    color: "#666",
  },
  totalsRowVat: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    fontSize: 10,
    color: "#666",
  },
  totalsRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    fontSize: 14,
    fontWeight: "bold",
    borderTopWidth: 2,
    borderTopColor: "#3b82f6",
    marginTop: 8,
    color: "#3b82f6",
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    fontSize: 10,
    color: "#333",
  },
  notesTitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 8,
    fontWeight: 600,
  },
});

// Fonction pour formater la devise
const formatCurrency = (amount: number | undefined | null, currency: string | undefined, currencySymbol?: string): string => {
  // Sécuriser les valeurs
  const safeAmount = amount && !isNaN(amount) ? amount : 0;
  const safeCurrency = currency || "EUR";
  
  // Utiliser le symbole personnalisé si fourni, sinon utiliser le formatage standard
  if (currencySymbol) {
    return `${new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount)} ${currencySymbol}`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: safeCurrency,
  }).format(safeAmount);
};

// Fonction pour formater la date
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) {
    return new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

// Helper pour sécuriser les styles (évite hasOwnProperty sur undefined)
// Ne gère plus les tableaux - ils doivent être convertis en spread avant
const safeStyle = (style: any): any => {
  // Gérer null/undefined
  if (!style) {
    return {};
  }
  
  // Gérer les primitives
  if (typeof style !== "object") {
    return {};
  }
  
  // Ne pas gérer les tableaux ici (doivent être convertis en spread)
  if (Array.isArray(style)) {
    return {};
  }
  
  try {
    // Vérifier que l'objet est valide (évite hasOwnProperty sur undefined)
    if (typeof style === "object" && style !== null) {
      return style;
    }
    return {};
  } catch (error) {
    // En cas d'erreur (hasOwnProperty sur undefined), retourner un objet vide
    return {};
  }
};

interface DocumentPDFProps {
  data: DocumentPDFData;
}

export const DocumentPDF: React.FC<DocumentPDFProps> = ({ data }) => {
  // Guard: Vérifier que data existe
  if (!data) {
    return (
      <Document>
        <Page size="A4" style={safeStyle(styles?.page)}>
          <Text>Erreur: Données manquantes</Text>
        </Page>
      </Document>
    );
  }

  // Valeurs par défaut sécurisées
  const company = data.company || { name: "", address: "", email: "", phone: "", logoUrl: null };
  const client = data.client || { name: "", address: "", email: "" };
  const document = data.document || { number: "", date: new Date().toISOString(), currency: "EUR", vatRate: 0, type: "invoice" as const };
  const lines = Array.isArray(data.lines) ? data.lines : [];
  const totals = data.totals || { subtotal: 0, vat: 0, total: 0 };
  
  const primaryColor = data.primaryColor || "#3b82f6";
  const currencySymbol = data.currencySymbol || "€";
  const documentTypeLabel = document.type === "invoice" ? "FACTURE" : "DEVIS";

  // Styles dynamiques inline (éviter StyleSheet.create dynamique qui cause des erreurs)
  // Sécuriser tous les spread operators avec ?? {}
  const headerStyle = {
    ...(safeStyle(styles?.header) ?? {}),
    borderBottomColor: primaryColor,
  };
  const companyNameStyle = {
    ...(safeStyle(styles?.companyName) ?? {}),
    color: primaryColor,
  };
  const documentTypeStyle = {
    ...(safeStyle(styles?.documentType) ?? {}),
    color: primaryColor,
  };
  const tableHeaderStyle = {
    ...(safeStyle(styles?.tableHeader) ?? {}),
    backgroundColor: primaryColor,
  };
  const totalsRowTotalStyle = {
    ...(safeStyle(styles?.totalsRowTotal) ?? {}),
    borderTopColor: primaryColor,
    color: primaryColor,
  };

  return (
    <Document>
      <Page size="A4" style={safeStyle(styles?.page)}>
        {/* Header */}
        <View style={headerStyle}>
          <View style={safeStyle(styles?.logoSection)}>
            {company.logoUrl && (
              <Image src={company.logoUrl} style={safeStyle(styles?.logo)} />
            )}
          </View>
          <View style={safeStyle(styles?.companyInfo)}>
            <Text style={companyNameStyle}>{company.name || "Entreprise"}</Text>
            <View>
              {(company.address || "").split("\n").map((line, i) => (
                <Text key={i} style={safeStyle(styles?.companyDetails)}>
                  {line}
                </Text>
              ))}
              <Text style={safeStyle(styles?.companyDetails)}>{company.email || ""}</Text>
              <Text style={safeStyle(styles?.companyDetails)}>{company.phone || ""}</Text>
            </View>
          </View>
        </View>

        {/* Document Type and Number */}
        <Text style={documentTypeStyle}>{documentTypeLabel}</Text>
        <Text style={safeStyle({ fontSize: 12, color: "#666", marginBottom: 30 })}>
          {document.title || `N° ${document.number || ""}`}
        </Text>

        {/* Client and Document Info */}
        <View style={safeStyle(styles?.documentInfo)}>
          <View style={safeStyle(styles?.infoBlock)}>
            <Text style={safeStyle(styles?.infoBlockTitle)}>Facturer à</Text>
            <Text style={safeStyle(styles?.infoBlockTextBold)}>{client.name || ""}</Text>
            <View>
              {(client.address || "").split("\n").map((line, i) => (
                <Text key={i} style={safeStyle(styles?.infoBlockText)}>
                  {line}
                </Text>
              ))}
            </View>
            <Text style={{ ...(safeStyle(styles?.infoBlockText) ?? {}), marginTop: 8 }}>
              {client.email || ""}
            </Text>
          </View>
          <View style={safeStyle(styles?.infoBlock)}>
            <Text style={safeStyle(styles?.infoBlockTitle)}>Informations</Text>
            <View>
              <Text style={safeStyle(styles?.infoBlockText)}>
                <Text style={safeStyle({ fontWeight: 600 })}>Date:</Text> {formatDate(document.date || new Date().toISOString())}
              </Text>
              {document.dueDate && (
                <Text style={safeStyle(styles?.infoBlockText)}>
                  <Text style={safeStyle({ fontWeight: 600 })}>Date d'échéance:</Text> {formatDate(document.dueDate)}
                </Text>
              )}
              <Text style={safeStyle(styles?.infoBlockText)}>
                <Text style={safeStyle({ fontWeight: 600 })}>Devise:</Text> {currencySymbol}
              </Text>
            </View>
          </View>
        </View>

        {/* Lines Table */}
        <View style={safeStyle(styles?.linesTable)}>
          <View style={tableHeaderStyle}>
            <Text style={{ ...(safeStyle(styles?.tableHeaderText) ?? {}), ...(safeStyle(styles?.colDesignation) ?? {}) }}>Désignation</Text>
            <Text style={{ ...(safeStyle(styles?.tableHeaderText) ?? {}), ...(safeStyle(styles?.colQty) ?? {}), textAlign: "right" }}>Qté</Text>
            <Text style={{ ...(safeStyle(styles?.tableHeaderText) ?? {}), ...(safeStyle(styles?.colPrice) ?? {}), textAlign: "right" }}>Prix unitaire</Text>
            <Text style={{ ...(safeStyle(styles?.tableHeaderText) ?? {}), ...(safeStyle(styles?.colTotal) ?? {}), textAlign: "right" }}>Total</Text>
          </View>
          {lines.map((line, index) => {
            const lineLabel = line.label || "";
            const lineQty = line.qty || 0;
            const lineUnitPrice = line.unitPrice || 0;
            const lineTotal = line.total || 0;
            const lineDescription = line.description || "";
            
            return (
              <View key={index}>
                <View style={safeStyle(styles?.tableRow)}>
                  <View style={safeStyle(styles?.colDesignation)}>
                    <Text style={{ ...(safeStyle(styles?.tableCell) ?? {}), ...(safeStyle(styles?.lineTitle) ?? {}) }}>{lineLabel}</Text>
                  </View>
                  <Text style={{ ...(safeStyle(styles?.tableCellRight) ?? {}), ...(safeStyle(styles?.colQty) ?? {}) }}>{lineQty}</Text>
                  <Text style={{ ...(safeStyle(styles?.tableCellRight) ?? {}), ...(safeStyle(styles?.colPrice) ?? {}) }}>
                    {formatCurrency(lineUnitPrice, document.currency || "EUR", currencySymbol)}
                  </Text>
                  <Text style={{ ...(safeStyle(styles?.tableCellRight) ?? {}), ...(safeStyle(styles?.colTotal) ?? {}) }}>
                    {formatCurrency(lineTotal, document.currency || "EUR", currencySymbol)}
                  </Text>
                </View>
                {lineDescription && (
                  <View style={safeStyle(styles?.tableRow)}>
                    <View style={safeStyle({ width: "100%", paddingLeft: 8, paddingRight: 8 })}>
                      {lineDescription.split("\n").map((descLine, i) => (
                        <Text key={i} style={safeStyle(styles?.lineDescription)}>
                          {descLine}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={safeStyle(styles?.totals)}>
          <View style={safeStyle(styles?.totalsRowSubtotal)}>
            <Text>Sous-total HT:</Text>
            <Text>{formatCurrency(totals.subtotal || 0, document.currency || "EUR", currencySymbol)}</Text>
          </View>
          <View style={safeStyle(styles?.totalsRowVat)}>
            <Text>TVA ({document.vatRate || 0}%):</Text>
            <Text>{formatCurrency(totals.vat || 0, document.currency || "EUR", currencySymbol)}</Text>
          </View>
          <View style={totalsRowTotalStyle}>
            <Text>Total TTC:</Text>
            <Text>{formatCurrency(totals.total || 0, document.currency || "EUR", currencySymbol)}</Text>
          </View>
        </View>

        {/* Notes */}
        {document.notes && (
          <View style={safeStyle(styles?.notes)}>
            <Text style={safeStyle(styles?.notesTitle)}>Notes</Text>
            <View>
              {(document.notes || "").split("\n").map((line, i) => (
                <Text key={i} style={safeStyle(styles?.infoBlockText)}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

