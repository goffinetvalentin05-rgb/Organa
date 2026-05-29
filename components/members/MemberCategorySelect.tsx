"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import {
  MEMBER_CATEGORY_OTHER,
  MEMBER_CATEGORY_SLUGS,
  formatCategoryLabel,
  parseCategoryFromDb,
  serializeCategory,
} from "@/lib/members/taxonomy";

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
  allowEmpty?: boolean;
  className?: string;
  selectClassName?: string;
  disabled?: boolean;
  emptyOptionLabel?: string;
};

export default function MemberCategorySelect({
  value,
  onChange,
  allowEmpty = false,
  className,
  selectClassName = "input-obillz",
  disabled = false,
  emptyOptionLabel,
}: Props) {
  const { t } = useI18n();
  const parsed = parseCategoryFromDb(value);
  const [select, setSelect] = useState(parsed.select);
  const [custom, setCustom] = useState(parsed.custom);

  useEffect(() => {
    const next = parseCategoryFromDb(value);
    setSelect(next.select);
    setCustom(next.custom);
  }, [value]);

  const emit = (nextSelect: string, nextCustom: string) => {
    onChange(serializeCategory(nextSelect, nextCustom));
  };

  return (
    <div className={className ? `${className} space-y-2` : "space-y-2"}>
      <select
        value={select}
        onChange={(e) => {
          const next = e.target.value;
          setSelect(next);
          if (next !== MEMBER_CATEGORY_OTHER) {
            setCustom("");
          }
          emit(next, next === MEMBER_CATEGORY_OTHER ? custom : "");
        }}
        disabled={disabled}
        className={selectClassName}
      >
        {allowEmpty && (
          <option value="">
            {emptyOptionLabel || t("dashboard.clients.filters.allCategories")}
          </option>
        )}
        {MEMBER_CATEGORY_SLUGS.map((slug) => (
          <option key={slug} value={slug}>
            {formatCategoryLabel(slug, t)}
          </option>
        ))}
      </select>

      {select === MEMBER_CATEGORY_OTHER && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            {t("dashboard.clients.categoryCustomLabel")}
          </label>
          <input
            type="text"
            value={custom}
            onChange={(e) => {
              const next = e.target.value;
              setCustom(next);
              emit(MEMBER_CATEGORY_OTHER, next);
            }}
            disabled={disabled}
            placeholder={t("dashboard.clients.categoryCustomPlaceholder")}
            className={selectClassName}
            maxLength={120}
          />
        </div>
      )}
    </div>
  );
}
