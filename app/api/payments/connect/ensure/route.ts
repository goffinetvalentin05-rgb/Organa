import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClubPaymentsAccess } from "@/lib/payments/connect/guard";
import { ensureClubConnectedAccount } from "@/lib/payments/connect/accounts";
import { getClubConnectStatus } from "@/lib/payments/connect/status";

export const runtime = "nodejs";

export async function POST() {
  try {
    const guard = await requireClubPaymentsAccess("manage");
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    await ensureClubConnectedAccount({
      supabase,
      clubId: guard.clubId,
    });
    const status = await getClubConnectStatus(supabase, guard.clubId);
    return NextResponse.json(status);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[PAYMENTS][connect] ensure", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
