"use client";

import Hero from "@/components/Hero";
import ComparisonSection from "@/components/ComparisonSection";
import ShowcaseSliderSection from "@/components/ShowcaseSliderSection";
import GetStartedStepsSection from "@/components/GetStartedStepsSection";
import PricingSection from "@/components/PricingSection";
import FaqSection from "@/components/FaqSection";
import FinalLandingCta from "@/components/FinalLandingCta";
import LandingFooter from "@/components/LandingFooter";

export default function LandingPage() {
  return (
    <main className="relative isolate min-h-screen bg-white text-slate-900">
      <div className="relative z-10">
        <Hero />
      </div>

      <div className="relative z-10 bg-white pt-10">
        <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
          <ComparisonSection />
          <ShowcaseSliderSection />
          <GetStartedStepsSection />
          <PricingSection />
          <FaqSection />
          <FinalLandingCta />
        </div>
        <LandingFooter />
      </div>
    </main>
  );
}
