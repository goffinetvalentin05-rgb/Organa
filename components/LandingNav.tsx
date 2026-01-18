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
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-full bg-slate-900 p-2 shadow-[0_10px_24px_rgba(15,23,42,0.25)]">
              <div className="relative h-14 w-14">
              <Image
                src="/organa-logo.png"
                alt="Organa Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/connexion"
              className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              {t("nav.cta")}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
