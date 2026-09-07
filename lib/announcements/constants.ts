/** Clé persistée dans `feature_announcements_seen` (suffixe _seen implicite via la table). */
export const NEW_FEATURES_2026_06_KEY = "obillz_new_features_2026_06";

export const NEW_FEATURES_NOTIFICATION_ID = "obillz_new_features_2026_06";

/** Date affichée dans la cloche de notification. */
export const NEW_FEATURES_ANNOUNCEMENT_DATE = "16 juin 2026";

export const RELEASE_ONLINE_PAYMENTS_2026_09 = "release_online_payments_2026_09";
export const RELEASE_SHOP_2026_09 = "release_shop_2026_09";
export const RELEASE_VISUALS_2026_09 = "release_visuals_2026_09";
export const RELEASE_BUNDLE_TOAST_2026_09 = "release_bundle_toast_2026_09";

export type ProductNotificationIcon =
  | "credit-card"
  | "shopping-bag"
  | "sparkles"
  | "users";

export type ProductNotificationDef = {
  id: string;
  href: string;
  icon: ProductNotificationIcon;
  titleKey: string;
  messageKey: string;
  ctaKey: string;
  dateKey: string;
};

/** Nouveautés produit — plus récentes d’abord. */
export const PRODUCT_NOTIFICATION_DEFS: ProductNotificationDef[] = [
  {
    id: RELEASE_ONLINE_PAYMENTS_2026_09,
    href: "/tableau-de-bord/compte-de-paiement",
    icon: "credit-card",
    titleKey: "dashboard.notifications.onlinePayments.title",
    messageKey: "dashboard.notifications.onlinePayments.message",
    ctaKey: "dashboard.notifications.onlinePayments.cta",
    dateKey: "dashboard.notifications.onlinePayments.date",
  },
  {
    id: RELEASE_SHOP_2026_09,
    href: "/tableau-de-bord/boutique",
    icon: "shopping-bag",
    titleKey: "dashboard.notifications.shop.title",
    messageKey: "dashboard.notifications.shop.message",
    ctaKey: "dashboard.notifications.shop.cta",
    dateKey: "dashboard.notifications.shop.date",
  },
  {
    id: RELEASE_VISUALS_2026_09,
    href: "/tableau-de-bord/visuels",
    icon: "sparkles",
    titleKey: "dashboard.notifications.visuals.title",
    messageKey: "dashboard.notifications.visuals.message",
    ctaKey: "dashboard.notifications.visuals.cta",
    dateKey: "dashboard.notifications.visuals.date",
  },
];

export const LEGACY_FEATURES_NOTIFICATION_DEF: ProductNotificationDef = {
  id: NEW_FEATURES_NOTIFICATION_ID,
  href: "/tableau-de-bord/clients",
  icon: "users",
  titleKey: "dashboard.notifications.legacyFeatures.title",
  messageKey: "dashboard.notifications.legacyFeatures.message",
  ctaKey: "dashboard.notifications.legacyFeatures.cta",
  dateKey: "dashboard.notifications.legacyFeatures.date",
};

export const BELL_NOTIFICATION_DEFS: ProductNotificationDef[] = [
  ...PRODUCT_NOTIFICATION_DEFS,
  LEGACY_FEATURES_NOTIFICATION_DEF,
];

export const FEATURE_ANNOUNCEMENT_TRACKING_KEYS = [
  ...BELL_NOTIFICATION_DEFS.map((def) => def.id),
  RELEASE_BUNDLE_TOAST_2026_09,
] as const;
