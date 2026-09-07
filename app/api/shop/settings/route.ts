import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { getOrCreateShopSettings, mapSettingsRow, updateShopSettings } from "@/lib/shop/settings";
import { getClubStripeAccount, snapshotFromAccount } from "@/lib/shop/stripe-connect";
import { suggestShopSlug } from "@/lib/shop/slug";

export const runtime = "nodejs";

const err = (e: unknown) => (e instanceof Error ? e.message : "Erreur serveur");

async function clubProfile(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("company_name, company_email, public_page_slug, buvette_slug")
    .eq("user_id", clubId)
    .maybeSingle();
  return data;
}

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SHOP);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const profile = await clubProfile(guard.clubId);
    const clubName = profile?.company_name?.trim() || "Club";
    const defaultSlug = profile?.public_page_slug || profile?.buvette_slug || suggestShopSlug(clubName, guard.clubId);

    const row = await getOrCreateShopSettings(supabase, guard.clubId, {
      displayName: clubName,
      ordersEmail: profile?.company_email || undefined,
      slug: defaultSlug,
    });
    const account = await getClubStripeAccount(supabase, guard.clubId);
    return NextResponse.json({
      settings: mapSettingsRow(row, clubName, snapshotFromAccount(account)),
      suggestedSlug: defaultSlug,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SHOP);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;

    const body = await request.json().catch(() => null);
    const supabase = await createClient();
    const profile = await clubProfile(guard.clubId);
    const clubName = profile?.company_name?.trim() || "Club";
    await getOrCreateShopSettings(supabase, guard.clubId, { displayName: clubName });
    const account = await getClubStripeAccount(supabase, guard.clubId);
    const result = await updateShopSettings(supabase, guard.clubId, body || {}, snapshotFromAccount(account));
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }
    return NextResponse.json({
      settings: mapSettingsRow(result.settings || null, clubName, snapshotFromAccount(account)),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}
