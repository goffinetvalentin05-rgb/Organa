"use client";

import ScrollReveal from "@/components/landing/ScrollReveal";
import { LandingPrimaryButton, LandingSecondaryButton } from "@/components/landing/LandingButtons";
import { landingPremiumCardClass, landingPremiumCardDescClass } from "@/components/ui/styles";

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
        className={`${landingPremiumCardClass} text-center ${
          compact ? "px-6 py-9 md:px-12 md:py-11" : "px-6 py-12 md:px-14 md:py-14"
        }`}
      >
        <p
          className={`relative font-black text-[#F8FAFC] ${compact ? "text-xl md:text-2xl lg:text-3xl" : "text-2xl md:text-3xl lg:text-4xl"}`}
        >
          {title}
        </p>
        {subtitle ? (
          <p className={`relative mx-auto mt-3 max-w-lg text-sm md:text-base ${landingPremiumCardDescClass}`}>{subtitle}</p>
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
