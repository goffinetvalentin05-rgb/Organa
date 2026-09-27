import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadSaleRelations, mapSalesWithRelations } from "./service";
import { SUPPORT_SALE_SELECT, type SupportSale, type SupportSaleRow } from "./types";

export type SupportSaleSplit = { accountId: string; amount: number };

export type CompleteSupportSaleResult =
  | { ok: true; sale: SupportSale; revenueId: string | null; amount: number }
  | { ok: false; error: string; status: 400 | 404 | 500 };

export async function completeSupportSale(params: {
  clubId: string;
  userId: string;
  saleId: string;
  receivedOn: string;
  amount: number;
  categoryAccountId?: string | null;
  splits?: SupportSaleSplit[];
}): Promise<CompleteSupportSaleResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.receivedOn)) {
    return { ok: false, error: "Date de réception invalide", status: 400 };
  }
  if (!Number.isFinite(params.amount) || params.amount < 0) {
    return { ok: false, error: "Montant confirmé invalide", status: 400 };
  }

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
  const revenueName = `Vente de soutien — ${sale.name}`;
  const description = `${sale.stats.reservationsCount} réservations · ${sale.stats.quantitySold} produits`;
  const splits = (params.splits || [])
    .filter((split) => split.accountId && split.amount > 0)
    .map((split) => ({ account_id: split.accountId, amount: split.amount }));

  const { data, error } = await admin.rpc("accounting_finish_support_sale", {
    p_club: params.clubId,
    p_sale: params.saleId,
    p_user: params.userId,
    p_received_on: params.receivedOn,
    p_amount: params.amount,
    p_category: params.categoryAccountId || null,
    p_name: revenueName,
    p_description: description,
    p_splits: splits,
  });

  if (error) {
    const message = error.message || "";
    if (/accounting_finish_support_sale|schema cache|Could not find the function/i.test(message)) {
      return {
        ok: false,
        error: "La finalisation comptable n'est pas disponible. Appliquez la migration 102 dans Supabase, puis réessayez.",
        status: 500,
      };
    }
    const line = message.split("\n")[0] || "La vente n'a pas pu être terminée.";
    return { ok: false, error: line, status: line.includes("introuvable") ? 404 : 400 };
  }

  const payload = (data ?? {}) as { revenue_id?: string | null };
  const { data: updated, error: updateError } = await admin
    .from("support_sales")
    .select(SUPPORT_SALE_SELECT)
    .eq("id", saleRow.id)
    .eq("club_id", params.clubId)
    .is("deleted_at", null)
    .single();

  if (updateError || !updated) {
    return {
      ok: false,
      error: updateError?.message || "La vente n'a pas pu être terminée.",
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
    revenueId: payload.revenue_id || updated.club_revenue_id || null,
    amount: params.amount,
  };
}
