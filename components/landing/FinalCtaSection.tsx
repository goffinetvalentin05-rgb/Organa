"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import { useI18n } from "@/components/I18nProvider";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import { landingFeaturedCardClass } from "@/components/ui/styles";

export default function FinalCtaSection() {
  const { t } = useI18n();

  return (
    <section id="cta-final" className="relative scroll-mt-24 pb-20 pt-8 md:pb-28">
      <div
        className="pointer-events-none absolute inset-x-[10%] top-1/2 h-64 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.35),transparent_70%)] blur-3xl"
        aria-hidden
      />

      <motion.div
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className={`${landingFeaturedCardClass} landing-glass-card-featured relative mx-auto flex w-[94%] max-w-[820px] flex-col items-center justify-center overflow-hidden px-6 py-10 text-center sm:px-8 sm:py-12 md:px-12 md:py-14`}
      >
        {/* Grille décorative */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(96,165,250,0.8)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,165,250,0.8)_1px,transparent_1px)] [background-size:32px_32px]"
          aria-hidden
        />

        <motion.div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.3),transparent_70%)] blur-3xl"
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.25),transparent_70%)] blur-3xl"
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          aria-hidden
        />

        <div className="relative z-10 w-full">
          <h2 className="text-2xl font-black text-white md:text-4xl">
            {t("marketing.finalCta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-blue-100/80 md:text-base">
            {t("marketing.finalCta.subtitle")}
          </p>
          <div className="mt-8 flex justify-center">
            <LandingPrimaryButton href="/inscription">{t("marketing.finalCta.cta")}</LandingPrimaryButton>
          </div>
          <p className="mt-5 text-xs text-blue-200/55">
            <Link href="/connexion" className="underline-offset-2 hover:text-white hover:underline">
              {t("marketing.finalCta.loginPrompt")}
            </Link>
          </p>
        </div>
      </motion.div>
    </section>
  );
}
