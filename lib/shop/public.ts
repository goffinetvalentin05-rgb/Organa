import { createAdminClient } from "@/lib/supabase/admin";
import { OBILLZ_BRAND_PRIMARY, normalizeHexColor } from "@/lib/public-page/colors";
import { isPaymentReady } from "./payment-provider";
import { mapPaymentAccount } from "./stripe-connect";
import type { PublicShopCatalog } from "./types";

export async function resolvePublicShop(
  slug: string
): Promise<{ clubId: string; catalog: PublicShopCatalog } | null> {
  const supabase = createAdminClient();
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const { data: settings } = await supabase
    .from("shop_settings")
    .select(
      "club_id, slug, is_enabled, display_name, intro_text, pickup_info, currency"
    )
    .eq("slug", normalized)
    .maybeSingle();

  if (!settings) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, logo_url, primary_color")
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

  return {
    clubId: settings.club_id,
    catalog: {
      slug: settings.slug,
      clubName: settings.display_name?.trim() || profile?.company_name?.trim() || "Club",
      logoUrl: profile?.logo_url || null,
      primaryColor: normalizeHexColor(profile?.primary_color, OBILLZ_BRAND_PRIMARY),
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
    },
  };
}
