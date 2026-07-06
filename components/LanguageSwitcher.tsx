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
  /** Thème navbar landing — contraste sur fond clair ou sombre */
  theme?: "dark" | "light";
};

export default function LanguageSwitcher({ compact = false, theme = "dark" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const isLight = theme === "light";

  return (
    <div
      className={`flex items-center rounded-full border backdrop-blur-md transition-colors duration-300 ${
        isLight
          ? "border-slate-200/90 bg-white/70 shadow-sm"
          : "border-white/15 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
      } ${compact ? "p-px" : "p-0.5"}`}
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
                ? isLight
                  ? "bg-[#2563EB] text-white shadow-[0_4px_12px_rgba(37,99,235,0.22)]"
                  : compact
                    ? "bg-white/95 text-[#1A23FF] shadow-[0_0_8px_rgba(26,35,255,0.25)]"
                    : "bg-white text-[#1A23FF] shadow-[0_0_16px_rgba(26,35,255,0.35)]"
                : isLight
                  ? "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
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
