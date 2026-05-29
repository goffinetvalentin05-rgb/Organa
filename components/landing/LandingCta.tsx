"use client";

import { motion } from "framer-motion";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { LandingPrimaryButton, LandingSecondaryButton } from "@/components/landing/LandingButtons";

type LandingCtaProps = {
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  compact?: boolean;
};

export default function LandingCta({
  title = "Prêt à simplifier la gestion de votre club ?",
  subtitle,
  primaryLabel = "Créer mon club gratuitement",
  primaryHref = "/inscription",
  secondaryLabel = "Découvrir la plateforme",
  secondaryHref = "#comparaison",
  compact = false,
}: LandingCtaProps) {
  return (
    <ScrollReveal className={compact ? "mt-12 md:mt-14" : "mt-16 md:mt-20"} scale>
      <div
        className={`relative overflow-hidden rounded-[1.75rem] border border-white/22 bg-gradient-to-br from-white/[0.14] via-white/[0.06] to-[#1A23FF]/[0.08] text-center shadow-[0_24px_56px_rgba(2,6,23,0.32)] backdrop-blur-xl ${
          compact ? "px-6 py-9 md:px-12 md:py-11" : "px-6 py-12 md:px-14 md:py-14"
        }`}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/[0.1] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#1A23FF]/25 blur-3xl"
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <p
          className={`relative font-black text-white ${compact ? "text-xl md:text-2xl lg:text-3xl" : "text-2xl md:text-3xl lg:text-4xl"}`}
        >
          {title}
        </p>
        {subtitle ? (
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-blue-100/85 md:text-base">{subtitle}</p>
        ) : null}
        <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <LandingPrimaryButton href={primaryHref}>{primaryLabel}</LandingPrimaryButton>
          {secondaryLabel ? (
            <LandingSecondaryButton href={secondaryHref}>{secondaryLabel}</LandingSecondaryButton>
          ) : null}
        </div>
      </div>
    </ScrollReveal>
  );
}
