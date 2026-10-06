import type { SupabaseClient } from "@supabase/supabase-js";

function prefixFor(type: "invoice" | "quote"): string {
  return type === "quote" ? "COT" : "FAC";
}

export function formatDocumentNumero(type: "invoice" | "quote", year: number, sequence: number): string {
  return `${prefixFor(type)}-${year}-${String(sequence).padStart(3, "0")}`;
}

/**
 * Réserve le prochain numéro dans la même transaction que le compteur.
 * Retourne null si la migration 110 n'est pas encore appliquée : l'appelant
 * retombe alors sur le comptage, qui peut encore entrer en collision.
 */
export async function allocateDocumentNumero(
  admin: SupabaseClient,
  clubId: string,
  type: "invoice" | "quote",
  year = new Date().getFullYear(),
): Promise<string | null> {
  if (typeof admin.rpc !== "function") return null;
  const { data, error } = await admin.rpc("reserve_document_sequence", {
    p_club: clubId,
    p_type: type,
    p_year: year,
  });
  if (error) {
    const message = error.message || "";
    if (/reserve_document_sequence|does not exist|n'existe pas|schema cache|Could not find the function/i.test(message)) {
      return null;
    }
    throw new Error(message);
  }
  const sequence = Number(data);
  if (!Number.isInteger(sequence) || sequence < 1) return null;
  return formatDocumentNumero(type, year, sequence);
}
