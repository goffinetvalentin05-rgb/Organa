"use client";

import HeroSection from "@/components/landing/HeroSection";
import AskChatGptSection from "@/components/landing/AskChatGptSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LandingLocaleEffects from "@/components/landing/LandingLocaleEffects";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import FaqSection from "@/components/landing/FaqSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import { obillzLandingHomeClass } from "@/components/ui/styles";

export default function LandingPage() {
  return (
    <main className={obillzLandingHomeClass}>
      <div className="relative z-10">
        <LandingLocaleEffects />
        <LandingNav />
        <HeroSection />
        <div className="landing-light-zone">
          <FeaturesSection />
          <HowItWorksSection />
          <SocialProofSection />
          <PricingSection />
          <FaqSection />
        </div>

        <div className="landing-page-end">
          <AskChatGptSection />
          <LandingFooter />
        </div>
      </div>
    </main>
  );
}
