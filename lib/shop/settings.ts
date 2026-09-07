import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShopSettings } from "./types";
import { isPaymentReady, type PaymentAccountSnapshot } from "./payment-provider";
import { getShopPublicUrlPath, isValidShopSlug, normalizeShopSlug } from "./slug";

type SettingsRow = {
  club_id: string;
  slug: string | null;
  is_enabled: boolean;
  display_name: string | null;
  intro_text: string | null;
  pickup_info: string | null;
  orders_email: string | null;
  track_stock_default: boolean;
  currency: string;
};

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
  };
}

export async function getOrCreateShopSettings(
  supabase: SupabaseClient,
  clubId: string,
  defaults: { displayName: string; ordersEmail?: string; slug?: string | null }
) {
  const { data: existing, error } = await supabase
    .from("shop_settings")
    .select(
      "club_id, slug, is_enabled, display_name, intro_text, pickup_info, orders_email, track_stock_default, currency"
    )
    .eq("club_id", clubId)
    .maybeSingle();

  if (error) throw error;
  if (existing) return existing as SettingsRow;

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
    .select(
      "club_id, slug, is_enabled, display_name, intro_text, pickup_info, orders_email, track_stock_default, currency"
    )
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const retry = await supabase
        .from("shop_settings")
        .insert({ ...insert, slug: null })
        .select(
          "club_id, slug, is_enabled, display_name, intro_text, pickup_info, orders_email, track_stock_default, currency"
        )
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

  if (Object.keys(updates).length === 0) {
    const { data } = await supabase
      .from("shop_settings")
      .select(
        "club_id, slug, is_enabled, display_name, intro_text, pickup_info, orders_email, track_stock_default, currency"
      )
      .eq("club_id", clubId)
      .maybeSingle();
    return { settings: data as SettingsRow };
  }

  const { data, error } = await supabase
    .from("shop_settings")
    .update(updates)
    .eq("club_id", clubId)
    .select(
      "club_id, slug, is_enabled, display_name, intro_text, pickup_info, orders_email, track_stock_default, currency"
    )
    .single();

  if (error) return { error: error.message, status: 500 };
  return { settings: data as SettingsRow };
}
