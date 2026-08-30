"use client";

import HeroSection from "@/components/landing/HeroSection";
import LandingIntroExperience from "@/components/landing/LandingIntroExperience";
import LandingLocaleEffects from "@/components/landing/LandingLocaleEffects";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SimpleStartSection from "@/components/landing/SimpleStartSection";
import StorySequenceSection from "@/components/landing/StorySequenceSection";
import ClubEcosystemSection from "@/components/landing/ClubEcosystemSection";
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
        <StorySequenceSection />
        <ClubEcosystemSection />
        <HowItWorksSection />
        <SimpleStartSection />
        <FaqSection />
        <DemoInviteSection />
        <LandingFooter />
      </div>
    </main>
  );
}
