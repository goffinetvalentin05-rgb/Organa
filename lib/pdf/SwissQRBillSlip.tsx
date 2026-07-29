/**
 * SwissQRBillSlip — Composant @react-pdf/renderer
 *
 * Intègre la zone de paiement Swiss QR Bill officielle au bas d'une page A4.
 * Le SVG est généré par `swissqrbill/svg` et rendu via <Image> en data URI.
 *
 * Dimensions officielles SIX Group :
 * - Largeur totale : 210 mm (A4)
 * - Hauteur totale : 105 mm
 * - Reçu (gauche) : 62 mm × 105 mm
 * - Section paiement (droite) : 148 mm × 105 mm
 */

import React from "react";
import { View, Image, StyleSheet, Text } from "@react-pdf/renderer";
import type { QRBillData } from "@/lib/swiss-qr-bill/types";

interface SwissQRBillSlipProps {
  /** Data URI SVG base64 généré par generateSwissQRBillDataUri() */
  svgDataUri: string;
  /** Couleur primaire pour la ligne de séparation */
  primaryColor?: string;
  /** Indique si le QR Bill a été généré avec succès */
  hasQRBill: boolean;
  /** Message d'erreur si pas de QR Bill */
  errorMessage?: string;
  /** Données pour l'affichage fallback si SVG non dispo */
  fallbackData?: Pick<QRBillData, "creditor" | "amount" | "currency" | "message">;
}

const styles = StyleSheet.create({
  // Ligne de séparation perforée
  separator: {
    borderTopWidth: 1,
    borderTopStyle: "dashed",
    borderTopColor: "#CBD5E1",
    marginTop: 8,
    marginBottom: 0,
    position: "relative",
  },
  separatorLabel: {
    position: "absolute",
    top: -7,
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "white",
    paddingHorizontal: 8,
    fontSize: 7,
    color: "#94A3B8",
    letterSpacing: 1,
  },
  // Conteneur principal du slip (occupe 105mm de haut)
  slipContainer: {
    width: "100%",
    // hauteur en points PDF : 105mm ≈ 297.6pt
    height: 297.6,
    position: "relative",
    overflow: "hidden",
  },
  // Image SVG pleine largeur
  svgImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "top left",
  },
  // Section erreur/fallback
  errorContainer: {
    width: "100%",
    height: 297.6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 4,
    padding: 16,
  },
  errorText: {
    fontSize: 9,
    color: "#DC2626",
    textAlign: "center",
    lineHeight: 1.6,
  },
});

/**
 * Composant PDF : zone de paiement Swiss QR Bill conforme SIX Group.
 * À placer en bas de page (utilise `fixed` ou en dernier élément de page).
 */
export const SwissQRBillSlip: React.FC<SwissQRBillSlipProps> = ({
  svgDataUri,
  primaryColor = "#3B82F6",
  hasQRBill,
  errorMessage,
}) => {
  return (
    <View>
      {/* Ligne de séparation avec ciseaux — indique la zone de découpe */}
      <View style={[styles.separator, { borderTopColor: primaryColor + "40" }]}>
        <Text style={styles.separatorLabel}>✂  SECTION PAIEMENT</Text>
      </View>

      {hasQRBill && svgDataUri ? (
        <View style={styles.slipContainer}>
          <Image src={svgDataUri} style={styles.svgImage} />
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {errorMessage ||
              "QR-facture non disponible.\nConfigurez l'IBAN et l'adresse du bénéficiaire dans Paramètres > Paiements."}
          </Text>
        </View>
      )}
    </View>
  );
};
