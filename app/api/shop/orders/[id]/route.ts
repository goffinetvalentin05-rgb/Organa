import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import {
  mapOrder,
  NEXT_FULFILLMENT,
  ORDER_ITEM_SELECT,
  ORDER_SELECT,
  type ItemRow,
  type OrderRow,
} from "@/lib/shop/orders";
import type { OrderFulfillmentStatus } from "@/lib/shop/types";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SHOP);
    if ("error" in guard) return guard.error;
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shop_orders")
      .select(ORDER_SELECT)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    const { data: items } = await supabase
      .from("shop_order_items")
      .select(ORDER_ITEM_SELECT)
      .eq("order_id", id)
      .eq("club_id", guard.clubId);
    return NextResponse.json({
      order: mapOrder(data as OrderRow, (items || []) as ItemRow[]),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SHOP);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const action = body && typeof body === "object" ? (body as { action?: string }).action : null;

    const supabase = await createClient();
    const { data: current } = await supabase
      .from("shop_orders")
      .select("id, payment_status, fulfillment_status")
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .maybeSingle();
    if (!current) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    if (current.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Le statut logistique ne peut être modifié que sur une commande payée." },
        { status: 400 }
      );
    }

    const currentFulfillment = current.fulfillment_status as OrderFulfillmentStatus;
    let next: OrderFulfillmentStatus | undefined;

    if (action === "advance") {
      next = NEXT_FULFILLMENT[currentFulfillment];
    } else if (action === "set" && body && typeof body === "object") {
      const wanted = (body as { fulfillmentStatus?: string }).fulfillmentStatus;
      if (wanted === "to_prepare" || wanted === "ready" || wanted === "handed_over") {
        const allowed =
          (currentFulfillment === "to_prepare" && wanted === "ready") ||
          (currentFulfillment === "ready" && wanted === "handed_over") ||
          wanted === currentFulfillment;
        if (!allowed) {
          return NextResponse.json({ error: "Transition de statut non autorisée." }, { status: 400 });
        }
        next = wanted;
      }
    }

    if (!next) {
      return NextResponse.json({ error: "Aucune transition possible." }, { status: 400 });
    }

    const { error } = await supabase
      .from("shop_orders")
      .update({ fulfillment_status: next })
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .eq("payment_status", "paid");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = await supabase
      .from("shop_orders")
      .select(ORDER_SELECT)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .single();
    const { data: items } = await supabase
      .from("shop_order_items")
      .select(ORDER_ITEM_SELECT)
      .eq("order_id", id);

    return NextResponse.json({
      order: mapOrder(data as OrderRow, (items || []) as ItemRow[]),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
