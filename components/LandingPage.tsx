"use client";

import HeroSection from "@/components/landing/HeroSection";
import LandingIntroExperience from "@/components/landing/LandingIntroExperience";
import LandingLocaleEffects from "@/components/landing/LandingLocaleEffects";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TimeSavedSection from "@/components/landing/TimeSavedSection";
import ClubsProofSection from "@/components/landing/ClubsProofSection";
import DemoInviteSection from "@/components/landing/DemoInviteSection";
import FaqSection from "@/components/landing/FaqSection";
import { obillzLandingHomeClass } from "@/components/ui/styles";

export default function LandingPage() {
  return (
    <main className={obillzLandingHomeClass}>
      <LandingIntroExperience />
      <div className="relative z-10">
        <LandingLocaleEffects />
        <LandingNav />
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TimeSavedSection />
        <ClubsProofSection />
        <DemoInviteSection />
        <FaqSection />
        <LandingFooter />
      </div>
    </main>
  );
}
