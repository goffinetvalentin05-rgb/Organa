import { createClient } from "@/lib/supabase/server";

/**
 * Buckets gérés par l'application. Tous PRIVÉS depuis la migration 025.
 * Toute lecture passe par une URL signée à durée limitée.
 */
export const STORAGE_BUCKETS = {
  LOGOS: "Logos",
  EXPENSES: "expenses",
} as const;

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Convention : le 1er segment du chemin est toujours le club_id.
 * Cette fonction valide ça avant tout accès.
 */
export function extractClubIdFromPath(path: string): string | null {
  const first = path.split("/", 2)[0];
  // Validation UUID v4 (lâche)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(first)) {
    return null;
  }
  return first;
}

/**
 * Construit un chemin canonique pour un fichier dans un bucket.
 *   makeStoragePath('Logos', clubId, 'logo-123.png')
 *   → "<clubId>/logo-123.png"
 */
export function makeStoragePath(
  _bucket: StorageBucket,
  clubId: string,
  fileName: string
): string {
  // On normalise le nom : retire chemins remontants, espaces, caractères dangereux
  const safe = fileName
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .slice(0, 200);
  return `${clubId}/${safe}`;
}

export interface SignedUrlOptions {
  /** Durée de validité en secondes (défaut 5 minutes). */
  expiresInSeconds?: number;
  /** Force le téléchargement avec un nom de fichier donné. */
  download?: string | boolean;
  /** Transformations d'image éventuelles (resize, etc.). */
  transform?: { width?: number; height?: number; quality?: number };
}

/**
 * Génère une URL signée pour un fichier dans un bucket privé.
 * Vérifie côté serveur que le chemin appartient au club_id attendu.
 *
 * @returns L'URL signée ou null si interdiction / erreur.
 */
export async function createSecureSignedUrl(
  bucket: StorageBucket,
  path: string,
  expectedClubId: string,
  opts: SignedUrlOptions = {}
): Promise<string | null> {
  const pathClubId = extractClubIdFromPath(path);
  if (!pathClubId) {
    console.warn("[STORAGE] Chemin sans club_id valide:", { bucket, path });
    return null;
  }
  if (pathClubId !== expectedClubId) {
    console.warn("[STORAGE] Tentative d'accès cross-club bloquée:", {
      bucket,
      path,
      expectedClubId,
    });
    return null;
  }

  const supabase = await createClient();
  const expiresIn = Math.max(30, Math.min(opts.expiresInSeconds ?? 300, 3600));

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn, {
      download: opts.download,
      transform: opts.transform,
    });

  if (error || !data?.signedUrl) {
    console.error("[STORAGE] Erreur createSignedUrl:", { bucket, path, error });
    return null;
  }
  return data.signedUrl;
}
