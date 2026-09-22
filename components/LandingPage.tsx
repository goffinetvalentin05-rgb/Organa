"use client";

import HeroSection from "@/components/landing/HeroSection";
import LandingIntroExperience from "@/components/landing/LandingIntroExperience";
import LandingLocaleEffects from "@/components/landing/LandingLocaleEffects";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import SimpleStartSection from "@/components/landing/SimpleStartSection";
import CommitteePlatformSection from "@/components/landing/CommitteePlatformSection";
import ClubGrowthSection from "@/components/landing/ClubGrowthSection";
import ClubEcosystemSection from "@/components/landing/ClubEcosystemSection";
import ClubEstimateSection from "@/components/landing/ClubEstimateSection";
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
        <CommitteePlatformSection />
        <ClubGrowthSection />
        <ClubEcosystemSection />
        <ClubEstimateSection />
        <SimpleStartSection />
        <FaqSection />
        <DemoInviteSection />
        <LandingFooter />
      </div>
    </main>
  );
}
