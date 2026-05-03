import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import {
  DEFAULT_MEMBER_FIELDS,
  MEMBER_FIELD_KEYS,
  type MemberFieldKey,
  type MemberFieldsMerged,
  type MemberFieldToggle,
} from "@/lib/member-fields/types";
import { fetchMergedMemberFieldSettings } from "@/lib/member-fields/loadSettings";

export const runtime = "nodejs";

function logMemberFieldsErr(op: string, err: { code?: string; message?: string }) {
  console.error(`[API][club/member-field-settings][${op}]`, {
    code: err.code ?? null,
    hint: err.message?.slice(0, 200) ?? null,
  });
}

export async function GET() {
  const guard = await requirePermission(PERMISSIONS.VIEW_MEMBERS);
  if ("error" in guard) return guard.error;

  const supabase = await createClient();
  const merged = await fetchMergedMemberFieldSettings(supabase, guard.clubId);
  return NextResponse.json({ fields: merged }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const guard = await requirePermission(PERMISSIONS.ACCESS_SETTINGS);
  if ("error" in guard) return guard.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const incoming = (body as { fields?: Partial<Record<MemberFieldKey, Partial<MemberFieldToggle>>> })
    ?.fields;
  if (!incoming || typeof incoming !== "object") {
    return NextResponse.json({ error: "Champ 'fields' requis" }, { status: 400 });
  }

  const merged: MemberFieldsMerged = { ...DEFAULT_MEMBER_FIELDS };
  for (const k of MEMBER_FIELD_KEYS) {
    merged[k] = { ...DEFAULT_MEMBER_FIELDS[k] };
  }
  for (const k of MEMBER_FIELD_KEYS) {
    const v = incoming[k];
    if (v && typeof v === "object" && typeof v.enabled === "boolean") {
      merged[k] = {
        enabled: v.enabled,
        required: typeof v.required === "boolean" ? v.required : false,
      };
    }
  }

  const supabase = await createClient();
  const rows = MEMBER_FIELD_KEYS.map((field_key) => ({
    club_id: guard.clubId,
    field_key,
    enabled: merged[field_key].enabled,
    required: merged[field_key].required,
  }));

  const { error } = await supabase
    .from("club_member_field_settings")
    .upsert(rows, { onConflict: "club_id,field_key" });

  if (error) {
    logMemberFieldsErr("PUT", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer la configuration", code: "MEMBER_FIELDS_SAVE_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, fields: merged }, { status: 200 });
}
