import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { clubDocumentPdfStyles as styles, formatPdfDateLong } from "@/lib/pdf/clubPdfLayout";
import type { DistributionTeamGroup } from "@/lib/support-sales/distribution";

export type SupportSaleDistributionPdfProps = {
  company: {
    name: string;
    logoUrl?: string;
  };
  sale: {
    name: string;
    productName: string;
  };
  totalQuantity: number;
  groups: DistributionTeamGroup[];
  primaryColor?: string;
};

export function SupportSaleDistributionPdf({
  company,
  sale,
  totalQuantity,
  groups,
  primaryColor = "#1A23FF",
}: SupportSaleDistributionPdfProps) {
  const dynamic = StyleSheet.create({
    documentType: { color: primaryColor, fontSize: 18 },
    companyName: { color: primaryColor },
    teamTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: "#0F172A",
      marginBottom: 8,
      marginTop: 4,
    },
    teamTotal: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#0F172A",
      marginTop: 6,
      marginBottom: 14,
    },
    checkbox: {
      width: 11,
      height: 11,
      borderWidth: 1,
      borderColor: "#0F172A",
      marginLeft: "auto",
    },
    colMember: { width: "58%" },
    colQty: { width: "27%", textAlign: "right" },
    colCheck: { width: "15%", alignItems: "flex-end" },
    footerTotal: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: primaryColor,
      borderRadius: 8,
      padding: 12,
      backgroundColor: "#F8FAFC",
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
                <Text style={styles.companyDetails}>Feuille de distribution</Text>
              </View>
            </View>
          </View>
          <View style={styles.documentBlock}>
            <Text style={[styles.documentType, dynamic.documentType]}>Distribution</Text>
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
                <Text style={styles.metaLabel}>Généré le</Text>
                <Text>{formatPdfDateLong(new Date().toISOString())}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Total réservé</Text>
                <Text>{totalQuantity}</Text>
              </View>
            </View>
          </View>
        </View>

        {groups.length === 0 ? (
          <Text style={styles.notesText}>Aucune quantité à distribuer pour le moment.</Text>
        ) : (
          groups.map((group) => (
            <View key={group.key} wrap={false}>
              <Text style={dynamic.teamTitle}>{group.label}</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, dynamic.colMember]}>Membre</Text>
                  <Text style={[styles.tableHeaderCell, dynamic.colQty]}>Quantité à récupérer</Text>
                  <Text style={[styles.tableHeaderCell, dynamic.colCheck]}>Remis</Text>
                </View>
                {group.members.map((member) => (
                  <View key={member.memberId} style={styles.tableRow}>
                    <Text style={[styles.tableCell, dynamic.colMember]}>{member.memberName}</Text>
                    <Text style={[styles.tableCell, dynamic.colQty]}>{member.quantitySold}</Text>
                    <View style={dynamic.colCheck}>
                      <View style={dynamic.checkbox} />
                    </View>
                  </View>
                ))}
              </View>
              <Text style={dynamic.teamTotal}>
                Total {group.label} : {group.totalQuantity} {sale.productName}
              </Text>
            </View>
          ))
        )}

        <View style={dynamic.footerTotal}>
          <Text style={styles.sectionTitle}>Total à distribuer</Text>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: primaryColor }}>
            {totalQuantity} {sale.productName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
