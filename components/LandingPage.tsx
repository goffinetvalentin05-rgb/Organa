"use client";

import Hero from "@/components/Hero";
import ComparisonSection from "@/components/ComparisonSection";
import ShowcaseSliderSection from "@/components/ShowcaseSliderSection";
import GetStartedStepsSection from "@/components/GetStartedStepsSection";
import FaqSection from "@/components/FaqSection";
import FinalLandingCta from "@/components/FinalLandingCta";

export default function LandingPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden text-slate-100">
      <div className="relative z-10">
        <Hero />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <ComparisonSection />
        <ShowcaseSliderSection />
        <GetStartedStepsSection />
        <FaqSection />
        <FinalLandingCta />
      </div>
    </main>
  );
}
