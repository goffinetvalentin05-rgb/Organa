import { createAdminClient } from "@/lib/supabase/admin";
import { getAccountingAccess } from "@/lib/accounting/service";
import { isBankSystemCode } from "@/lib/accounting/financialAccounts";
import { todayZurichDate } from "./status";

export type SettlementAccount = { id: string; number: string; name: string };

export async function loadSupportSaleSettlement(clubId: string): Promise<{
  accounting: boolean;
  today: string;
  categories: SettlementAccount[];
  accounts: SettlementAccount[];
}> {
  const today = todayZurichDate();
  const access = await getAccountingAccess(clubId);
  if (!access.onboarded) {
    return { accounting: false, today, categories: [], accounts: [] };
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("accounting_accounts")
    .select("id, number, name, account_type, system_code, is_active")
    .eq("club_id", clubId)
    .eq("is_active", true)
    .order("number");
  if (error) throw new Error(error.message);
  const rows = data || [];
  const map = (row: { id: string; number: string; name: string }): SettlementAccount => ({
    id: row.id,
    number: row.number,
    name: row.name,
  });
  return {
    accounting: true,
    today,
    categories: rows.filter((row) => row.account_type === "revenue").map(map),
    accounts: rows
      .filter((row) => isBankSystemCode(row.system_code) || row.system_code === "cash" || row.system_code === "stripe")
      .map(map),
  };
}
