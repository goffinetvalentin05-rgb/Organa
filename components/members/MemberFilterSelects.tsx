"use client";

import { useMemo } from "react";
import { dashboardInputSmClass } from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";
import {
  MEMBER_ROLE_SLUGS,
  buildCategoryFilterOptions,
  formatRoleLabel,
} from "@/lib/members/taxonomy";

type MemberRow = { role: string; category: string | null };

type Props = {
  members: MemberRow[];
  roleFilter: string;
  categoryFilter: string;
  onRoleFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  showRole?: boolean;
  showCategory?: boolean;
  className?: string;
};

export default function MemberFilterSelects({
  members,
  roleFilter,
  categoryFilter,
  onRoleFilterChange,
  onCategoryFilterChange,
  showRole = true,
  showCategory = true,
  className = dashboardInputSmClass,
}: Props) {
  const { t } = useI18n();

  const roleOptions = useMemo(() => {
    const slugs = new Set<string>(MEMBER_ROLE_SLUGS);
    for (const m of members) {
      if (m.role?.trim()) slugs.add(m.role.trim());
    }
    const knownRoles = new Set<string>(MEMBER_ROLE_SLUGS);
    const ordered = [
      ...MEMBER_ROLE_SLUGS,
      ...[...slugs].filter((s) => !knownRoles.has(s)),
    ];
    return ordered.map((slug) => ({
      value: slug,
      label: formatRoleLabel(slug, t),
    }));
  }, [members, t]);

  const categoryOptions = useMemo(
    () => buildCategoryFilterOptions(members, t),
    [members, t]
  );

  return (
    <>
      {showRole && (
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className={className}
        >
          <option value="">{t("dashboard.clients.filters.allRoles")}</option>
          {roleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      {showCategory && (
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className={className}
        >
          <option value="">{t("dashboard.clients.filters.allCategories")}</option>
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </>
  );
}
