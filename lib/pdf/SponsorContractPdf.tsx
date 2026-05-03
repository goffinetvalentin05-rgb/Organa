import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#0F172A" },
  h1: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  meta: { marginBottom: 20, fontSize: 9, color: "#475569", lineHeight: 1.5 },
  body: { fontSize: 10, lineHeight: 1.5, whiteSpace: "pre-wrap" },
});

export type SponsorContractPdfProps = {
  clubName: string;
  sponsorName: string;
  title: string;
  amountLabel: string | null;
  startDate: string;
  endDate: string;
  sponsorTypeLabel: string | null;
  content: string;
};

export function SponsorContractPdf({
  clubName,
  sponsorName,
  title,
  amountLabel,
  startDate,
  endDate,
  sponsorTypeLabel,
  content,
}: SponsorContractPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{title}</Text>
        <View style={styles.meta}>
          <Text>Club : {clubName}</Text>
          <Text>Sponsor : {sponsorName}</Text>
          {sponsorTypeLabel ? <Text>Type : {sponsorTypeLabel}</Text> : null}
          <Text>
            Période : {startDate} → {endDate}
          </Text>
          {amountLabel ? <Text>Montant : {amountLabel}</Text> : null}
        </View>
        <Text style={styles.body}>{content || "—"}</Text>
      </Page>
    </Document>
  );
}
