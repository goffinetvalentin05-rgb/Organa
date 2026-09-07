import React from "react";
import { View, Text, Link, Image, StyleSheet } from "@react-pdf/renderer";

type OnlinePaymentSectionProps = {
  url: string;
  qrImageSrc?: string | null;
};

const styles = StyleSheet.create({
  box: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    padding: 14,
  },
  title: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 6,
  },
  text: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.45,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  qr: {
    width: 72,
    height: 72,
    marginRight: 12,
  },
  cta: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1A23FF",
    textDecoration: "none",
    marginBottom: 4,
  },
  hint: {
    fontSize: 8,
    color: "#64748B",
    lineHeight: 1.4,
    maxWidth: 360,
  },
});

export const OnlinePaymentSection: React.FC<OnlinePaymentSectionProps> = ({
  url,
  qrImageSrc,
}) => {
  return (
    <View style={styles.box} wrap={false}>
      <Text style={styles.title}>Paiement en ligne</Text>
      <Text style={styles.text}>
        Cette cotisation peut être réglée directement en ligne de manière sécurisée.
      </Text>
      <View style={styles.row}>
        {qrImageSrc ? <Image src={qrImageSrc} style={styles.qr} /> : null}
        <View>
          <Link src={url} style={styles.cta}>
            Payer ma cotisation
          </Link>
          <Text style={styles.hint}>
            Scannez le QR code ou ouvrez le lien pour payer votre cotisation.
          </Text>
        </View>
      </View>
    </View>
  );
};
