import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import {
  clubDocumentPdfStyles as styles,
  formatPdfDateLong,
  pdfHyphenationCallback,
} from "@/lib/pdf/clubPdfLayout";
import type { SponsorContractPdfLocale } from "@/lib/utils/pdf-data";

type CompanyBlock = {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  iban?: string;
  bankName?: string;
  conditionsPaiement?: string;
};

export type SponsorContractPdfProps = {
  company: CompanyBlock;
  primaryColor?: string;
  currencySymbol: string;
  contract: {
    title: string;
    sponsorName: string;
    startDate: string;
    endDate: string;
    statusLabel: string;
    amountFormatted: string | null;
    emissionDate: string;
    content: string;
    sponsorType: string | null;
  };
  locale: SponsorContractPdfLocale;
};

const L = {
  fr: {
    docTitle: "CONTRAT DE SPONSORING",
    ref: "Référence",
    emission: "Date d'émission",
    currency: "Devise",
    sponsor: "Partenaire / Sponsor",
    object: "Objet du contrat",
    periodStart: "Début",
    periodEnd: "Fin",
    status: "Statut",
    amount: "Montant convenu",
    amountNA: "Non renseigné",
    body: "Dispositions",
    tier: "Niveau",
    tierGold: "Or",
    tierSilver: "Argent",
    tierBronze: "Bronze",
  },
  en: {
    docTitle: "SPONSORSHIP AGREEMENT",
    ref: "Reference",
    emission: "Issue date",
    currency: "Currency",
    sponsor: "Partner / Sponsor",
    object: "Subject",
    periodStart: "Start",
    periodEnd: "End",
    status: "Status",
    amount: "Agreed amount",
    amountNA: "Not specified",
    body: "Terms and conditions",
    tier: "Tier",
    tierGold: "Gold",
    tierSilver: "Silver",
    tierBronze: "Bronze",
  },
  de: {
    docTitle: "SPONSORINGVERTRAG",
    ref: "Referenz",
    emission: "Ausstellungsdatum",
    currency: "Währung",
    sponsor: "Partner / Sponsor",
    object: "Vertragsgegenstand",
    periodStart: "Beginn",
    periodEnd: "Ende",
    status: "Status",
    amount: "Vereinbarter Betrag",
    amountNA: "Keine Angabe",
    body: "Vertragsbestimmungen",
    tier: "Stufe",
    tierGold: "Gold",
    tierSilver: "Silber",
    tierBronze: "Bronze",
  },
} as const;

function tierLabel(locale: SponsorContractPdfLocale, type: string | null): string | null {
  if (!type) return null;
  const t = L[locale];
  if (type === "gold") return t.tierGold;
  if (type === "silver") return t.tierSilver;
  if (type === "bronze") return t.tierBronze;
  return type;
}

/** Découpe le texte libre en blocs (paragraphes) pour un rendu type contrat. */
function splitContractBody(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const parts = normalized.split(/\n{2,}/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

export const SponsorContractPdf: React.FC<SponsorContractPdfProps> = ({
  company,
  primaryColor = "#3B82F6",
  currencySymbol,
  contract,
  locale,
}) => {
  const lab = L[locale];
  const dynamicStyles = StyleSheet.create({
    documentType: { color: primaryColor },
    companyName: { color: primaryColor },
  });

  const paragraphs = splitContractBody(contract.content);
  const tier = tierLabel(locale, contract.sponsorType);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.companyBlock}>
              <View style={styles.companyTop}>
                {company.logoUrl ? <Image src={company.logoUrl} style={styles.logo} /> : null}
                <View>
                  <Text style={[styles.companyName, dynamicStyles.companyName]}>{company.name}</Text>
                  <Text style={[styles.companyDetails, styles.wrapText]}>
                    {company.address ? `${company.address}\n` : ""}
                    {company.email ? `${company.email}\n` : ""}
                    {company.phone || ""}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.documentBlock}>
              <Text style={[styles.documentType, dynamicStyles.documentType]}>{lab.docTitle}</Text>
              <View style={styles.metaBox}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{lab.ref}</Text>
                  <Text style={styles.wrapText}>{contract.title}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{lab.emission}</Text>
                  <Text>{formatPdfDateLong(contract.emissionDate)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{lab.periodStart}</Text>
                  <Text>{formatPdfDateLong(contract.startDate)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{lab.periodEnd}</Text>
                  <Text>{formatPdfDateLong(contract.endDate)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{lab.status}</Text>
                  <Text>{contract.statusLabel}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{lab.amount}</Text>
                  <Text>{contract.amountFormatted ?? lab.amountNA}</Text>
                </View>
                {tier ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>{lab.tier}</Text>
                    <Text>{tier}</Text>
                  </View>
                ) : null}
                <View style={[styles.metaRow, { marginBottom: 0 }]}>
                  <Text style={styles.metaLabel}>{lab.currency}</Text>
                  <Text>{currencySymbol}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.clientSection}>
            <Text style={styles.sectionTitle}>{lab.sponsor}</Text>
            <View style={styles.clientBox}>
              <Text style={[styles.clientName, styles.textBlock]}>{contract.sponsorName}</Text>
            </View>
          </View>

          <View style={styles.clientSection}>
            <Text style={styles.sectionTitle}>{lab.object}</Text>
            <View style={styles.clientBox}>
              <Text style={[styles.tableCell, styles.wrapText, styles.textBlock, { fontSize: 10 }]}>
                {contract.title}
              </Text>
            </View>
          </View>

          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>{lab.body}</Text>
            <View style={styles.clientBox}>
              {paragraphs.length === 0 ? (
                <Text style={[styles.contractBodyText, { color: "#64748B" }]}>-</Text>
              ) : (
                paragraphs.map((block, index) => (
                  <View
                    key={index}
                    style={{ marginBottom: index < paragraphs.length - 1 ? 10 : 0 }}
                  >
                    <Text
                      style={[styles.contractBodyText, styles.wrapText, styles.textBlock]}
                      wrap
                      hyphenationCallback={pdfHyphenationCallback}
                    >
                      {block}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
