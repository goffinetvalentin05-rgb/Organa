import { storagePathFromPublicUrl } from "@/lib/storage/removeObjects";
import type { VisualData } from "@/lib/visuals/types";

const VISUAL_URL_KEYS = [
  "clubLogoUrl",
  "opponentLogoUrl",
  "eventLogoUrl",
  "playerImageUrl",
  "teamImageUrl",
  "backgroundImageUrl",
  "eventImageUrl",
] as const;

/** Chemins bucket visual-assets référencés par un visuel (pas les logos club). */
export function visualAssetPathsFromData(data: VisualData | null | undefined): string[] {
  if (!data) return [];
  const paths: string[] = [];
  for (const key of VISUAL_URL_KEYS) {
    const url = data[key];
    if (typeof url !== "string" || !url) continue;
    const path = storagePathFromPublicUrl(url, "visual-assets");
    if (path) paths.push(path);
  }
  return paths;
}
