import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import {
  deriveContractStatus,
  getContractRenewalInfo,
  getContractsToRenew,
} from "@/lib/sponsor-contracts";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_INVOICES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const { data: rows, error } = await supabase
      .from("sponsor_contracts")
      .select(
        "id, club_id, sponsor_name, title, content, amount, start_date, end_date, status, sponsor_type, created_by, created_at, updated_at"
      )
      .eq("club_id", guard.clubId);

    if (error) {
      console.error("[API][sponsor-contracts/renewals][GET]", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement", details: error.message },
        { status: 500 }
      );
    }

    const list = rows || [];
    const toWatch = getContractsToRenew(list, { horizonDays: 30 });

    const items = toWatch
      .map((row) => {
        const endDate = String(row.end_date ?? "");
        const info = getContractRenewalInfo(endDate);
        const status = deriveContractStatus(
          String(row.start_date ?? ""),
          endDate
        );
        return {
          id: row.id as string,
          sponsorName: row.sponsor_name as string,
          title: row.title as string,
          endDate,
          status,
          daysUntilEnd: info?.daysUntilEnd ?? null,
          isExpired: info?.isExpired ?? false,
        };
      })
      .sort((a, b) => a.endDate.localeCompare(b.endDate));

    const expiredCount = items.filter((i) => i.isExpired).length;
    const expiringSoonCount = items.filter((i) => !i.isExpired).length;

    return NextResponse.json(
      { items, expiredCount, expiringSoonCount, totalWatch: items.length },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[API][sponsor-contracts/renewals][GET]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
