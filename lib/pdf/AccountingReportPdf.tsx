import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import { ACCOUNTING_TAGLINE } from "@/lib/accounting/copy";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#0F172A" },
  title: { fontSize: 16, marginBottom: 4 },
  meta: { fontSize: 9, color: "#64748B", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: "1px solid #E2E8F0" },
  total: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, fontSize: 12 },
});

export async function renderAccountingSummaryPdf(input: {
  clubLabel: string;
  periodLabel: string;
  revenue: number;
  expense: number;
  result: number;
  bank: number;
  cash: number;
  stripe: number;
  coverageNote?: string | null;
}): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Compte de résultat et trésorerie</Text>
        <Text style={styles.meta}>
          {input.clubLabel} · Exercice {input.periodLabel} · {ACCOUNTING_TAGLINE}
        </Text>
        {input.coverageNote ? <Text style={styles.meta}>{input.coverageNote}</Text> : null}
        <View style={styles.row}>
          <Text>Produits validés</Text>
          <Text>{formatChfAmount(input.revenue)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Charges validées</Text>
          <Text>{formatChfAmount(input.expense)}</Text>
        </View>
        <View style={styles.total}>
          <Text>Résultat</Text>
          <Text>{formatChfAmount(input.result)}</Text>
        </View>
        <Text style={{ marginTop: 18, marginBottom: 6 }}>Trésorerie validée</Text>
        <View style={styles.row}>
          <Text>Banque</Text>
          <Text>{formatChfAmount(input.bank)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Caisse</Text>
          <Text>{formatChfAmount(input.cash)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Stripe</Text>
          <Text>{formatChfAmount(input.stripe)}</Text>
        </View>
        <Text style={styles.meta}>
          Document établi le {formatSwissDate(new Date().toISOString())}. Seules les écritures validées sont incluses.
        </Text>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
