"use client";

import { Locale } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";

const options: { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="flex items-center rounded-full border border-white/20 bg-white/[0.08] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md"
      role="group"
      aria-label={t("common.languageSelector")}
    >
      {options.map((option) => {
        const isActive = locale === option.code;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLocale(option.code)}
            aria-pressed={isActive}
            className={`relative min-w-[2.25rem] rounded-full px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-200 ${
              isActive
                ? "bg-white text-[#1A23FF] shadow-[0_0_16px_rgba(26,35,255,0.35)]"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
