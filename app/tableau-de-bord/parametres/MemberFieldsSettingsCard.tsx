"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/components/I18nProvider";
import {
  DEFAULT_MEMBER_FIELDS,
  MEMBER_FIELD_KEYS,
  type MemberFieldKey,
  type MemberFieldsMerged,
} from "@/lib/member-fields/types";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";

const FIELD_ORDER: MemberFieldKey[] = [
  "email",
  "phone",
  "address",
  "birth_date",
  "category",
  "role",
  "avs_number",
];

type MemberFieldsSettingsCardProps = {
  /** Intégré dans un accordéon : pas de carte externe ni titre dupliqué. */
  embedded?: boolean;
};

export default function MemberFieldsSettingsCard({
  embedded = false,
}: MemberFieldsSettingsCardProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [fields, setFields] = useState<MemberFieldsMerged>(DEFAULT_MEMBER_FIELDS);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [permRes, setRes] = await Promise.all([
        fetch("/api/me/permissions", { cache: "no-store" }),
        fetch("/api/club/member-field-settings", { cache: "no-store" }),
      ]);
      if (permRes.ok) {
        const p = await permRes.json();
        setCanSave(p?.permissions?.access_settings === true);
      } else {
        setCanSave(false);
      }
      if (setRes.ok) {
        const j = await setRes.json();
        if (j?.fields && typeof j.fields === "object") {
          const next = { ...DEFAULT_MEMBER_FIELDS };
          for (const k of MEMBER_FIELD_KEYS) {
            const v = j.fields[k];
            if (v && typeof v.enabled === "boolean") {
              next[k] = {
                enabled: v.enabled,
                required: !!v.required,
              };
            }
          }
          setFields(next);
        }
      }
    } catch {
      toast.error(t("dashboard.settings.memberFields.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (key: MemberFieldKey, enabled: boolean) => {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled },
    }));
  };

  const handleSave = async () => {
    if (!canSave) {
      toast.error(t("dashboard.settings.memberFields.saveForbidden"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/club/member-field-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          (data as { error?: string }).error ||
            t("dashboard.settings.memberFields.saveError")
        );
        return;
      }
      if (data?.fields) {
        setFields(data.fields as MemberFieldsMerged);
      }
      toast.success(t("dashboard.settings.memberFields.saveSuccess"));
    } catch {
      toast.error(t("dashboard.settings.memberFields.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const labelKey = (k: MemberFieldKey) =>
    `dashboard.settings.memberFields.fields.${k}` as const;

  const shellClass = embedded
    ? "space-y-5"
    : "space-y-5 rounded-2xl border border-slate-200 bg-white p-6";

  return (
    <div className={shellClass}>
      {!embedded ? (
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {t("dashboard.settings.memberFields.title")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t("dashboard.settings.memberFields.subtitle")}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-600">{t("dashboard.settings.memberFields.subtitle")}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">{t("dashboard.common.loading")}</p>
      ) : (
        <>
          <ul className="space-y-3">
            {FIELD_ORDER.map((key) => (
              <li
                key={key}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 bg-white text-[var(--obillz-hero-blue)] focus:ring-[var(--obillz-hero-blue)]/35"
                      checked={fields[key].enabled}
                      disabled={!canSave}
                      onChange={(e) => toggle(key, e.target.checked)}
                    />
                    <span>
                      <span className="block font-medium text-slate-900">{t(labelKey(key))}</span>
                      {key === "avs_number" && (
                        <span className="mt-1 block rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
                          {t("dashboard.settings.memberFields.avsWarning")}
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              </li>
            ))}
          </ul>

          {!canSave && (
            <p className="text-sm text-slate-600">{t("dashboard.settings.memberFields.readOnlyHint")}</p>
          )}

          <div className="pt-2">
            <DashboardPrimaryButton
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              icon="none"
              className="w-full sm:w-auto justify-center"
            >
              {saving
                ? t("dashboard.common.saving")
                : t("dashboard.settings.memberFields.save")}
            </DashboardPrimaryButton>
          </div>
        </>
      )}
    </div>
  );
}
