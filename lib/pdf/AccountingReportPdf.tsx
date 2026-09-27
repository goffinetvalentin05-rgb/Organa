import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import type {
  AmountGroup,
  BalanceSheetReport,
  IncomeReport,
  JournalReport,
  LedgerReport,
} from "@/lib/accounting/reports";

const ink = "#0F172A";
const muted = "#64748B";
const line = "#E2E8F0";
const paper = "#F8FAFC";

const styles = StyleSheet.create({
  page: { paddingTop: 78, paddingBottom: 40, paddingHorizontal: 32, fontFamily: "Helvetica", fontSize: 9, color: ink },
  header: { position: "absolute", top: 22, left: 32, right: 32 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { flexDirection: "row", alignItems: "center", maxWidth: "62%" },
  logo: { width: 42, height: 42, marginRight: 8, objectFit: "contain" },
  club: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "right" },
  meta: { marginTop: 2, fontSize: 8, color: muted, textAlign: "right" },
  scope: { marginTop: 8, marginBottom: 8, fontSize: 8, color: muted },
  section: { marginTop: 8, fontSize: 10, fontFamily: "Helvetica-Bold" },
  group: { marginTop: 8, marginBottom: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: muted },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 3, borderBottomWidth: 0.4, borderBottomColor: line },
  subtotal: { flexDirection: "row", alignItems: "center", paddingVertical: 4, borderTopWidth: 0.8, borderTopColor: ink },
  pair: { flexDirection: "row", justifyContent: "space-between" },
  col: { width: "48.5%" },
  num: { width: 36, fontSize: 8, color: muted },
  name: { flexGrow: 1, flexShrink: 1, paddingRight: 6 },
  amount: { width: 72, textAlign: "right" },
  totalBar: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 6, borderTopWidth: 1.2, borderTopColor: ink },
  totalText: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  gap: { marginTop: 8, padding: 6, backgroundColor: "#FEF2F2", color: "#9F1239", fontSize: 9 },
  tableHead: { flexDirection: "row", backgroundColor: paper, borderBottomWidth: 0.8, borderBottomColor: ink, paddingVertical: 4 },
  headCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: muted },
  cell: { fontSize: 8, paddingRight: 3 },
  footer: { position: "absolute", bottom: 16, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: muted },
  empty: { paddingVertical: 3, color: muted, fontSize: 8 },
});

export type AccountingPdfClub = {
  name: string;
  logoUrl?: string | null;
};

type Shared = {
  club: AccountingPdfClub;
  generatedOn: string;
};

function money(amount: number): string {
  return formatChfAmount(amount).replace(/^CHF\s/, "");
}

function Header({ club, title, lines }: { club: AccountingPdfClub; title: string; lines: string[] }) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerRow}>
        <View style={styles.brand}>
          {club.logoUrl ? <Image src={club.logoUrl} style={styles.logo} /> : null}
          {club.name ? <Text style={styles.club}>{club.name}</Text> : null}
        </View>
        <View>
          <Text style={styles.title}>{title}</Text>
          {lines.map((lineText) => <Text key={lineText} style={styles.meta}>{lineText}</Text>)}
        </View>
      </View>
    </View>
  );
}

function Footer({ generatedOn }: { generatedOn: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Devise CHF · Généré le {formatSwissDate(generatedOn)}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function AmountRows({ group, showTitle = true, showSubtotal = true }: { group: AmountGroup; showTitle?: boolean; showSubtotal?: boolean }) {
  return (
    <View>
      {showTitle ? <Text style={styles.group}>{group.title}</Text> : null}
      {group.lines.length === 0 ? <Text style={styles.empty}>Aucun mouvement</Text> : null}
      {group.lines.map((item) => (
        <View key={`${group.title}-${item.number}`} style={styles.row} wrap={false}>
          <Text style={styles.num}>{item.number}</Text>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.amount}>{money(item.amount)}</Text>
        </View>
      ))}
      {showSubtotal ? (
        <View style={styles.subtotal} wrap={false}>
          <Text style={[styles.name, { fontFamily: "Helvetica-Bold" }]}>Total {group.title.toLowerCase()}</Text>
          <Text style={[styles.amount, { fontFamily: "Helvetica-Bold" }]}>{money(group.total)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function sideItems(groups: AmountGroup[]) {
  const items: Array<{ key: string; node: ReactNode }> = [];
  for (const group of groups) {
    items.push({ key: `${group.title}-title`, node: <Text style={styles.group}>{group.title}</Text> });
    if (group.lines.length === 0) {
      items.push({ key: `${group.title}-empty`, node: <Text style={styles.empty}>Aucun mouvement</Text> });
    }
    for (const item of group.lines) {
      items.push({
        key: `${group.title}-${item.number}-${item.name}`,
        node: (
          <View style={styles.row} wrap={false}>
            <Text style={styles.num}>{item.number}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.amount}>{money(item.amount)}</Text>
          </View>
        ),
      });
    }
    items.push({
      key: `${group.title}-total`,
      node: (
        <View style={styles.subtotal} wrap={false}>
          <Text style={[styles.name, { fontFamily: "Helvetica-Bold" }]}>Total {group.title.toLowerCase()}</Text>
          <Text style={[styles.amount, { fontFamily: "Helvetica-Bold" }]}>{money(group.total)}</Text>
        </View>
      ),
    });
  }
  return items;
}

function BalanceDocument({ report, club, generatedOn }: Shared & { report: BalanceSheetReport }) {
  const left = sideItems(report.assets);
  const right = sideItems(report.funding);
  const count = Math.max(left.length, right.length);
  const pairs = Array.from({ length: count }, (_, index) => ({
    key: `pair-${index}`,
    left: left[index]?.node || null,
    right: right[index]?.node || null,
  }));
  return (
    <Document title="Bilan">
      <Page size="A4" style={styles.page}>
        <Header
          club={club}
          title="Bilan"
          lines={[
            `Situation au ${formatSwissDate(report.asOf)}`,
            `Exercice ${report.periodLabel}`,
            "Devise CHF",
          ]}
        />
        {pairs.map((pair) => (
          <View key={pair.key} style={styles.pair} wrap={false}>
            <View style={styles.col}>{pair.left}</View>
            <View style={styles.col}>{pair.right}</View>
          </View>
        ))}
        <View style={styles.totalBar} wrap={false}>
          <Text style={styles.totalText}>Total actifs {formatChfAmount(report.assetTotal)}</Text>
          <Text style={styles.totalText}>Total passifs et fonds propres {formatChfAmount(report.fundingTotal)}</Text>
        </View>
        {report.gap !== 0 ? (
          <Text style={styles.gap}>
            Écart {formatChfAmount(Math.abs(report.gap))}. Les deux côtés du bilan ne concordent pas. Aucun montant d'équilibrage n'a été ajouté.
          </Text>
        ) : null}
        <Footer generatedOn={generatedOn} />
      </Page>
    </Document>
  );
}

function IncomeDocument({ report, club, generatedOn }: Shared & { report: IncomeReport }) {
  return (
    <Document title="Compte de résultat">
      <Page size="A4" style={styles.page}>
        <Header
          club={club}
          title="Compte de résultat"
          lines={[
            `Période du ${formatSwissDate(report.from)} au ${formatSwissDate(report.to)}`,
            `Exercice ${report.periodLabel}`,
            "Devise CHF",
          ]}
        />
        <Text style={styles.section}>Produits</Text>
        {report.products.length === 0 ? <Text style={styles.empty}>Aucun produit sur cette période.</Text> : report.products.map((group) => (
          <AmountRows key={group.title} group={group} showTitle={group.title !== "Produits"} showSubtotal={report.products.length > 1} />
        ))}
        <View style={styles.subtotal}>
          <Text style={[styles.name, { fontFamily: "Helvetica-Bold" }]}>Total des produits</Text>
          <Text style={[styles.amount, { fontFamily: "Helvetica-Bold" }]}>{money(report.productTotal)}</Text>
        </View>
        <Text style={styles.section}>Charges</Text>
        {report.charges.length === 0 ? <Text style={styles.empty}>Aucune charge sur cette période.</Text> : report.charges.map((group) => (
          <AmountRows key={group.title} group={group} showTitle={group.title !== "Charges"} showSubtotal={report.charges.length > 1} />
        ))}
        <View style={styles.subtotal}>
          <Text style={[styles.name, { fontFamily: "Helvetica-Bold" }]}>Total des charges</Text>
          <Text style={[styles.amount, { fontFamily: "Helvetica-Bold" }]}>{money(report.chargeTotal)}</Text>
        </View>
        <View style={styles.totalBar}>
          <Text style={styles.totalText}>{report.outcome.label}</Text>
          <Text style={styles.totalText}>{formatChfAmount(report.outcome.amount)}</Text>
        </View>
        <Footer generatedOn={generatedOn} />
      </Page>
    </Document>
  );
}

const journalWidths = {
  date: "11%",
  number: "6%",
  piece: "8%",
  label: "16%",
  debit: "16%",
  credit: "16%",
  amount: "9%",
  remark: "10%",
  status: "8%",
} as const;

function JournalDocument({ report, club, generatedOn }: Shared & { report: JournalReport }) {
  const heads: Array<[keyof typeof journalWidths, string]> = [
    ["date", "Date"],
    ["number", "N°"],
    ["piece", "Pièce"],
    ["label", "Libellé"],
    ["debit", "Débit"],
    ["credit", "Crédit"],
    ["amount", "Montant"],
    ["remark", "Remarque"],
    ["status", "Statut"],
  ];
  return (
    <Document title="Journal">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header
          club={club}
          title="Journal"
          lines={[
            `Période du ${formatSwissDate(report.from)} au ${formatSwissDate(report.to)}`,
            `Exercice ${report.periodLabel}`,
            "Devise CHF",
          ]}
        />
        <Text style={styles.scope}>{report.scope} {report.lineCount} ligne{report.lineCount > 1 ? "s" : ""}.</Text>
        <View style={styles.tableHead} fixed>
          {heads.map(([key, label]) => <Text key={key} style={[styles.headCell, { width: journalWidths[key] }]}>{label}</Text>)}
        </View>
        {report.rows.length === 0 ? <Text style={styles.empty}>Aucune écriture sur cette période.</Text> : null}
        {report.rows.map((row) => (
          <View key={`${row.entryId}-${row.lineIndex}`} style={styles.row} wrap={false}>
            <Text style={[styles.cell, { width: journalWidths.date }]}>{formatSwissDate(row.date)}</Text>
            <Text style={[styles.cell, { width: journalWidths.number }]}>{String(row.number)}</Text>
            <Text style={[styles.cell, { width: journalWidths.piece }]}>{row.piece}</Text>
            <Text style={[styles.cell, { width: journalWidths.label }]}>{row.label}</Text>
            <Text style={[styles.cell, { width: journalWidths.debit }]}>{row.debit}</Text>
            <Text style={[styles.cell, { width: journalWidths.credit }]}>{row.credit}</Text>
            <Text style={[styles.cell, { width: journalWidths.amount, textAlign: "right" }]}>{money(row.amount)}</Text>
            <Text style={[styles.cell, { width: journalWidths.remark }]}>{row.remark}</Text>
            <Text style={[styles.cell, { width: journalWidths.status }]}>{row.status}</Text>
          </View>
        ))}
        <Footer generatedOn={generatedOn} />
      </Page>
    </Document>
  );
}

const ledgerWidths = {
  date: "11%",
  number: "6%",
  piece: "9%",
  label: "20%",
  counterpart: "22%",
  debit: "10%",
  credit: "10%",
  balance: "12%",
} as const;

function LedgerDocument({ report, club, generatedOn }: Shared & { report: LedgerReport }) {
  const heads: Array<[keyof typeof ledgerWidths, string]> = [
    ["date", "Date"],
    ["number", "N°"],
    ["piece", "Pièce"],
    ["label", "Libellé"],
    ["counterpart", "Contrepartie"],
    ["debit", "Débit"],
    ["credit", "Crédit"],
    ["balance", "Solde"],
  ];
  return (
    <Document title={`Extrait de compte ${report.accountNumber}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header
          club={club}
          title="Extrait de compte"
          lines={[
            `${report.accountNumber} ${report.accountName}`,
            `Période du ${formatSwissDate(report.from)} au ${formatSwissDate(report.to)}`,
            `Exercice ${report.periodLabel} · Devise CHF`,
          ]}
        />
        <Text style={styles.scope}>{report.scope}</Text>
        <View style={styles.row} wrap={false}>
          <Text style={[styles.name, { fontFamily: "Helvetica-Bold" }]}>Solde initial</Text>
          <Text style={[styles.amount, { fontFamily: "Helvetica-Bold" }]}>{formatChfAmount(report.opening)}</Text>
        </View>
        <View style={styles.tableHead}>
          {heads.map(([key, label]) => <Text key={key} style={[styles.headCell, { width: ledgerWidths[key] }]}>{label}</Text>)}
        </View>
        {report.movements.length === 0 ? <Text style={styles.empty}>Aucun mouvement sur cette période.</Text> : null}
        {report.movements.map((row, index) => (
          <View key={`${row.date}-${index}`} style={styles.row} wrap={false}>
            <Text style={[styles.cell, { width: ledgerWidths.date }]}>{formatSwissDate(row.date)}</Text>
            <Text style={[styles.cell, { width: ledgerWidths.number }]}>{String(row.number)}</Text>
            <Text style={[styles.cell, { width: ledgerWidths.piece }]}>{row.piece}</Text>
            <Text style={[styles.cell, { width: ledgerWidths.label }]}>{row.label}</Text>
            <Text style={[styles.cell, { width: ledgerWidths.counterpart }]}>{row.counterpart}</Text>
            <Text style={[styles.cell, { width: ledgerWidths.debit, textAlign: "right" }]}>{row.debit ? money(row.debit) : ""}</Text>
            <Text style={[styles.cell, { width: ledgerWidths.credit, textAlign: "right" }]}>{row.credit ? money(row.credit) : ""}</Text>
            <Text style={[styles.cell, { width: ledgerWidths.balance, textAlign: "right" }]}>{money(row.balance)}</Text>
          </View>
        ))}
        <View style={styles.totalBar}>
          <Text style={styles.totalText}>Solde final</Text>
          <Text style={styles.totalText}>{formatChfAmount(report.closing)}</Text>
        </View>
        <Footer generatedOn={generatedOn} />
      </Page>
    </Document>
  );
}

export type AccountingReportPdfInput = Shared & (
  | { kind: "balance"; report: BalanceSheetReport }
  | { kind: "result"; report: IncomeReport }
  | { kind: "journal"; report: JournalReport }
  | { kind: "ledger"; report: LedgerReport }
);

export async function renderAccountingReportPdf(input: AccountingReportPdfInput): Promise<Buffer> {
  const shared = { club: input.club, generatedOn: input.generatedOn };
  switch (input.kind) {
    case "balance":
      return renderToBuffer(<BalanceDocument {...shared} report={input.report} />);
    case "result":
      return renderToBuffer(<IncomeDocument {...shared} report={input.report} />);
    case "journal":
      return renderToBuffer(<JournalDocument {...shared} report={input.report} />);
    case "ledger":
      return renderToBuffer(<LedgerDocument {...shared} report={input.report} />);
  }
}
