import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import {
  clubDocumentPdfStyles as styles,
  formatPdfCurrency,
  formatPdfDateLong,
} from "@/lib/pdf/clubPdfLayout";

export type SupportSaleRecapPdfMember = {
  memberName: string;
  memberCategory: string | null;
  quantitySold: number;
  amountChf: number;
  reservations: Array<{
    buyerFirstName: string;
    quantity: number;
    amountChf: number;
  }>;
};

export type SupportSaleRecapPdfProps = {
  company: {
    name: string;
    logoUrl?: string;
  };
  sale: {
    name: string;
    productName: string;
    periodLabel: string;
    unitPriceChf: number;
  };
  summary: {
    reservationsCount: number;
    quantitySold: number;
    membersSoldCount: number;
    amountChf: number;
  };
  members: SupportSaleRecapPdfMember[];
  primaryColor?: string;
};

export function SupportSaleRecapPdf({
  company,
  sale,
  summary,
  members,
  primaryColor = "#1A23FF",
}: SupportSaleRecapPdfProps) {
  const dynamic = StyleSheet.create({
    documentType: { color: primaryColor },
    companyName: { color: primaryColor },
    memberTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#0F172A",
      marginBottom: 4,
    },
    memberCard: {
      marginBottom: 14,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      borderRadius: 6,
      padding: 10,
    },
    buyerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 9,
      color: "#334155",
      paddingVertical: 2,
    },
    grandTotal: {
      marginTop: 16,
      borderWidth: 1,
      borderColor: primaryColor,
      borderRadius: 8,
      padding: 14,
      backgroundColor: "#F8FAFC",
    },
    grandTotalLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 1,
      color: "#64748B",
      marginBottom: 8,
    },
    grandTotalValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: primaryColor,
      marginTop: 4,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <View style={styles.companyTop}>
              {company.logoUrl ? <Image src={company.logoUrl} style={styles.logo} /> : null}
              <View>
                <Text style={[styles.companyName, dynamic.companyName]}>{company.name || "Club"}</Text>
                <Text style={styles.companyDetails}>Vente de soutien</Text>
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
                <Text style={styles.metaLabel}>Période</Text>
                <Text>{sale.periodLabel}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Prix unitaire</Text>
                <Text>{formatPdfCurrency(sale.unitPriceChf, "CHF")}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Récapitulatif général</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colDesignation]}>Nombre de réservations</Text>
            <Text style={[styles.tableCell, styles.colTotal]}>{summary.reservationsCount}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colDesignation]}>Quantité totale vendue</Text>
            <Text style={[styles.tableCell, styles.colTotal]}>{summary.quantitySold}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colDesignation]}>Membres ayant vendu</Text>
            <Text style={[styles.tableCell, styles.colTotal]}>{summary.membersSoldCount}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colDesignation]}>Montant total généré</Text>
            <Text style={[styles.tableCell, styles.colTotal]}>
              {formatPdfCurrency(summary.amountChf, "CHF")}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Détail par membre</Text>
        {members.length === 0 ? (
          <Text style={styles.notesText}>Aucune réservation confirmée.</Text>
        ) : (
          members.map((member) => (
            <View key={member.memberName} style={dynamic.memberCard} wrap={false}>
              <Text style={dynamic.memberTitle}>
                {member.memberName}
                {member.memberCategory ? ` — ${member.memberCategory}` : ""}
              </Text>
              <Text style={styles.notesText}>
                Total : {member.quantitySold} produits — {formatPdfCurrency(member.amountChf, "CHF")}
              </Text>
              <View style={{ marginTop: 6 }}>
                {member.reservations.map((reservation, index) => (
                  <View key={`${member.memberName}-${index}`} style={dynamic.buyerRow}>
                    <Text>
                      {reservation.buyerFirstName} × {reservation.quantity}
                    </Text>
                    <Text>{formatPdfCurrency(reservation.amountChf, "CHF")}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        <View style={dynamic.grandTotal}>
          <Text style={dynamic.grandTotalLabel}>Total de la vente</Text>
          <Text style={styles.notesText}>{summary.quantitySold} produits vendus</Text>
          <Text style={dynamic.grandTotalValue}>{formatPdfCurrency(summary.amountChf, "CHF")}</Text>
          <Text style={[styles.notesText, { marginTop: 8 }]}>
            Document généré le {formatPdfDateLong(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
