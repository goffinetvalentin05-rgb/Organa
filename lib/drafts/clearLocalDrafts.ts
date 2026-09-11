export const LOCAL_DRAFT_KEY_PREFIXES = [
  "obillz:draft:",
  "obillz:planning-draft:",
] as const;

function isDraftStorageKey(key: string): boolean {
  return LOCAL_DRAFT_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Supprime les brouillons Obillz du localStorage (déconnexion). */
export function clearAllLocalDrafts(): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    const ls = window.localStorage;
    const toRemove: string[] = [];
    for (let i = 0; i < ls.length; i += 1) {
      const key = ls.key(i);
      if (key && isDraftStorageKey(key)) toRemove.push(key);
    }
    for (const key of toRemove) ls.removeItem(key);
  } catch {
    // quota / mode privé
  }
}
