import { createAdminClient } from "@/lib/supabase/admin";
import { hashToolParams } from "./hash";
import type { ConfirmationPreview, ToolActor } from "./types";

export const CONFIRMATION_TTL_MS = 10 * 60 * 1000;

export type StoredConfirmation = {
  id: string;
  clubId: string;
  userId: string;
  toolName: string;
  paramsHash: string;
  preview: ConfirmationPreview;
  expiresAt: string;
};

export async function createToolConfirmation(params: {
  actor: ToolActor;
  toolName: string;
  input: unknown;
  preview: ConfirmationPreview;
}): Promise<StoredConfirmation> {
  const admin = createAdminClient();
  const paramsHash = hashToolParams(params.input);
  const expiresAt = new Date(Date.now() + CONFIRMATION_TTL_MS).toISOString();

  const { data, error } = await admin
    .from("ai_tool_confirmations")
    .insert({
      club_id: params.actor.clubId,
      user_id: params.actor.userId,
      tool_name: params.toolName,
      params_hash: paramsHash,
      parameters: params.input ?? {},
      preview: params.preview,
      expires_at: expiresAt,
    })
    .select("id, club_id, user_id, tool_name, params_hash, preview, expires_at")
    .single();

  if (error || !data) {
    throw new Error(
      `Impossible d’enregistrer la confirmation : ${error?.message || "inconnu"}`
    );
  }

  return {
    id: data.id as string,
    clubId: data.club_id as string,
    userId: data.user_id as string,
    toolName: data.tool_name as string,
    paramsHash: data.params_hash as string,
    preview: data.preview as ConfirmationPreview,
    expiresAt: data.expires_at as string,
  };
}

export async function consumeToolConfirmation(params: {
  confirmationId: string;
  actor: ToolActor;
  toolName: string;
  input: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const paramsHash = hashToolParams(params.input);

  const { data, error } = await admin
    .from("ai_tool_confirmations")
    .select("id, club_id, user_id, tool_name, params_hash, expires_at, consumed_at")
    .eq("id", params.confirmationId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Confirmation introuvable" };
  }

  if (data.consumed_at) {
    return { ok: false, error: "Cette confirmation a déjà été utilisée" };
  }

  if (new Date(data.expires_at as string).getTime() < Date.now()) {
    return { ok: false, error: "Cette confirmation a expiré" };
  }

  if (
    data.club_id !== params.actor.clubId ||
    data.user_id !== params.actor.userId ||
    data.tool_name !== params.toolName
  ) {
    return { ok: false, error: "Confirmation non valable pour cette action" };
  }

  if (data.params_hash !== paramsHash) {
    return {
      ok: false,
      error: "Les paramètres ont changé depuis la demande de confirmation",
    };
  }

  const { error: updateError } = await admin
    .from("ai_tool_confirmations")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", params.confirmationId)
    .is("consumed_at", null);

  if (updateError) {
    return { ok: false, error: "Impossible de valider la confirmation" };
  }

  return { ok: true };
}

export function defaultPreview(
  action: string,
  toolName: string,
  input: unknown
): ConfirmationPreview {
  return {
    action,
    summary: `Exécuter ${toolName}`,
    targets: [],
  };
}
