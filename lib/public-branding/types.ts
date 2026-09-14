export const PUBLIC_PAGE_STYLES = ["colors", "banner", "fullscreen"] as const;
export type PublicPageStyle = (typeof PUBLIC_PAGE_STYLES)[number];

export const PUBLIC_IMAGE_POSITIONS = ["top", "center", "bottom"] as const;
export type PublicImagePosition = (typeof PUBLIC_IMAGE_POSITIONS)[number];

export const PUBLIC_OVERLAY_INTENSITIES = ["light", "normal", "dark"] as const;
export type PublicOverlayIntensity = (typeof PUBLIC_OVERLAY_INTENSITIES)[number];

export type PublicVisualTheme = {
  label: string;
  title: string;
  subtitle: string;
  introText: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pageStyle: PublicPageStyle;
  imagePosition: PublicImagePosition;
  overlayIntensity: PublicOverlayIntensity;
  bannerUrl: string | null;
};
