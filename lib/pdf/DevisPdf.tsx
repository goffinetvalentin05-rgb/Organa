import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import {
  clubDocumentPdfStyles as styles,
  formatPdfCurrency,
  formatPdfDateLong,
  formatPdfIban,
  pdfHyphenationCallback,
  sanitizePdfNotes,
} from "@/lib/pdf/clubPdfLayout";

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
    email?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    city?: string;
  };
  document: {
    number: string;
    date: string;
    currency?: string;
    currencySymbol?: string;
    vatRate?: number;
    notes?: string;
    type?: "quote" | "invoice";
    /** Intitulé métier affiché sous le type de document (cotisation / devis) */
    subject?: string;
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
    title: string;       // "COTISATION" ou "DEVIS"
    clientLabel: string; // "CONCERNE" ou "CLIENT"
    numberLabel: string; // "Référence" ou "Numéro"
  };
}

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
  const numberLabel = documentLabel?.numberLabel || "Référence";

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
              {document.subject ? (
                <Text
                  style={{
                    fontSize: 10,
                    color: "#64748B",
                    marginTop: 4,
                    textAlign: "right",
                    maxWidth: 200,
                  }}
                  wrap
                >
                  {document.subject}
                </Text>
              ) : null}
              <View style={styles.metaBox}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{numberLabel}</Text>
                  <Text>{document.number}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Date d'émission</Text>
                  <Text>{formatPdfDateLong(document.date)}</Text>
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
              {/* 1. Nom (en gras) */}
              <Text style={[styles.clientName, styles.textBlock]}>
                {client.name}
              </Text>
              {/* 2. Adresse (rue) */}
              {client.address && (
                <Text style={[styles.companyDetails, styles.wrapText]}>
                  {client.address}
                </Text>
              )}
              {/* 3. Code postal + Localité sur une seule ligne */}
              {(client.postalCode || client.city) && (
                <Text style={[styles.companyDetails, styles.wrapText]}>
                  {[client.postalCode, client.city].filter(Boolean).join(" ")}
                </Text>
              )}
              {/* 4. Téléphone */}
              {client.phone && (
                <Text style={[styles.companyDetails, styles.wrapText]}>
                  {client.phone}
                </Text>
              )}
              {/* 5. Email */}
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
                    {formatPdfCurrency(line.unitPrice, currencySymbol)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colTotal]}>
                    {formatPdfCurrency(line.total, currencySymbol)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text>Sous-total HT</Text>
              <Text>{formatPdfCurrency(totals.subtotal, currencySymbol)}</Text>
            </View>
            {document.vatRate && document.vatRate > 0 && (
              <View style={styles.totalRow}>
                <Text>TVA ({document.vatRate}%)</Text>
                <Text>{formatPdfCurrency(totals.vat, currencySymbol)}</Text>
              </View>
            )}
            <View
              style={[styles.totalRow, styles.totalRowTotal, dynamicStyles.totalRowTotal]}
            >
              <Text>Total TTC</Text>
              <Text>{formatPdfCurrency(totals.total, currencySymbol)}</Text>
            </View>
          </View>

          {sanitizePdfNotes(document.notes, company) && (
            <View style={styles.notesSection}>
              <Text
                style={[styles.notesText, styles.wrapText, styles.textBlock]}
                wrap
                hyphenationCallback={pdfHyphenationCallback}
              >
                {sanitizePdfNotes(document.notes, company)}
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
                {company.iban ? `IBAN ${formatPdfIban(company.iban)}` : ""}
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








