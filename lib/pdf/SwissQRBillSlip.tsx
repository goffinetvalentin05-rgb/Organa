/**
 * SwissQRBillSlip — réservation de la zone de paiement Swiss QR Bill.
 *
 * Ce composant ne dessine pas la QR-facture : `@react-pdf/renderer` ne sait
 * afficher que du JPEG et du PNG, et rastériser la zone de paiement
 * dégraderait la lisibilité du QR. Elle est donc produite en vectoriel par
 * PDFKit puis incrustée après coup (voir `lib/pdf/mergeQRBill.ts`).
 *
 * Le rôle de ce composant est de réserver dans le flux la partie du slip qui
 * dépasse la marge basse déjà vide. Comme `@react-pdf/renderer` bascule un
 * bloc de hauteur fixe sur la page suivante lorsqu'il ne tient plus, cette
 * réservation garantit que le bas de la dernière page est libre et que la
 * zone de paiement ne recouvrira jamais le contenu de la facture.
 *
 * Si la QR-facture ne peut pas être générée, un encart explicatif compact
 * prend sa place et le pied de page bancaire classique est conservé.
 */

import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { QR_BILL_HEIGHT_PT } from "@/lib/swiss-qr-bill";
import { CLUB_PDF_PAGE_PADDING } from "@/lib/pdf/clubPdfLayout";

/**
 * Hauteur à neutraliser dans le flux du document.
 *
 * La zone de paiement est posée tout en bas de la page, de 0 à 105 mm. La
 * marge basse de la page est déjà vide et tombe dans cette bande : il suffit
 * donc de bloquer la différence pour que le contenu reste au-dessus du slip.
 * Réserver les 105 mm entiers gaspillerait la hauteur d'une marge et
 * provoquerait des pages supplémentaires inutiles.
 */
const RESERVATION_HEIGHT_PT = Math.max(0, QR_BILL_HEIGHT_PT - CLUB_PDF_PAGE_PADDING);

interface SwissQRBillSlipProps {
  /** Vrai si la zone de paiement sera incrustée dans le PDF final. */
  hasQRBill: boolean;
  /** Message affiché lorsque la QR-facture ne peut pas être produite. */
  errorMessage?: string;
}

const styles = StyleSheet.create({
  reservation: {
    width: "100%",
    height: RESERVATION_HEIGHT_PT,
  },
  errorBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
    padding: 12,
  },
  errorTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#B91C1C",
    marginBottom: 4,
  },
  errorText: {
    fontSize: 8,
    color: "#DC2626",
    lineHeight: 1.5,
  },
});

export const SwissQRBillSlip: React.FC<SwissQRBillSlipProps> = ({
  hasQRBill,
  errorMessage,
}) => {
  if (!hasQRBill) {
    return (
      <View style={styles.errorBox} wrap={false}>
        <Text style={styles.errorTitle}>QR-facture indisponible</Text>
        <Text style={styles.errorText}>
          {errorMessage ||
            "Complétez l'IBAN et l'adresse du bénéficiaire dans Paramètres > QR-facture suisse pour que la zone de paiement soit générée automatiquement."}
        </Text>
      </View>
    );
  }

  return <View style={styles.reservation} wrap={false} />;
};
