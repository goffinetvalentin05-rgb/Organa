"use client";

import Image from "next/image";
import Link from "next/link";
import FinalCtaSection from "@/components/landing/FinalCtaSection";
import HeroHandVisual from "@/components/landing/HeroHandVisual";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LandingBackground from "@/components/landing/LandingBackground";
import LandingNav from "@/components/landing/LandingNav";
import ModulesSection from "@/components/landing/ModulesSection";
import ProblemSection from "@/components/landing/ProblemSection";
import FaqSection from "@/components/landing/FaqSection";
import PricingSection from "@/components/landing/PricingSection";
import {
  obillzLandingGridOverlayClass,
  obillzLandingRootClass,
} from "@/components/ui/styles";

function SwissFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Drapeau suisse"
      role="img"
    >
      <rect width="32" height="32" fill="#DA291C" />
      <path d="M13.5 7h5v5.5H24v5h-5.5V23h-5v-5.5H8v-5h5.5z" fill="#FFFFFF" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className={obillzLandingRootClass}>
      <LandingBackground />
      <div className={obillzLandingGridOverlayClass} aria-hidden />

      <div className="relative z-10">
        <LandingNav />
        <HeroSection />
        <ProblemSection />
        <ModulesSection />
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
        <HeroHandVisual />

        <footer className="relative z-10 border-t border-white/[0.06] bg-[#020409]/80 py-10 backdrop-blur-md">
          <div className="mx-auto flex w-[94%] max-w-[1160px] flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <Link href="/" className="inline-block opacity-90 transition hover:opacity-100">
                <Image src="/logo-obillz.png" alt="Obillz" width={110} height={26} />
              </Link>
              <p className="mt-3 max-w-xs text-sm text-blue-100/55">
                Logiciel de gestion pour clubs sportifs — membres, cotisations, factures et
                événements.
              </p>
              <div className="mt-4 flex items-center gap-2.5">
                <SwissFlag className="h-5 w-5 rounded-[3px]" />
                <span className="text-xs text-blue-100/50">Conçu en Suisse</span>
              </div>
            </div>

            <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm" aria-label="Liens">
              <Link href="/inscription" className="text-blue-100/70 transition hover:text-white">
                Tester gratuitement
              </Link>
              <Link href="/connexion" className="text-blue-100/70 transition hover:text-white">
                Connexion
              </Link>
              <Link
                href="/conditions-utilisation"
                className="text-blue-100/70 transition hover:text-white"
              >
                Conditions
              </Link>
              <Link
                href="/politique-confidentialite"
                className="text-blue-100/70 transition hover:text-white"
              >
                Confidentialité
              </Link>
            </nav>
          </div>
          <p className="mx-auto mt-8 w-[94%] max-w-[1160px] text-center text-xs text-blue-100/40">
            © {new Date().getFullYear()} Obillz
          </p>
        </footer>
      </div>
    </main>
  );
}
