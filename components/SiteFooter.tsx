"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>{t("footer.copyright")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/connexion" className="text-slate-500 hover:text-slate-700">
            {t("footer.login")}
          </Link>
          <span>·</span>
          <Link href="/inscription" className="text-slate-500 hover:text-slate-700">
            {t("footer.signup")}
          </Link>
          <span>·</span>
          <Link href="/mentions-legales" className="text-slate-500 hover:text-slate-700">
            {t("footer.legal.mentions")}
          </Link>
          <span>·</span>
          <Link href="/politique-confidentialite" className="text-slate-500 hover:text-slate-700">
            {t("footer.legal.privacy")}
          </Link>
          <span>·</span>
          <Link href="/conditions-utilisation" className="text-slate-500 hover:text-slate-700">
            {t("footer.legal.terms")}
          </Link>
          <span>·</span>
          <Link href="/politique-cookies" className="text-slate-500 hover:text-slate-700">
            {t("footer.legal.cookies")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

