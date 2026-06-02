"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";
import { easePremium } from "@/components/landing/landing-motion";

const linkKeys = [
  { href: "#probleme", key: "marketing.nav.problem" },
  { href: "#modules", key: "marketing.nav.modules" },
  { href: "#comment-ca-marche", key: "marketing.nav.howItWorks" },
  { href: "#tarifs", key: "marketing.nav.pricing" },
  { href: "#faq", key: "marketing.nav.faq" },
] as const;

export default function LandingNav() {
  const { t } = useI18n();

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 sm:pt-4 md:pt-5">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easePremium }}
        className="flex w-full max-w-[920px] items-center justify-between gap-2 rounded-full border border-white/25 bg-white/[0.12] px-3 py-2 shadow-[0_8px_40px_rgba(26,35,255,0.18),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl sm:gap-3 sm:px-4 sm:py-2.5 md:px-5 md:py-3"
      >
        <Link href="/" className="flex shrink-0 items-center transition hover:opacity-90">
          <Image
            src="/logo-obillz.png"
            alt="Obillz"
            width={145}
            height={38}
            priority
            className="h-10 w-auto md:h-12"
          />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigation">
          {linkKeys.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <Link
            href="/connexion"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:px-3.5 sm:py-2 sm:text-sm"
          >
            {t("marketing.nav.login")}
          </Link>
        </div>
      </motion.header>
    </div>
  );
}
