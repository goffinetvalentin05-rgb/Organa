"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";
import { easePremium } from "@/components/landing/landing-motion";

const linkKeys = [
  { href: "#modules", key: "marketing.nav.modules" },
  { href: "#comment-ca-marche", key: "marketing.nav.howItWorks" },
  { href: "#tarifs", key: "marketing.nav.pricing" },
  { href: "#faq", key: "marketing.nav.faq" },
] as const;

export default function LandingNav() {
  const { t } = useI18n();

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6 sm:pt-5 md:px-8 md:pt-6 lg:pt-7">
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easePremium }}
        className="flex h-11 w-full max-w-[min(100%,24rem)] items-center justify-between gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3.5 shadow-[0_12px_48px_rgba(0,0,0,0.35),0_4px_24px_rgba(26,35,255,0.12),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl sm:h-12 sm:max-w-[min(100%,32rem)] sm:gap-3 sm:px-4 md:max-w-[min(100%,48rem)] md:px-5 lg:grid lg:h-14 lg:max-w-[min(100%,1060px)] lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-4 lg:px-8 xl:max-w-[min(100%,1100px)]"
      >
        <Link
          href="/"
          className="flex shrink-0 items-center transition hover:opacity-90 lg:justify-self-start"
        >
          <Image
            src="/obillz-logo.png"
            alt="Obillz"
            width={200}
            height={48}
            priority
            className="h-8 w-auto sm:h-8 lg:h-9"
          />
        </Link>

        <nav
          className="hidden items-center justify-center gap-6 lg:flex xl:gap-8"
          aria-label="Navigation"
        >
          {linkKeys.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-white/60 transition hover:text-white/95 xl:text-sm"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:justify-self-end lg:gap-3">
          <LanguageSwitcher compact />
          <Link
            href="/connexion"
            className="shrink-0 whitespace-nowrap rounded-full border border-white/30 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/45 hover:bg-white/[0.1] sm:px-3.5 sm:py-1.5 sm:text-[13px] lg:px-5 lg:py-2 lg:text-sm"
          >
            {t("marketing.nav.login")}
          </Link>
        </div>
      </motion.header>
    </div>
  );
}
