import { createAdminClient } from "@/lib/supabase/admin";
import { OBILLZ_BRAND_PRIMARY, normalizeHexColor } from "@/lib/public-page/colors";
import { isPaymentReady } from "./payment-provider";
import { mapPaymentAccount } from "./stripe-connect";
import { buildPublicShopTheme, SHOP_SETTINGS_SELECT_BRANDING, SHOP_SETTINGS_SELECT_CORE } from "./page-settings";
import type { PublicShopCatalog } from "./types";

export async function resolvePublicShop(
  slug: string
): Promise<{ clubId: string; catalog: PublicShopCatalog } | null> {
  const supabase = createAdminClient();
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  let settingsQuery = await supabase
    .from("shop_settings")
    .select(SHOP_SETTINGS_SELECT_BRANDING)
    .eq("slug", normalized)
    .maybeSingle();

  if (settingsQuery.error) {
    settingsQuery = await supabase
      .from("shop_settings")
      .select(`${SHOP_SETTINGS_SELECT_CORE}`)
      .eq("slug", normalized)
      .maybeSingle();
  }

  const settings = settingsQuery.data as {
    club_id: string;
    slug: string;
    is_enabled: boolean;
    display_name: string | null;
    intro_text: string | null;
    pickup_info: string | null;
    currency: string;
    public_label?: string | null;
    public_title?: string | null;
    public_subtitle?: string | null;
    public_primary_color?: string | null;
    public_secondary_color?: string | null;
    public_accent_color?: string | null;
    public_page_style?: string | null;
    public_banner_url?: string | null;
    public_image_position?: string | null;
    public_overlay_intensity?: string | null;
  } | null;
  if (!settings) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, logo_url, primary_color, public_page_primary_color")
    .eq("user_id", settings.club_id)
    .maybeSingle();

  const { data: accountRow } = await supabase
    .from("club_payment_accounts")
    .select(
      "id, club_id, provider, provider_account_id, status, charges_enabled, payouts_enabled, details_submitted, display_name, account_email, livemode"
    )
    .eq("club_id", settings.club_id)
    .eq("provider", "stripe")
    .maybeSingle();

  const account = accountRow ? mapPaymentAccount(accountRow) : null;
  const paymentsReady = isPaymentReady(account);
  const isEnabled = Boolean(settings.is_enabled);
  const canCheckout = isEnabled && paymentsReady;
  const clubName = settings.display_name?.trim() || profile?.company_name?.trim() || "Club";
  const fallbackPrimary = normalizeHexColor(
    profile?.public_page_primary_color || profile?.primary_color,
    OBILLZ_BRAND_PRIMARY
  );

  const theme = buildPublicShopTheme({
    clubName,
    label: settings.public_label ?? null,
    title: settings.public_title ?? null,
    subtitle: settings.public_subtitle ?? null,
    introText: settings.intro_text?.trim() || null,
    primaryColor: settings.public_primary_color || fallbackPrimary,
    secondaryColor: settings.public_secondary_color ?? null,
    accentColor: settings.public_accent_color ?? null,
    pageStyle: settings.public_page_style ?? null,
    imagePosition: settings.public_image_position ?? null,
    overlayIntensity: settings.public_overlay_intensity ?? null,
    bannerUrl: settings.public_banner_url ?? null,
  });

  return {
    clubId: settings.club_id,
    catalog: {
      slug: settings.slug,
      clubName,
      logoUrl: profile?.logo_url || null,
      primaryColor: theme.primaryColor,
      introText: settings.intro_text?.trim() || null,
      pickupInfo: settings.pickup_info?.trim() || null,
      isEnabled,
      canCheckout,
      checkoutBlockedReason: !isEnabled
        ? "La boutique n’est pas encore ouverte."
        : !paymentsReady
          ? "Les paiements ne sont pas encore configurés."
          : null,
      currency: "CHF",
      theme,
    },
  };
}
