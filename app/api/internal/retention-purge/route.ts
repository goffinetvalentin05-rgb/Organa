import { NextResponse } from "next/server";
import { isAuthorizedRetentionPurge } from "@/lib/retention/authorize";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  if (!process.env.CRON_SECRET) {
    console.error("[retention-purge] CRON_SECRET manquant");
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!isAuthorizedRetentionPurge(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("purge_operational_data");
    if (error) {
      console.error("[retention-purge] RPC:", error.message);
      return NextResponse.json({ error: "Échec de la purge" }, { status: 500 });
    }
    console.info("[retention-purge]", data);
    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    console.error("[retention-purge]", err);
    return NextResponse.json({ error: "Échec de la purge" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
