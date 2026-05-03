import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import { resolveResendFromProfile } from "@/lib/email/resend-delivery";

export const runtime = "nodejs";

/**
 * GET /api/club/email-status
 *
 * Indique à l'owner si l'envoi d'email d'invitation est réellement actif
 * pour son club, et pourquoi le cas échéant.
 *
 * Retourne :
 *   {
 *     canSend: boolean,
 *     mode: "custom" | "obillz" | null,
 *     reason: "no_global_key" | "custom_disabled" | "custom_invalid" | "ok",
 *     globalConfigured: boolean,
 *     custom: { enabled, hasKey, hasSender, validSender },
 *   }
 */
export async function GET() {
  const guard = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if ("error" in guard) return guard.error;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled"
    )
    .eq("user_id", guard.clubId)
    .maybeSingle();

  const customEnabled = profile?.email_custom_enabled === true;
  const customKey = (profile?.resend_api_key || "").trim();
  const customSender = (profile?.email_sender_email || "").trim();
  const validSender = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customSender);
  const globalKey = (process.env.RESEND_API_KEY || "").trim();
  const globalConfigured = !!globalKey;

  const delivery = resolveResendFromProfile({
    company_name: profile?.company_name,
    company_email: profile?.company_email,
    email_sender_name: profile?.email_sender_name,
    email_sender_email: profile?.email_sender_email,
    resend_api_key: profile?.resend_api_key,
    email_custom_enabled: profile?.email_custom_enabled,
  });

  let reason:
    | "ok"
    | "no_global_key"
    | "custom_disabled"
    | "custom_invalid" = "ok";

  if (!delivery) {
    reason = "no_global_key";
  } else if (delivery.mode === "obillz" && customEnabled) {
    // L'owner a coché "envoi custom" mais sa config est invalide → on est
    // tombé sur le fallback Obillz.
    reason = "custom_invalid";
  } else if (!customEnabled && !globalConfigured) {
    reason = "no_global_key";
  }

  return NextResponse.json(
    {
      canSend: !!delivery,
      mode: delivery?.mode ?? null,
      reason,
      globalConfigured,
      custom: {
        enabled: customEnabled,
        hasKey: !!customKey,
        hasSender: !!customSender,
        validSender,
      },
    },
    { status: 200 }
  );
}
