/**
 * Normalise une ligne `public.clients` pour tolérer :
 * - colonnes FR (nom, telephone, adresse) vs historiques EN (name, phone, address)
 * - champs optionnels absents sur certaines bases (ex. postal_code, city, created_by)
 */

function optString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  return String(v);
}

function firstString(...vals: unknown[]): string | null {
  for (const v of vals) {
    const s = optString(v);
    if (s !== null && s !== "") return s;
  }
  return null;
}

export interface NormalizedClientRow {
  id: string;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  postal_code: string | null;
  city: string | null;
  user_id: string;
  role: string;
  category: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Payload JSON attendu par le front (liste / fiche / API). */
export function normalizedClientToApi(n: NormalizedClientRow) {
  return {
    id: n.id,
    nom: n.nom,
    email: n.email,
    telephone: n.telephone,
    adresse: n.adresse,
    postal_code: n.postal_code,
    city: n.city,
    user_id: n.user_id,
    role: n.role,
    category: n.category,
    createdBy: n.created_by,
    updatedBy: n.updated_by,
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  };
}

export function normalizeClientsDbRow(
  r: Record<string, unknown>
): NormalizedClientRow | null {
  const id = optString(r.id);
  if (!id) return null;

  const user_id = optString(r.user_id);
  if (!user_id) return null;

  return {
    id,
    nom: firstString(r.nom, r.name),
    email: optString(r.email),
    telephone: firstString(r.telephone, r.phone),
    adresse: firstString(r.adresse, r.address),
    postal_code: optString(r.postal_code),
    city: optString(r.city),
    user_id,
    role: optString(r.role) || "player",
    category: optString(r.category),
    created_by: optString(r.created_by),
    updated_by: optString(r.updated_by),
    created_at: optString(r.created_at),
    updated_at: optString(r.updated_at),
  };
}
