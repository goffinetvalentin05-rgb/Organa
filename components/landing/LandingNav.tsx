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
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-5 pt-5 sm:px-8 sm:pt-6 md:pt-7">
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easePremium }}
        className="grid h-12 w-full max-w-[min(100%,1060px)] grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full border border-white/20 bg-white/[0.08] px-5 shadow-[0_12px_48px_rgba(0,0,0,0.35),0_4px_24px_rgba(26,35,255,0.12),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl sm:h-[3.25rem] sm:max-w-[min(100%,1100px)] sm:gap-4 sm:px-7 md:h-14 md:px-8"
      >
        <Link href="/" className="flex h-full max-h-9 shrink-0 items-center justify-self-start transition hover:opacity-90 sm:max-h-10">
          <Image
            src="/obillz-logo.png"
            alt="Obillz"
            width={200}
            height={48}
            priority
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        <nav
          className="hidden items-center justify-center gap-6 justify-self-center lg:flex xl:gap-8"
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

        <div className="flex shrink-0 items-center justify-self-end gap-2.5 sm:gap-3">
          <LanguageSwitcher compact />
          <Link
            href="/connexion"
            className="rounded-full border border-white/30 bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/45 hover:bg-white/[0.1] xl:px-5 xl:py-2 xl:text-sm"
          >
            {t("marketing.nav.login")}
          </Link>
        </div>
      </motion.header>
    </div>
  );
}
