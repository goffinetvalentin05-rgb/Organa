"use client";

import Link from "next/link";
import Image from "next/image";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";

export default function LandingNav() {
  const { t } = useI18n();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-3">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white px-7 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <Link href="/" className="flex items-center">
            <div className="relative -ml-2 h-14 w-72 sm:h-16 sm:w-96">
              <Image
                src="/logo-obillz.png"
                alt={t("landing.nav.logoAlt")}
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/connexion"
              className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
            >
              {t("landing.nav.login")}
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              {t("landing.nav.cta")}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
