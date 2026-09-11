const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isStorageObjectPath(path: string | null | undefined): boolean {
  if (!path || typeof path !== "string") return false;
  const trimmed = path.trim();
  if (!trimmed || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return false;
  }
  if (trimmed.includes("..")) return false;
  const first = trimmed.split("/")[0];
  return UUID_RE.test(first);
}

export function storagePathFromPublicUrl(
  url: string | null | undefined,
  bucket: string
): string | null {
  if (!url || !bucket) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  try {
    const raw = decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
    return isStorageObjectPath(raw) ? raw : null;
  } catch {
    return null;
  }
}

type StorageRemoveClient = {
  storage: {
    from: (bucket: string) => {
      remove: (paths: string[]) => Promise<{ error: unknown } | unknown>;
    };
  };
};

/**
 * Supprime des objets Storage. Ignore les chemins invalides / URLs http.
 * N’échoue pas l’appelant si le fichier est déjà absent.
 */
export async function removeStorageObjects(
  supabase: StorageRemoveClient,
  bucket: string,
  paths: Array<string | null | undefined>
): Promise<void> {
  const clean = Array.from(
    new Set(paths.filter((p): p is string => isStorageObjectPath(p)))
  );
  if (clean.length === 0) return;
  try {
    await supabase.storage.from(bucket).remove(clean);
  } catch (err) {
    console.error("[STORAGE] removeObjects failed", { bucket, count: clean.length, err });
  }
}
