import type { SportFeatureId } from "@/lib/sport-features";

export const PRACTICE_EVENT = "obillz:select-practice";

export const PRACTICE_FEATURE_IDS = [
  "cotisations",
  "plannings",
  "communication",
  "sponsors",
] as const satisfies readonly SportFeatureId[];

export type PracticeFeatureId = (typeof PRACTICE_FEATURE_IDS)[number];

const HASH_BY_FEATURE: Record<PracticeFeatureId, string> = {
  cotisations: "en-pratique-cotisations",
  plannings: "en-pratique-plannings",
  communication: "en-pratique-communication",
  sponsors: "en-pratique-sponsoring",
};

const INDEX_BY_FEATURE: Record<PracticeFeatureId, number> = {
  cotisations: 0,
  plannings: 1,
  communication: 2,
  sponsors: 3,
};

const FEATURE_BY_HASH = Object.fromEntries(
  Object.entries(HASH_BY_FEATURE).map(([feature, hash]) => [hash, feature])
) as Record<string, PracticeFeatureId>;

export const PRACTICE_HASHES = Object.values(HASH_BY_FEATURE);

export function isPracticeFeatureId(id: string): id is PracticeFeatureId {
  return (PRACTICE_FEATURE_IDS as readonly string[]).includes(id);
}

export function practiceHashForFeature(id: string): string | null {
  if (!isPracticeFeatureId(id)) return null;
  return HASH_BY_FEATURE[id];
}

export function practiceIndexForFeature(id: string): number | null {
  if (!isPracticeFeatureId(id)) return null;
  return INDEX_BY_FEATURE[id];
}

export function practiceIndexFromHash(hash: string): number | null {
  const clean = hash.replace(/^#/, "");
  const feature = FEATURE_BY_HASH[clean];
  return feature ? INDEX_BY_FEATURE[feature] : null;
}

export function openPracticeExample(featureId: string) {
  const index = practiceIndexForFeature(featureId);
  const hash = practiceHashForFeature(featureId);
  if (index == null || !hash) return;

  window.dispatchEvent(
    new CustomEvent(PRACTICE_EVENT, { detail: { index } })
  );
  history.replaceState(null, "", `#${hash}`);
  document.getElementById("en-pratique")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}
