"use client";

import FinalCtaSection from "@/components/landing/FinalCtaSection";
import LandingLocaleEffects from "@/components/landing/LandingLocaleEffects";
import LandingFooter from "@/components/landing/LandingFooter";
import HeroHandVisual from "@/components/landing/HeroHandVisual";
import HeroSection from "@/components/landing/HeroSection";
import ObillzFlowSection from "@/components/landing/ObillzFlowSection";
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

export default function LandingPage() {
  return (
    <main className={obillzLandingRootClass}>
      <LandingBackground />
      <div className={obillzLandingGridOverlayClass} aria-hidden />

      <div className="relative z-10">
        <LandingLocaleEffects />
        <LandingNav />
        <HeroSection />
        <ObillzFlowSection />
        <ProblemSection />
        <ModulesSection />
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
        <HeroHandVisual />

        <LandingFooter />
      </div>
    </main>
  );
}
