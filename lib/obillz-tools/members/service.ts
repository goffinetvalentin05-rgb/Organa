import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeClientsDbRow,
  normalizedClientToApi,
  normalizedClientToApiListItem,
  type NormalizedClientRow,
} from "@/lib/clients/normalizeDbRow";
import { fetchMergedMemberFieldSettings } from "@/lib/member-fields/loadSettings";
import { maskAvsNumber } from "@/lib/member-fields/types";
import {
  buildClientInsertPayload,
  buildClientUpdatePatch,
} from "@/lib/clients/memberWritePayload";
import { ToolError } from "@/lib/obillz-tools/core/errors";

export type MemberListItem = ReturnType<typeof normalizedClientToApiListItem>;

function admin() {
  return createAdminClient();
}

export async function listMembersForClub(clubId: string): Promise<MemberListItem[]> {
  const { data, error } = await admin()
    .from("clients")
    .select("*")
    .eq("user_id", clubId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ToolError(
      "Impossible de charger les membres",
      "CLIENTS_LIST_FAILED",
      500
    );
  }

  return (data || [])
    .map((row) => normalizeClientsDbRow(row as Record<string, unknown>))
    .filter(
      (n): n is NormalizedClientRow => n !== null && n.user_id === clubId
    )
    .map((n) => normalizedClientToApiListItem(n));
}

export async function getMemberForClub(
  clubId: string,
  memberId: string
): Promise<ReturnType<typeof normalizedClientToApi> & { avsNumber: string | null }> {
  const { data, error } = await admin()
    .from("clients")
    .select("*")
    .eq("id", memberId)
    .eq("user_id", clubId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new ToolError("Client introuvable", "CLIENT_NOT_FOUND", 404);
  }

  const normalized = normalizeClientsDbRow(data as Record<string, unknown>);
  if (!normalized || normalized.user_id !== clubId) {
    throw new ToolError("Client introuvable", "CLIENT_NOT_FOUND", 404);
  }

  return {
    ...normalizedClientToApi(normalized),
    avsNumber: maskAvsNumber(normalized.avs_number),
  };
}

export function searchMembersList(
  members: MemberListItem[],
  query: string
): MemberListItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return members;
  return members.filter((m) => {
    const nom = (m.nom || "").toLowerCase();
    const email = (m.email || "").toLowerCase();
    const city = (m.city || "").toLowerCase();
    return nom.includes(q) || email.includes(q) || city.includes(q);
  });
}

export async function createMemberForClub(params: {
  clubId: string;
  actorUserId: string;
  body: Record<string, unknown>;
}): Promise<MemberListItem> {
  const nom = params.body.nom;
  if (!nom || typeof nom !== "string" || nom.trim().length === 0) {
    throw new ToolError("Le champ 'nom' est requis", "CLIENTS_NAME_REQUIRED", 400);
  }

  const supabase = await createClient();
  const fieldSettings = await fetchMergedMemberFieldSettings(
    supabase,
    params.clubId
  );
  const insertPayload = buildClientInsertPayload(
    params.body,
    fieldSettings,
    params.clubId,
    params.actorUserId
  );

  const { data: newClient, error: insertError } = await admin()
    .from("clients")
    .insert(insertPayload)
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      throw new ToolError(
        "Impossible de créer le membre : une contrainte d'unicité a été violée (souvent un email déjà utilisé).",
        "CLIENTS_CREATE_DUPLICATE",
        409
      );
    }
    throw new ToolError(
      "Impossible de créer le membre. Vérifiez les informations saisies ou réessayez.",
      "CLIENTS_CREATE_FAILED",
      500
    );
  }

  const normalized = newClient
    ? normalizeClientsDbRow(newClient as Record<string, unknown>)
    : null;
  if (!normalized || !normalized.id || normalized.user_id !== params.clubId) {
    throw new ToolError(
      "Erreur lors de la création du client",
      "CLIENTS_CREATE_FAILED",
      500
    );
  }

  return normalizedClientToApiListItem(normalized);
}

export async function updateMemberForClub(params: {
  clubId: string;
  actorUserId: string;
  memberId: string;
  body: Record<string, unknown>;
}): Promise<MemberListItem & { avsNumber: string | null }> {
  const nom = params.body.nom;
  if (!nom || typeof nom !== "string" || nom.trim().length === 0) {
    throw new ToolError("Le nom est obligatoire", "CLIENTS_NAME_REQUIRED", 400);
  }

  const db = admin();
  const { data: existingRow, error: loadExistingErr } = await db
    .from("clients")
    .select("*")
    .eq("id", params.memberId)
    .eq("user_id", params.clubId)
    .is("deleted_at", null)
    .maybeSingle();

  if (loadExistingErr || !existingRow) {
    throw new ToolError("Client introuvable ou non autorisé", "CLIENT_NOT_FOUND", 404);
  }

  const supabase = await createClient();
  const fieldSettings = await fetchMergedMemberFieldSettings(
    supabase,
    params.clubId
  );
  const patch = buildClientUpdatePatch(
    params.body,
    fieldSettings,
    existingRow as Record<string, unknown>,
    params.actorUserId
  );

  const { data: updated, error: updateError } = await db
    .from("clients")
    .update(patch)
    .eq("id", params.memberId)
    .eq("user_id", params.clubId)
    .select("*")
    .maybeSingle();

  if (updateError) {
    throw new ToolError(
      "Impossible de mettre à jour le membre",
      "CLIENTS_UPDATE_FAILED",
      500
    );
  }

  const normalized = updated
    ? normalizeClientsDbRow(updated as Record<string, unknown>)
    : null;
  if (!normalized || normalized.user_id !== params.clubId) {
    throw new ToolError("Client introuvable ou non autorisé", "CLIENT_NOT_FOUND", 404);
  }

  return {
    ...normalizedClientToApiListItem(normalized),
    avsNumber: maskAvsNumber(normalized.avs_number),
  };
}

export async function archiveMemberForClub(params: {
  clubId: string;
  memberId: string;
}): Promise<{ success: true; id: string }> {
  const supabase = await createClient();
  const { data: deletedRows, error: deleteError } = await supabase
    .from("clients")
    .delete()
    .eq("id", params.memberId)
    .eq("user_id", params.clubId)
    .select("id");

  if (deleteError) {
    throw new ToolError(
      "Impossible de supprimer le membre",
      "CLIENTS_DELETE_FAILED",
      500
    );
  }

  if (!deletedRows || deletedRows.length === 0) {
    throw new ToolError(
      "Client introuvable ou déjà supprimé",
      "CLIENT_NOT_FOUND",
      404
    );
  }

  return { success: true, id: params.memberId };
}
