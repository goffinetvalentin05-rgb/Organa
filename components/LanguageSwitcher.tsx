"use client";

import { Locale } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";

const options: { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className="flex items-center rounded-full border border-white/20 bg-white/10 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-md"
      role="group"
      aria-label="Langue"
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
                ? "bg-white text-[var(--obillz-hero-blue)] shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
                : "text-white/75 hover:text-white hover:bg-white/10"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
