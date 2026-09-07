import type { AppearanceOptions } from "@stripe/connect-js";

/** Apparence officielle Connect, calquée sur le dashboard clair Obillz. */
export function getConnectAppearance(): AppearanceOptions {
  return {
    overlays: "dialog",
    variables: {
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSizeBase: "16px",
      spacingUnit: "10px",
      borderRadius: "12px",
      colorPrimary: "#1A23FF",
      colorBackground: "#FFFFFF",
      colorText: "#0F172A",
      colorDanger: "#E11D48",
      colorBorder: "rgba(15, 23, 42, 0.12)",
      buttonPrimaryColorBackground: "#1A23FF",
      buttonPrimaryColorBorder: "#1A23FF",
      buttonPrimaryColorText: "#FFFFFF",
      buttonSecondaryColorBackground: "#F8FAFC",
      buttonSecondaryColorBorder: "rgba(15, 23, 42, 0.12)",
      buttonSecondaryColorText: "#0F172A",
      buttonBorderRadius: "24px",
      formBorderRadius: "12px",
      badgeBorderRadius: "999px",
      overlayBorderRadius: "16px",
      formBackgroundColor: "#F8FAFC",
      offsetBackgroundColor: "#F4F7FB",
      badgeSuccessColorBackground: "#ECFDF5",
      badgeSuccessColorText: "#047857",
      badgeSuccessColorBorder: "#A7F3D0",
      badgeWarningColorBackground: "#FFFBEB",
      badgeWarningColorText: "#B45309",
      badgeWarningColorBorder: "#FDE68A",
      badgeDangerColorBackground: "#FFF1F2",
      badgeDangerColorText: "#BE123C",
      badgeDangerColorBorder: "#FECDD3",
    },
  };
}

export function mapConnectLocale(locale: string): string {
  if (locale === "de") return "de";
  if (locale === "en") return "en-GB";
  return "fr";
}

export const CONNECT_COLLECTION_OPTIONS = {
  fields: "eventually_due" as const,
  futureRequirements: "include" as const,
};

export const CONNECT_FONTS = [
  {
    cssSrc:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
];
