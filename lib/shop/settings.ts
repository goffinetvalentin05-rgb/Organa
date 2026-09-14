import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseImagePosition,
  parseOverlayIntensity,
  parsePageStyle,
  trimOrNull,
  validateHexColor,
} from "@/lib/public-branding/parse";
import type { ShopSettings } from "./types";
import { isPaymentReady, type PaymentAccountSnapshot } from "./payment-provider";
import { getShopPublicUrlPath, isValidShopSlug, normalizeShopSlug } from "./slug";
import {
  brandingUpdatesFromPatch,
  selectShopSettingsRow,
  SHOP_SETTINGS_SELECT_BRANDING,
  SHOP_SETTINGS_SELECT_CORE,
  validateAppearancePatch,
  type ShopAppearanceUpdate,
  type ShopSettingsBrandingRow,
} from "./page-settings";

type SettingsRow = ShopSettingsBrandingRow;

export function mapSettingsRow(
  row: SettingsRow | null,
  clubName: string,
  payment: PaymentAccountSnapshot | null
): ShopSettings | null {
  if (!row) return null;
  const ready = isPaymentReady(payment);
  return {
    clubId: row.club_id,
    slug: row.slug,
    isEnabled: row.is_enabled,
    displayName: row.display_name?.trim() || clubName,
    introText: row.intro_text?.trim() || "",
    pickupInfo: row.pickup_info?.trim() || "",
    ordersEmail: row.orders_email?.trim() || "",
    trackStockDefault: row.track_stock_default,
    currency: "CHF",
    publicUrlPath: row.slug ? getShopPublicUrlPath(row.slug) : null,
    canEnablePublicSales: ready,
    label: trimOrNull(row.public_label),
    title: trimOrNull(row.public_title),
    subtitle: trimOrNull(row.public_subtitle),
    publicPrimaryColor: validateHexColor(row.public_primary_color),
    publicSecondaryColor: validateHexColor(row.public_secondary_color),
    publicAccentColor: validateHexColor(row.public_accent_color),
    pageStyle: parsePageStyle(row.public_page_style),
    bannerUrl: trimOrNull(row.public_banner_url),
    imagePosition: parseImagePosition(row.public_image_position),
    overlayIntensity: parseOverlayIntensity(row.public_overlay_intensity),
  };
}

export async function getOrCreateShopSettings(
  supabase: SupabaseClient,
  clubId: string,
  defaults: { displayName: string; ordersEmail?: string; slug?: string | null }
) {
  const existing = await selectShopSettingsRow(supabase, clubId);
  if (existing) return existing;

  const insert = {
    club_id: clubId,
    display_name: defaults.displayName,
    orders_email: defaults.ordersEmail || null,
    slug: defaults.slug || null,
    pickup_info:
      "Votre commande pourra être récupérée au club. Les horaires vous seront indiqués par e-mail.",
  };

  const { data: created, error: insertError } = await supabase
    .from("shop_settings")
    .insert(insert)
    .select(SHOP_SETTINGS_SELECT_CORE)
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const retry = await supabase
        .from("shop_settings")
        .insert({ ...insert, slug: null })
        .select(SHOP_SETTINGS_SELECT_CORE)
        .single();
      if (retry.error) throw retry.error;
      return retry.data as SettingsRow;
    }
    throw insertError;
  }
  return created as SettingsRow;
}

export async function updateShopSettings(
  supabase: SupabaseClient,
  clubId: string,
  patch: {
    slug?: unknown;
    isEnabled?: unknown;
    displayName?: unknown;
    introText?: unknown;
    pickupInfo?: unknown;
    ordersEmail?: unknown;
    trackStockDefault?: unknown;
    label?: unknown;
    title?: unknown;
    subtitle?: unknown;
    primaryColor?: unknown;
    secondaryColor?: unknown;
    accentColor?: unknown;
    pageStyle?: unknown;
    imagePosition?: unknown;
    overlayIntensity?: unknown;
  },
  payment: PaymentAccountSnapshot | null
): Promise<{ settings?: SettingsRow; error?: string; status?: number }> {
  const updates: Record<string, unknown> = {};

  if (patch.slug !== undefined) {
    const raw = typeof patch.slug === "string" ? patch.slug.trim() : "";
    if (!raw) {
      updates.slug = null;
    } else {
      const slug = normalizeShopSlug(raw);
      if (!isValidShopSlug(slug)) {
        return { error: "Slug invalide (lettres, chiffres et tirets).", status: 400 };
      }
      const { data: clash } = await supabase
        .from("shop_settings")
        .select("club_id")
        .eq("slug", slug)
        .neq("club_id", clubId)
        .maybeSingle();
      if (clash) {
        return { error: "Ce slug est déjà utilisé par un autre club.", status: 409 };
      }
      updates.slug = slug;
    }
  }

  if (patch.displayName !== undefined) {
    updates.display_name =
      typeof patch.displayName === "string" ? patch.displayName.trim().slice(0, 120) : null;
  }
  if (patch.introText !== undefined) {
    updates.intro_text =
      typeof patch.introText === "string" ? patch.introText.trim().slice(0, 2000) : null;
  }
  if (patch.pickupInfo !== undefined) {
    updates.pickup_info =
      typeof patch.pickupInfo === "string" ? patch.pickupInfo.trim().slice(0, 2000) : null;
  }
  if (patch.ordersEmail !== undefined) {
    const email = typeof patch.ordersEmail === "string" ? patch.ordersEmail.trim() : "";
    updates.orders_email = email || null;
  }
  if (patch.trackStockDefault !== undefined) {
    updates.track_stock_default = patch.trackStockDefault === true;
  }
  if (patch.isEnabled !== undefined) {
    const wantEnabled = patch.isEnabled === true;
    if (wantEnabled && !isPaymentReady(payment)) {
      return {
        error:
          "Terminez la configuration des paiements avant d’activer les ventes publiques.",
        status: 400,
      };
    }
    updates.is_enabled = wantEnabled;
  }

  const appearancePatch: ShopAppearanceUpdate = {};
  if (patch.label !== undefined) appearancePatch.label = typeof patch.label === "string" ? patch.label : null;
  if (patch.title !== undefined) appearancePatch.title = typeof patch.title === "string" ? patch.title : null;
  if (patch.subtitle !== undefined) {
    appearancePatch.subtitle = typeof patch.subtitle === "string" ? patch.subtitle : null;
  }
  if (patch.primaryColor !== undefined) {
    appearancePatch.primaryColor = typeof patch.primaryColor === "string" ? patch.primaryColor : null;
  }
  if (patch.secondaryColor !== undefined) {
    appearancePatch.secondaryColor = typeof patch.secondaryColor === "string" ? patch.secondaryColor : null;
  }
  if (patch.accentColor !== undefined) {
    appearancePatch.accentColor = typeof patch.accentColor === "string" ? patch.accentColor : null;
  }
  if (patch.pageStyle !== undefined) {
    appearancePatch.pageStyle = parsePageStyle(typeof patch.pageStyle === "string" ? patch.pageStyle : null);
  }
  if (patch.imagePosition !== undefined) {
    appearancePatch.imagePosition = parseImagePosition(
      typeof patch.imagePosition === "string" ? patch.imagePosition : null
    );
  }
  if (patch.overlayIntensity !== undefined) {
    appearancePatch.overlayIntensity = parseOverlayIntensity(
      typeof patch.overlayIntensity === "string" ? patch.overlayIntensity : null
    );
  }

  const appearanceError = validateAppearancePatch(appearancePatch);
  if (appearanceError) return { error: appearanceError, status: 400 };
  Object.assign(updates, brandingUpdatesFromPatch(appearancePatch));

  if (Object.keys(updates).length === 0) {
    const data = await selectShopSettingsRow(supabase, clubId);
    return { settings: data ?? undefined };
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("shop_settings")
    .update(updates)
    .eq("club_id", clubId)
    .select(SHOP_SETTINGS_SELECT_BRANDING)
    .single();

  if (error) {
    const brandingAttempt = Object.keys(updates).some((key) => key.startsWith("public_"));
    if (brandingAttempt) {
      return {
        error:
          "Les colonnes de personnalisation boutique sont absentes. Appliquez la migration 082_shop_public_page_settings.sql.",
        status: 500,
      };
    }
    return { error: error.message, status: 500 };
  }
  return { settings: data as SettingsRow };
}

export type { SettingsRow };
