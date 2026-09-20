import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import {
  clubDocumentPdfStyles as styles,
  formatPdfCurrency,
  formatPdfDateLong,
} from "@/lib/pdf/clubPdfLayout";

export type SupportSaleRecapPdfProps = {
  company: {
    name: string;
    logoUrl?: string;
  };
  sale: {
    name: string;
    productName: string;
    startDateLabel: string;
    endDateLabel: string;
    unitPriceChf: number;
    sponsorName: string | null;
  };
  summary: {
    reservationsCount: number;
    quantitySold: number;
    membersSoldCount: number;
    amountChf: number;
  };
  primaryColor?: string;
};

export function SupportSaleRecapPdf({
  company,
  sale,
  summary,
  primaryColor = "#1A23FF",
}: SupportSaleRecapPdfProps) {
  const dynamic = StyleSheet.create({
    documentType: { color: primaryColor },
    companyName: { color: primaryColor },
    resultRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#E2E8F0",
    },
    resultLabel: {
      fontSize: 11,
      color: "#475569",
    },
    resultValue: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#0F172A",
    },
    hero: {
      marginTop: 22,
      borderWidth: 1.5,
      borderColor: primaryColor,
      borderRadius: 10,
      padding: 18,
      backgroundColor: "#F8FAFC",
      alignItems: "center",
    },
    heroLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      color: "#64748B",
      marginBottom: 6,
    },
    heroValue: {
      fontSize: 26,
      fontWeight: "bold",
      color: primaryColor,
    },
    sponsor: {
      marginTop: 22,
      color: "#64748B",
      fontSize: 9,
      textAlign: "center",
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <View style={styles.companyTop}>
              {company.logoUrl ? <Image src={company.logoUrl} style={styles.logo} /> : null}
              <View>
                <Text style={[styles.companyName, dynamic.companyName]}>{company.name || "Club"}</Text>
                <Text style={styles.companyDetails}>Bilan final — Vente de soutien</Text>
              </View>
            </View>
          </View>
          <View style={styles.documentBlock}>
            <Text style={[styles.documentType, dynamic.documentType]}>Récapitulatif</Text>
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Vente</Text>
                <Text>{sale.name}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Produit</Text>
                <Text>{sale.productName}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Début</Text>
                <Text>{sale.startDateLabel}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Fin</Text>
                <Text>{sale.endDateLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Résultats</Text>
        <View>
          <View style={dynamic.resultRow}>
            <Text style={dynamic.resultLabel}>Réservations</Text>
            <Text style={dynamic.resultValue}>{summary.reservationsCount}</Text>
          </View>
          <View style={dynamic.resultRow}>
            <Text style={dynamic.resultLabel}>Quantité vendue</Text>
            <Text style={dynamic.resultValue}>{summary.quantitySold}</Text>
          </View>
          <View style={dynamic.resultRow}>
            <Text style={dynamic.resultLabel}>Membres vendeurs</Text>
            <Text style={dynamic.resultValue}>{summary.membersSoldCount}</Text>
          </View>
          <View style={dynamic.resultRow}>
            <Text style={dynamic.resultLabel}>Prix unitaire</Text>
            <Text style={dynamic.resultValue}>
              {formatPdfCurrency(sale.unitPriceChf, "CHF")} / {sale.productName}
            </Text>
          </View>
        </View>

        <View style={dynamic.hero}>
          <Text style={dynamic.heroLabel}>Montant total généré</Text>
          <Text style={dynamic.heroValue}>{formatPdfCurrency(summary.amountChf, "CHF")}</Text>
        </View>

        {sale.sponsorName ? (
          <Text style={dynamic.sponsor}>Cette vente a été soutenue par {sale.sponsorName}</Text>
        ) : null}

        <Text style={[styles.notesText, { marginTop: 18 }]}>
          Document généré le {formatPdfDateLong(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  );
}
