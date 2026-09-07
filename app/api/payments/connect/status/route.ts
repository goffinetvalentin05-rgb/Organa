import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClubPaymentsAccess } from "@/lib/payments/connect/guard";
import { getClubConnectStatus } from "@/lib/payments/connect/status";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guard = await requireClubPaymentsAccess("view");
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const status = await getClubConnectStatus(supabase, guard.clubId);
    return NextResponse.json(status);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
