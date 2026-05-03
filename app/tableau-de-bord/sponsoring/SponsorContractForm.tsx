"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/components/I18nProvider";
import { GlassCard } from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { addMonthsToStartDate, buildDefaultContractTemplate } from "@/lib/sponsor-contracts";

export type SponsorContractFormValues = {
  sponsorName: string;
  title: string;
  amount: string;
  startDate: string;
  endMode: "fixed" | "duration";
  endDate: string;
  durationMonths: string;
  content: string;
  sponsorType: "" | "gold" | "silver" | "bronze";
};

const defaultForm: SponsorContractFormValues = {
  sponsorName: "",
  title: "",
  amount: "",
  startDate: "",
  endMode: "fixed",
  endDate: "",
  durationMonths: "12",
  content: "",
  sponsorType: "",
};

type Props = {
  clubName: string;
  defaultValues?: Partial<SponsorContractFormValues>;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (payload: {
    sponsorName: string;
    title: string;
    content: string;
    amount: number | null;
    startDate: string;
    endDate: string;
    sponsorType: "" | "gold" | "silver" | "bronze";
  }) => Promise<void>;
};

export default function SponsorContractForm({
  clubName,
  defaultValues,
  submitLabel,
  savingLabel,
  onSubmit,
}: Props) {
  const { t } = useI18n();
  const [values, setValues] = useState<SponsorContractFormValues>({
    ...defaultForm,
    ...defaultValues,
  });
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof SponsorContractFormValues) =>
    (v: string | SponsorContractFormValues["endMode"] | SponsorContractFormValues["sponsorType"]) => {
      setValues((prev) => ({ ...prev, [key]: v }));
    };

  const insertTemplate = () => {
    const sponsor = values.sponsorName.trim() || "[Nom du sponsor]";
    setValues((prev) => ({
      ...prev,
      content: buildDefaultContractTemplate({ clubName, sponsorName: sponsor }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sponsorName = values.sponsorName.trim();
    const title = values.title.trim();
    if (!sponsorName || !title) {
      toast.error(t("dashboard.sponsoring.form.validationSponsor"));
      return;
    }
    if (!values.startDate) {
      toast.error(t("dashboard.sponsoring.form.validationDates"));
      return;
    }

    let endDate = values.endDate;
    if (values.endMode === "duration") {
      const months = Number(values.durationMonths);
      if (!Number.isFinite(months) || months < 1) {
        toast.error(t("dashboard.sponsoring.form.validationDates"));
        return;
      }
      endDate = addMonthsToStartDate(values.startDate, months);
    }
    if (!endDate || values.startDate > endDate) {
      toast.error(t("dashboard.sponsoring.form.validationDates"));
      return;
    }

    let amount: number | null = null;
    if (values.amount.trim() !== "") {
      const n = Number(values.amount.replace(",", "."));
      if (!Number.isFinite(n) || n < 0) {
        toast.error(t("dashboard.sponsoring.form.createError"));
        return;
      }
      amount = n;
    }

    setSaving(true);
    try {
      await onSubmit({
        sponsorName,
        title,
        content: values.content,
        amount,
        startDate: values.startDate,
        endDate,
        sponsorType: values.sponsorType,
      });
    } catch {
      /* toast côté parent */
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <GlassCard className="p-6 sm:p-8">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.sponsoring.form.sponsorName")} *
              <input
                className="input-obillz mt-1.5 w-full"
                value={values.sponsorName}
                onChange={(e) => set("sponsorName")(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.sponsoring.form.contractTitle")} *
              <input
                className="input-obillz mt-1.5 w-full"
                value={values.title}
                onChange={(e) => set("title")(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.sponsoring.form.sponsorType")}
              <select
                className="input-obillz mt-1.5 w-full"
                value={values.sponsorType}
                onChange={(e) =>
                  set("sponsorType")(e.target.value as SponsorContractFormValues["sponsorType"])
                }
              >
                <option value="">{t("dashboard.sponsoring.form.sponsorTypeNone")}</option>
                <option value="gold">{t("dashboard.sponsoring.sponsorTypes.gold")}</option>
                <option value="silver">{t("dashboard.sponsoring.sponsorTypes.silver")}</option>
                <option value="bronze">{t("dashboard.sponsoring.sponsorTypes.bronze")}</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.sponsoring.form.amount")}
              <input
                type="number"
                min={0}
                step="0.01"
                className="input-obillz mt-1.5 w-full"
                value={values.amount}
                onChange={(e) => set("amount")(e.target.value)}
                placeholder="0.00"
              />
              <span className="mt-1 block text-xs text-slate-500">{t("dashboard.sponsoring.form.amountHint")}</span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.sponsoring.form.startDate")} *
              <input
                type="date"
                className="input-obillz mt-1.5 w-full"
                value={values.startDate}
                onChange={(e) => set("startDate")(e.target.value)}
                required
              />
            </label>
          </div>

          <fieldset className="mt-6 space-y-3">
            <legend className="text-sm font-medium text-slate-700">{t("dashboard.sponsoring.form.endDate")}</legend>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="endMode"
                checked={values.endMode === "fixed"}
                onChange={() => set("endMode")("fixed")}
              />
              {t("dashboard.sponsoring.form.endModeFixed")}
            </label>
            {values.endMode === "fixed" ? (
              <input
                type="date"
                className="input-obillz w-full max-w-xs"
                value={values.endDate}
                onChange={(e) => set("endDate")(e.target.value)}
                required={values.endMode === "fixed"}
              />
            ) : null}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="endMode"
                checked={values.endMode === "duration"}
                onChange={() => set("endMode")("duration")}
              />
              {t("dashboard.sponsoring.form.endModeDuration")}
            </label>
            {values.endMode === "duration" ? (
              <label className="block max-w-xs text-sm font-medium text-slate-700">
                {t("dashboard.sponsoring.form.durationMonths")}
                <input
                  type="number"
                  min={1}
                  className="input-obillz mt-1.5 w-full"
                  value={values.durationMonths}
                  onChange={(e) => set("durationMonths")(e.target.value)}
                />
              </label>
            ) : null}
          </fieldset>
        </div>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium text-slate-700">{t("dashboard.sponsoring.form.content")}</label>
            <button
              type="button"
              onClick={insertTemplate}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {t("dashboard.sponsoring.form.insertTemplate")}
            </button>
          </div>
          <textarea
            className="input-obillz min-h-[220px] w-full font-mono text-sm"
            value={values.content}
            onChange={(e) => set("content")(e.target.value)}
            placeholder={t("dashboard.sponsoring.form.contentPlaceholder")}
          />
        </div>
      </GlassCard>

      <div className="flex flex-wrap gap-3">
        <DashboardPrimaryButton type="submit" disabled={saving} icon="none">
          {saving ? savingLabel : submitLabel}
        </DashboardPrimaryButton>
      </div>
    </form>
  );
}
