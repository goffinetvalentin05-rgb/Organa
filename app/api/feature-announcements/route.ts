import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/rbac";
import { CLUB_PUBLIC_PAGE_ANNOUNCEMENT_KEY } from "@/lib/public-page/constants";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const key =
      request.nextUrl.searchParams.get("key")?.trim() || CLUB_PUBLIC_PAGE_ANNOUNCEMENT_KEY;

    const ctx = await getAuthContext();
    const clubId = ctx?.current?.clubId;
    if (!clubId) {
      return NextResponse.json({ seen: true });
    }

    const { data } = await supabase
      .from("feature_announcements_seen")
      .select("id")
      .eq("user_id", user.id)
      .eq("club_id", clubId)
      .eq("announcement_key", key)
      .maybeSingle();

    return NextResponse.json({ seen: Boolean(data) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const key =
      (typeof body?.key === "string" && body.key.trim()) || CLUB_PUBLIC_PAGE_ANNOUNCEMENT_KEY;

    const ctx = await getAuthContext();
    const clubId = ctx?.current?.clubId;
    if (!clubId) {
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase.from("feature_announcements_seen").upsert(
      {
        user_id: user.id,
        club_id: clubId,
        announcement_key: key,
        seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,club_id,announcement_key" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
