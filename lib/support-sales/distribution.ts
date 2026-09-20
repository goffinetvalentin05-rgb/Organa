import fr from "@/lib/i18n/fr.json";
import { formatCategoryLabel, MEMBER_CATEGORY_SLUGS } from "@/lib/members/taxonomy";
import type { SupportSaleMemberRow } from "./types";

export type DistributionTeamGroup = {
  key: string;
  label: string;
  members: Array<{
    memberId: string;
    memberName: string;
    quantitySold: number;
  }>;
  totalQuantity: number;
};

function translateCategory(key: string): string {
  const parts = key.split(".");
  let current: unknown = fr;
  for (const part of parts) {
    if (!current || typeof current !== "object") return key;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : key;
}

export function groupMembersForDistribution(
  members: SupportSaleMemberRow[]
): DistributionTeamGroup[] {
  const withSales = members.filter((row) => row.quantitySold > 0);
  const byKey = new Map<string, DistributionTeamGroup>();
  const uncategorized: DistributionTeamGroup = {
    key: "__other__",
    label: "Autres membres",
    members: [],
    totalQuantity: 0,
  };

  for (const row of withSales) {
    const category = (row.memberCategory || "").trim();
    const target = category
      ? byKey.get(category) || {
          key: category,
          label: formatCategoryLabel(category, translateCategory),
          members: [],
          totalQuantity: 0,
        }
      : uncategorized;
    target.members.push({
      memberId: row.memberId,
      memberName: row.memberName,
      quantitySold: row.quantitySold,
    });
    target.totalQuantity += row.quantitySold;
    if (category) byKey.set(category, target);
  }

  const slugOrder = new Map<string, number>(
    MEMBER_CATEGORY_SLUGS.map((slug, index) => [slug, index])
  );
  const groups = [...byKey.values()].sort((a, b) => {
    const ai = slugOrder.has(a.key) ? slugOrder.get(a.key)! : 1000;
    const bi = slugOrder.has(b.key) ? slugOrder.get(b.key)! : 1000;
    if (ai !== bi) return ai - bi;
    return a.label.localeCompare(b.label, "fr");
  });

  for (const group of groups) {
    group.members.sort((a, b) => a.memberName.localeCompare(b.memberName, "fr"));
  }
  uncategorized.members.sort((a, b) => a.memberName.localeCompare(b.memberName, "fr"));

  if (uncategorized.members.length > 0) groups.push(uncategorized);
  return groups;
}
