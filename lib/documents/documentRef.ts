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

export async function resolveClubDocumentId(
  admin: SupabaseClient,
  clubId: string,
  ref: string,
): Promise<ResolvedDocument> {
  const trimmed = ref.trim();
  if (!trimmed) return { ok: false, status: 400, error: "Document introuvable" };
  if (isUuid(trimmed)) return { ok: true, id: trimmed };
  if (!/^[\p{L}\p{N} ./_-]{1,40}$/u.test(trimmed)) {
    return { ok: false, status: 400, error: "Référence de document invalide" };
  }

  const { data: exact, error: exactError } = await admin
    .from("documents")
    .select("id, numero")
    .eq("user_id", clubId)
    .is("deleted_at", null)
    .eq("numero", trimmed);
  if (exactError) throw new Error(exactError.message);

  let rows = exact ?? [];
  if (rows.length === 0 && /^\d+$/.test(trimmed)) {
    const { data: suffixed, error: suffixError } = await admin
      .from("documents")
      .select("id, numero")
      .eq("user_id", clubId)
      .is("deleted_at", null)
      .ilike("numero", `%${trimmed}`);
    if (suffixError) throw new Error(suffixError.message);
    rows = (suffixed ?? []).filter((row) => numeroMatchesVisible(String(row.numero ?? ""), trimmed));
  }

  const matches = rows.filter((row) => numeroMatchesVisible(String(row.numero ?? ""), trimmed));
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
