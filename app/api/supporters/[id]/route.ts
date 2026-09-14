import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { mapSupporter } from "@/lib/supporters/map";
import { SUPPORTER_SELECT, type SupporterRow } from "@/lib/supporters/types";
import { appBaseUrl } from "@/lib/payments/connect/stripe-client";

export const runtime = "nodejs";

const err = (e: unknown) => (e instanceof Error ? e.message : "Erreur serveur");

async function loadOne(clubId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supporters")
    .select(`${SUPPORTER_SELECT}, offer:supporter_offers(name)`)
    .eq("id", id)
    .eq("club_id", clubId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as SupporterRow & {
    offer: { name: string } | { name: string }[] | null;
  };
  const offer = Array.isArray(row.offer) ? row.offer[0] : row.offer;
  return mapSupporter(row, offer?.name || null);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORTERS);
    if ("error" in guard) return guard.error;
    const { id } = await params;
    const supporter = await loadOne(guard.clubId, id);
    if (!supporter) {
      return NextResponse.json({ error: "Supporter introuvable" }, { status: 404 });
    }
    return NextResponse.json({
      supporter,
      cardUrl: supporter.cardToken
        ? `${appBaseUrl()}/supporter/card/${supporter.cardToken}`
        : null,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORTERS);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }
    const o = body as Record<string, unknown>;

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("supporters")
      .select("id, status")
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Supporter introuvable" }, { status: 404 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof o.publicNameEnabled === "boolean") {
      patch.public_name_enabled = o.publicNameEnabled;
    }
    if (o.action === "disable") {
      if (existing.status === "pending") {
        patch.status = "cancelled";
      } else if (existing.status === "active") {
        patch.status = "cancelled";
      }
    }
    if (o.action === "enable") {
      if (existing.status === "cancelled") {
        patch.status = "active";
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Aucune modification." }, { status: 400 });
    }

    const { error } = await supabase
      .from("supporters")
      .update(patch)
      .eq("id", id)
      .eq("club_id", guard.clubId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const supporter = await loadOne(guard.clubId, id);
    return NextResponse.json({
      supporter,
      cardUrl: supporter?.cardToken
        ? `${appBaseUrl()}/supporter/card/${supporter.cardToken}`
        : null,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}
