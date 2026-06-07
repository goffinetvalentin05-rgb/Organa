import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS, extractClubIdFromPath } from "@/lib/storage/secureUrl";
import { getErrorMessage } from "@/lib/utils/error-message";

const LOGOS_BUCKET = STORAGE_BUCKETS.LOGOS;

export type ClubLogoProfile = {
  logo_path?: string | null;
  logo_url?: string | null;
};

function isLikelyExpiredSignedUrl(url: string): boolean {
  return url.includes("/object/sign/") || url.includes("token=");
}

function getPublicLogoUrl(supabase: SupabaseClient, logoPath: string): string | null {
  const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(logoPath);
  const url = data?.publicUrl?.trim();
  if (!url || !url.startsWith("https://")) return null;
  return url;
}

async function createSignedLogoUrl(
  supabase: SupabaseClient,
  logoPath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const expiresIn = Math.max(30, Math.min(expiresInSeconds, 3600));
  const { data, error } = await supabase.storage
    .from(LOGOS_BUCKET)
    .createSignedUrl(logoPath, expiresIn);

  if (error || !data?.signedUrl) {
    console.warn("[club-logo] Impossible de générer une URL signée:", {
      path: logoPath,
      error: error?.message,
    });
    return null;
  }

  return data.signedUrl;
}

/**
 * URL affichable du logo (pages web, API settings).
 * Priorise logo_path → URL publique fraîche ; ignore logo_url signées expirées.
 */
export function resolveClubLogoDisplayUrl(
  supabase: SupabaseClient,
  profile: ClubLogoProfile | null | undefined,
  clubId: string
): string | null {
  if (!profile) return null;

  const path = profile.logo_path?.trim();
  if (path && extractClubIdFromPath(path) === clubId) {
    const publicUrl = getPublicLogoUrl(supabase, path);
    if (publicUrl) return publicUrl;
  }

  const stored = profile.logo_url?.trim();
  if (stored && stored.startsWith("https://") && !isLikelyExpiredSignedUrl(stored)) {
    return stored;
  }

  return null;
}

/**
 * URL utilisable pour charger le logo côté serveur (PDF, emails).
 * Essaie l'URL publique depuis logo_path, puis une URL signée si nécessaire.
 */
export async function resolveClubLogoFetchUrl(
  supabase: SupabaseClient,
  profile: ClubLogoProfile | null | undefined,
  clubId: string,
  options?: { expiresInSeconds?: number }
): Promise<string | null> {
  if (!profile) return null;

  const path = profile.logo_path?.trim();
  const pathClubId = path ? extractClubIdFromPath(path) : null;

  if (path && pathClubId === clubId) {
    const publicUrl = getPublicLogoUrl(supabase, path);
    if (publicUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(publicUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (response.ok) return publicUrl;
      } catch {
        // Bucket peut encore être privé (env sans migration 027) → signed URL
      }

      const signedUrl = await createSignedLogoUrl(
        supabase,
        path,
        options?.expiresInSeconds
      );
      if (signedUrl) return signedUrl;
    }
  }

  const displayUrl = resolveClubLogoDisplayUrl(supabase, profile, clubId);
  if (displayUrl) return displayUrl;

  if (path && pathClubId === clubId) {
    return createSignedLogoUrl(supabase, path, options?.expiresInSeconds);
  }

  return null;
}

/**
 * URL signée pour affichage client lorsque le bucket Logos est privé.
 */
export async function resolveClubLogoUrlForClient(
  supabase: SupabaseClient,
  profile: ClubLogoProfile | null | undefined,
  clubId: string
): Promise<string | null> {
  const displayUrl = resolveClubLogoDisplayUrl(supabase, profile, clubId);
  if (!displayUrl) return null;

  const path = profile?.logo_path?.trim();
  if (!path || extractClubIdFromPath(path) !== clubId) {
    return displayUrl;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(displayUrl, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) return displayUrl;
  } catch {
    // fallback signed URL
  }

  return createSignedLogoUrl(supabase, path, 3600) ?? displayUrl;
}

/**
 * Convertit une URL d'image en Data URL (base64) pour @react-pdf/renderer.
 */
export async function fetchImageAsDataUrl(url: string): Promise<string | undefined> {
  try {
    if (!url.startsWith("https://")) {
      console.warn("[club-logo] Logo URL n'est pas HTTPS, ignorée:", url);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "image/*" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        "[club-logo] Erreur HTTP lors du chargement du logo:",
        response.status,
        response.statusText
      );
      return undefined;
    }

    const contentType = response.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) {
      console.warn("[club-logo] Le fichier n'est pas une image valide:", contentType);
      return undefined;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      console.warn("[club-logo] L'image est vide");
      return undefined;
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[club-logo] Timeout lors du chargement du logo (10s)");
    } else {
      console.error(
        "[club-logo] Erreur lors de la conversion du logo en base64:",
        getErrorMessage(error)
      );
    }
    return undefined;
  }
}

/**
 * Logo club prêt pour les PDF (data URL base64).
 */
export async function getClubLogoDataUrlForPdf(
  supabase: SupabaseClient,
  profile: ClubLogoProfile | null | undefined,
  clubId: string
): Promise<string | undefined> {
  const fetchUrl = await resolveClubLogoFetchUrl(supabase, profile, clubId);
  if (!fetchUrl) return undefined;

  const dataUrl = await fetchImageAsDataUrl(fetchUrl);
  if (!dataUrl) {
    console.warn("[club-logo] Impossible de charger le logo, PDF généré sans logo");
  }
  return dataUrl;
}
