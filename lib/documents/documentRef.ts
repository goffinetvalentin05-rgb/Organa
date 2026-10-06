import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/**
 * Le numéro affiché (143, FAC-2026-143) n'est pas la clé technique.
 * Un suffixe numérique ne compte que s'il est le dernier segment après un tiret.
 */
export function numeroMatchesVisible(numero: string, ref: string): boolean {
  const value = numero.trim();
  const wanted = ref.trim();
  if (!value || !wanted || UUID_RE.test(wanted)) return false;
  if (value === wanted) return true;
  if (!/^\d+$/.test(wanted)) return false;
  const parts = value.split("-");
  if (parts.length < 2) return false;
  const last = parts[parts.length - 1].replace(/^0+/, "") || "0";
  const needle = wanted.replace(/^0+/, "") || "0";
  return last === needle;
}

export type ResolvedDocument =
  | { ok: true; id: string }
  | { ok: false; status: 400 | 404 | 409; error: string };

const COMMERCIAL_NUMERO_RE = /^(?:COT|FAC)-\d{4}-\d+$/i;

/** UUID du script d'origine, ou entier : documents.id est un bigint en production. */
export function isTechnicalDocumentId(value: string): boolean {
  return isUuid(value) || /^\d+$/.test(value);
}

function isIdTypeMismatch(error: { code?: string; message?: string }): boolean {
  return error.code === "22P02" || /invalid input syntax for type/i.test(error.message ?? "");
}

export async function resolveClubDocumentId(
  admin: SupabaseClient,
  clubId: string,
  ref: string,
): Promise<ResolvedDocument> {
  const trimmed = ref.trim();
  if (!trimmed) return { ok: false, status: 400, error: "Document introuvable" };

  if (isTechnicalDocumentId(trimmed)) {
    if (isUuid(trimmed)) return { ok: true, id: trimmed };

    const { data, error } = await admin
      .from("documents")
      .select("id")
      .eq("user_id", clubId)
      .eq("id", trimmed)
      .maybeSingle();
    if (error) {
      if (isIdTypeMismatch(error)) return { ok: false, status: 404, error: "Document introuvable" };
      throw new Error(error.message);
    }
    if (data?.id == null || data.id === "") return { ok: false, status: 404, error: "Document introuvable" };
    return { ok: true, id: String(data.id) };
  }

  if (!COMMERCIAL_NUMERO_RE.test(trimmed)) {
    return { ok: false, status: 400, error: "Référence de document invalide" };
  }

  const { data: exact, error: exactError } = await admin
    .from("documents")
    .select("id, numero")
    .eq("user_id", clubId)
    .is("deleted_at", null)
    .eq("numero", trimmed);
  if (exactError) throw new Error(exactError.message);

  const matches = exact ?? [];
  if (matches.length === 0) {
    return { ok: false, status: 404, error: `Aucun document ne porte le numéro ${trimmed}.` };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      status: 409,
      error: `Plusieurs documents portent le numéro ${trimmed}. Ouvrez le document depuis la liste.`,
    };
  }
  return { ok: true, id: String(matches[0].id) };
}
