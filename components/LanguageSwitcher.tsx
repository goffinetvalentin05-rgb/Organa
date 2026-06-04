"use client";

import { Locale } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";

const options: { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

type LanguageSwitcherProps = {
  /** Variante discrète pour la navbar landing */
  compact?: boolean;
};

export default function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={`flex items-center rounded-full border bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md ${
        compact
          ? "border-white/15 p-px"
          : "border-white/20 p-0.5"
      }`}
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
            className={`relative rounded-full font-semibold uppercase transition-all duration-200 ${
              compact
                ? "min-w-[1.75rem] px-1.5 py-[3px] text-[10px] leading-none tracking-[0.06em] sm:min-w-[1.85rem] sm:px-[7px] sm:py-0.5 sm:text-[10px]"
                : "min-w-[2.25rem] px-2.5 py-1.5 text-[11px] tracking-[0.12em]"
            } ${
              isActive
                ? compact
                  ? "bg-white/95 text-[#1A23FF] shadow-[0_0_8px_rgba(26,35,255,0.25)]"
                  : "bg-white text-[#1A23FF] shadow-[0_0_16px_rgba(26,35,255,0.35)]"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
