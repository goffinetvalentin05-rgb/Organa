"use client";

import Link from "next/link";
import ScrollReveal from "@/components/landing/ScrollReveal";

type LandingCtaProps = {
  title?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  compact?: boolean;
};

export default function LandingCta({
  title = "Prêt à simplifier la gestion de votre club ?",
  primaryLabel = "Créer mon club gratuitement",
  primaryHref = "/inscription",
  secondaryLabel = "Découvrir la plateforme",
  secondaryHref = "#comparaison",
  compact = false,
}: LandingCtaProps) {
  return (
    <ScrollReveal className={compact ? "mt-12" : "mt-16 md:mt-20"}>
      <div
        className={`relative overflow-hidden rounded-[1.5rem] border border-white/18 bg-gradient-to-br from-white/[0.11] via-white/[0.05] to-transparent text-center backdrop-blur-xl ${
          compact ? "px-6 py-8 md:px-10 md:py-10" : "px-6 py-10 md:px-12 md:py-12"
        }`}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.08] blur-3xl"
          aria-hidden
        />
        <p className={`relative font-black text-white ${compact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"}`}>
          {title}
        </p>
        <div className="relative mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={primaryHref}
            className="inline-flex w-full max-w-sm items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#1A23FF] shadow-[0_14px_30px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 sm:w-auto md:text-base"
          >
            {primaryLabel}
          </Link>
          {secondaryLabel ? (
            <a
              href={secondaryHref}
              className="inline-flex w-full max-w-sm items-center justify-center rounded-full border border-white/40 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto md:text-base"
            >
              {secondaryLabel}
            </a>
          ) : null}
        </div>
      </div>
    </ScrollReveal>
  );
}
