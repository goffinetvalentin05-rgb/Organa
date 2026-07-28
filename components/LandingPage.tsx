"use client";

import { useCallback, useState } from "react";
import HeroSection from "@/components/landing/HeroSection";
import DiscoveryChapter from "@/components/landing/DiscoveryChapter";
import LandingIntroExperience from "@/components/landing/LandingIntroExperience";
import LandingLocaleEffects from "@/components/landing/LandingLocaleEffects";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import { obillzLandingHomeClass } from "@/components/ui/styles";

export default function LandingPage() {
  const [introReady, setIntroReady] = useState(false);
  const handleIntroReady = useCallback(() => setIntroReady(true), []);

  return (
    <main className={obillzLandingHomeClass}>
      <LandingIntroExperience onReady={handleIntroReady} />
      <div className="relative z-10">
        <LandingLocaleEffects />
        <LandingNav />
        <HeroSection introReady={introReady} />
        <div className="landing-light-zone">
          <FeaturesSection />
          <DiscoveryChapter />
          <PricingSection />
        </div>

        <div className="landing-page-end">
          <LandingFooter />
        </div>
      </div>
    </main>
  );
}
