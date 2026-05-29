"use client";

import { useI18n } from "@/components/I18nProvider";
import { MEMBER_ROLE_SLUGS, formatRoleLabel } from "@/lib/members/taxonomy";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export default function MemberRoleSelect({
  value,
  onChange,
  className = "input-obillz",
  disabled = false,
}: Props) {
  const { t } = useI18n();

  const slugs = new Set<string>(MEMBER_ROLE_SLUGS);
  if (value && !slugs.has(value)) {
    slugs.add(value);
  }

  const knownRoles = new Set<string>(MEMBER_ROLE_SLUGS);
  const ordered = [
    ...MEMBER_ROLE_SLUGS,
    ...[...slugs].filter((s) => !knownRoles.has(s)),
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className}
    >
      {ordered.map((slug) => (
        <option key={slug} value={slug}>
          {formatRoleLabel(slug, t)}
        </option>
      ))}
    </select>
  );
}
