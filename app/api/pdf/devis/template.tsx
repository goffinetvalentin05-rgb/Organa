import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Devis } from "@/lib/mock-data";

const styles = StyleSheet.create({
  page: {
    padding: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
  },
  table: {
    marginTop: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    fontWeight: "bold",
  },
  tableCell: {
    fontSize: 10,
    paddingHorizontal: 8,
  },
});

interface DevisPdfProps {
  devis: Devis;
}

export function DevisPdf({ devis }: DevisPdfProps) {
  if (!devis) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Erreur : données du devis manquantes</Text>
        </Page>
      </Document>
    );
  }

  const lignes = devis.lignes || [];
  const client = devis.client;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>DEVIS</Text>
          <Text style={styles.value}>{devis.numero || ""}</Text>
        </View>

        {client && (
          <View style={styles.section}>
            <Text style={styles.label}>Client:</Text>
            <Text style={styles.value}>{client.nom || ""}</Text>
            {client.adresse && (
              <Text style={styles.value}>{client.adresse}</Text>
            )}
            {client.email && (
              <Text style={styles.value}>{client.email}</Text>
            )}
            {client.telephone && (
              <Text style={styles.value}>{client.telephone}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Date de création:</Text>
          <Text style={styles.value}>{devis.dateCreation || ""}</Text>
        </View>

        {devis.dateEcheance && (
          <View style={styles.section}>
            <Text style={styles.label}>Date d'échéance:</Text>
            <Text style={styles.value}>{devis.dateEcheance}</Text>
          </View>
        )}

        {lignes.length > 0 && (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: "40%" }]}>
                Désignation
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>Qté</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>Prix unit.</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>TVA</Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>Total</Text>
            </View>
            {lignes.map((ligne) => {
              if (!ligne) return null;
              const sousTotal =
                (ligne.quantite || 0) * (ligne.prixUnitaire || 0);
              return (
                <View key={ligne.id || Math.random()} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: "40%" }]}>
                    {ligne.designation || ""}
                  </Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>
                    {ligne.quantite || 0}
                  </Text>
                  <Text style={[styles.tableCell, { width: "20%" }]}>
                    {ligne.prixUnitaire || 0} CHF
                  </Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>
                    {ligne.tva || 0}%
                  </Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>
                    {sousTotal.toFixed(2)} CHF
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {devis.notes && (
          <View style={styles.section}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.value}>{devis.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
