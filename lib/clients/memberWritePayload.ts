import type { MemberFieldsMerged } from "@/lib/member-fields/types";

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

/** INSERT : uniquement les champs activés (les autres restent NULL). */
export function buildClientInsertPayload(
  body: Record<string, unknown>,
  settings: MemberFieldsMerged,
  clubId: string,
  userId: string
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    user_id: clubId,
    nom: str(body.nom).trim(),
    created_by: userId,
    updated_by: userId,
  };
  if (!out.nom) {
    return out;
  }
  if (settings.email.enabled) out.email = str(body.email).trim() || null;
  if (settings.phone.enabled) out.telephone = str(body.telephone).trim() || null;
  if (settings.address.enabled) {
    out.adresse = str(body.adresse).trim() || null;
    out.postal_code = str(body.postal_code).trim() || null;
    out.city = str(body.city).trim() || null;
  }
  if (settings.role.enabled) out.role = str(body.role).trim() || "player";
  else out.role = "player";
  if (settings.category.enabled) {
    const c = str(body.category).trim();
    out.category = c || null;
  }
  if (settings.birth_date.enabled) {
    const d = str(body.date_of_birth ?? body.dateOfBirth).trim();
    out.date_of_birth = d || null;
  }
  if (settings.avs_number.enabled) {
    const a = str(body.avs_number ?? body.avsNumber).trim();
    out.avs_number = a || null;
  }
  return out;
}

/** UPDATE : ne modifie que les champs activés ; les autres colonnes restent inchangées côté SQL (merge serveur). */
export function buildClientUpdatePatch(
  body: Record<string, unknown>,
  settings: MemberFieldsMerged,
  existing: Record<string, unknown>,
  userId: string
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    updated_by: userId,
  };
  patch.nom = str(body.nom ?? existing.nom ?? existing.name).trim();
  if (settings.email.enabled) {
    patch.email = str(body.email).trim() || null;
  }
  if (settings.phone.enabled) {
    patch.telephone = str(body.telephone).trim() || null;
  }
  if (settings.address.enabled) {
    patch.adresse = str(body.adresse).trim() || null;
    patch.postal_code = str(body.postal_code).trim() || null;
    patch.city = str(body.city).trim() || null;
  }
  if (settings.role.enabled) {
    patch.role = str(body.role).trim() || "player";
  }
  if (settings.category.enabled) {
    const c = str(body.category).trim();
    patch.category = c || null;
  }
  if (settings.birth_date.enabled) {
    const d = str(body.date_of_birth ?? body.dateOfBirth).trim();
    patch.date_of_birth = d || null;
  }
  if (settings.avs_number.enabled) {
    const a = str(body.avs_number ?? body.avsNumber).trim();
    patch.avs_number = a || null;
  }
  return patch;
}
