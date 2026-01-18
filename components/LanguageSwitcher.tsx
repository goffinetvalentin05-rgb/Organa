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
    <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      {options.map((option) => {
        const isActive = locale === option.code;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLocale(option.code)}
            aria-pressed={isActive}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              isActive ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

