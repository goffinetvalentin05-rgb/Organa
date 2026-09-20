import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { centsToChf } from "@/lib/shop/money";
import { loadSaleRelations, mapSalesWithRelations } from "./service";
import { todayZurichDate } from "./status";
import { SUPPORT_SALE_SELECT, type SupportSale, type SupportSaleRow } from "./types";

const SOURCE_TYPE = "support_sale";

export type CompleteSupportSaleResult =
  | { ok: true; sale: SupportSale; revenueId: string; amount: number }
  | { ok: false; error: string; status: 404 | 500 };

export async function completeSupportSale(params: {
  clubId: string;
  userId: string;
  saleId: string;
}): Promise<CompleteSupportSaleResult> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("support_sales")
    .select(SUPPORT_SALE_SELECT)
    .eq("id", params.saleId)
    .eq("club_id", params.clubId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!row) {
    return { ok: false, error: "Vente introuvable", status: 404 };
  }

  const saleRow = row as SupportSaleRow;
  const relations = await loadSaleRelations(admin, params.clubId, [saleRow.id]);
  const sale = mapSalesWithRelations([saleRow], relations)[0];
  const amount = centsToChf(sale.stats.revenueCents);
  const revenueName = `Vente de soutien — ${sale.name}`;
  const description = `${sale.stats.reservationsCount} réservations · ${sale.stats.quantitySold} produits`;

  let revenueId = saleRow.club_revenue_id || null;

  if (!revenueId) {
    const { data: existing } = await admin
      .from("club_revenues")
      .select("id")
      .eq("user_id", params.clubId)
      .eq("source_type", SOURCE_TYPE)
      .eq("source_id", saleRow.id)
      .is("deleted_at", null)
      .maybeSingle();
    revenueId = existing?.id || null;
  }

  if (!revenueId) {
    const { data: inserted, error } = await admin
      .from("club_revenues")
      .insert({
        user_id: params.clubId,
        name: revenueName,
        amount,
        revenue_date: todayZurichDate(),
        description,
        source_type: SOURCE_TYPE,
        source_id: saleRow.id,
        created_by: params.userId,
        updated_by: params.userId,
      })
      .select("id")
      .single();

    if (error && error.code === "23505") {
      const { data: raced } = await admin
        .from("club_revenues")
        .select("id")
        .eq("user_id", params.clubId)
        .eq("source_type", SOURCE_TYPE)
        .eq("source_id", saleRow.id)
        .is("deleted_at", null)
        .maybeSingle();
      revenueId = raced?.id || null;
    } else if (error || !inserted) {
      return {
        ok: false,
        error: error?.message || "Impossible d’enregistrer l’encaissement.",
        status: 500,
      };
    } else {
      revenueId = inserted.id;
    }
  }

  if (!revenueId) {
    return { ok: false, error: "Impossible d’enregistrer l’encaissement.", status: 500 };
  }

  const { data: updated, error: updateError } = await admin
    .from("support_sales")
    .update({
      status: "ended",
      club_revenue_id: revenueId,
      updated_by: params.userId,
    })
    .eq("id", saleRow.id)
    .eq("club_id", params.clubId)
    .is("deleted_at", null)
    .select(SUPPORT_SALE_SELECT)
    .single();

  if (updateError || !updated) {
    return {
      ok: false,
      error: updateError?.message || "La vente n’a pas pu être terminée.",
      status: 500,
    };
  }

  revalidatePath("/tableau-de-bord/produits");
  revalidatePath("/tableau-de-bord/paiements");
  revalidatePath("/tableau-de-bord/ventes-soutien");
  revalidatePath(`/tableau-de-bord/ventes-soutien/${saleRow.id}`);

  const ended = mapSalesWithRelations([updated as SupportSaleRow], relations)[0];
  ended.status = "ended";
  return {
    ok: true,
    sale: ended,
    revenueId,
    amount,
  };
}
